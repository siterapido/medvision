#!/usr/bin/env python3
"""
PDF Extraction with Smart Splitting
Handles large PDFs by splitting them into smaller chunks
"""

import os
import sys
import json
import logging
from pathlib import Path
from typing import List, Tuple

import pdfplumber
import PyPDF2

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

class PDFSplitter:
    """Split large PDFs into manageable chunks"""

    @staticmethod
    def get_pdf_size_mb(pdf_path: str) -> float:
        """Get PDF file size in MB"""
        return os.path.getsize(pdf_path) / (1024 * 1024)

    @staticmethod
    def get_pdf_page_count(pdf_path: str) -> int:
        """Get number of pages in PDF"""
        try:
            with pdfplumber.open(pdf_path) as pdf:
                return len(pdf.pages)
        except Exception as e:
            logger.error(f"Error reading PDF {pdf_path}: {e}")
            return 0

    @staticmethod
    def split_pdf_by_pages(
        input_path: str,
        output_dir: str,
        pages_per_chunk: int = 50
    ) -> List[str]:
        """Split PDF into multiple files by page count"""

        pdf_reader = PyPDF2.PdfReader(input_path)
        total_pages = len(pdf_reader.pages)

        if total_pages <= pages_per_chunk:
            logger.info(f"PDF has {total_pages} pages, no split needed")
            return [input_path]

        split_files = []
        num_chunks = (total_pages + pages_per_chunk - 1) // pages_per_chunk

        logger.info(f"Splitting {total_pages} pages into {num_chunks} chunks")

        os.makedirs(output_dir, exist_ok=True)
        input_filename = Path(input_path).stem

        for chunk_num in range(num_chunks):
            start_page = chunk_num * pages_per_chunk
            end_page = min((chunk_num + 1) * pages_per_chunk, total_pages)

            pdf_writer = PyPDF2.PdfWriter()

            for page_num in range(start_page, end_page):
                pdf_writer.add_page(pdf_reader.pages[page_num])

            output_filename = f"{input_filename}_part{chunk_num + 1:02d}.pdf"
            output_path = os.path.join(output_dir, output_filename)

            with open(output_path, 'wb') as output_file:
                pdf_writer.write(output_file)

            split_files.append(output_path)
            logger.info(f"  Created: {output_filename} (pages {start_page + 1}-{end_page})")

        return split_files


class PDFExtractor:
    """Extract text from PDF files"""

    def __init__(self, admin_key: str, app_url: str = "http://localhost:3000"):
        self.admin_key = admin_key
        self.app_url = app_url
        self.ingestion_endpoint = f"{app_url}/api/admin/ingest-document"
        self.splitter = PDFSplitter()

    def extract_text_from_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF file"""
        try:
            text_parts = []
            with pdfplumber.open(pdf_path) as pdf:
                for i, page in enumerate(pdf.pages):
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)

                    # Log progress for large files
                    if (i + 1) % 10 == 0:
                        logger.debug(f"  Extracted {i + 1} pages...")

            if not text_parts:
                logger.warning(f"No text extracted from {pdf_path}")
                return ""

            return "\n".join(text_parts).strip()
        except Exception as e:
            logger.error(f"Error extracting PDF {pdf_path}: {e}")
            return ""

    def process_pdf(self, pdf_path: str, specialty: str = None) -> bool:
        """Process a single PDF - may split if large"""

        pdf_file = Path(pdf_path)
        size_mb = self.splitter.get_pdf_size_mb(pdf_path)
        page_count = self.splitter.get_pdf_page_count(pdf_path)

        logger.info(f"Processing: {pdf_file.name} ({size_mb:.1f}MB, {page_count} pages)")

        # Split if larger than 50MB or more than 200 pages
        if size_mb > 50 or page_count > 200:
            logger.info(f"  → Large file detected, splitting...")
            temp_dir = str(pdf_file.parent / f".temp_{pdf_file.stem}")
            split_files = self.splitter.split_pdf_by_pages(pdf_path, temp_dir, pages_per_chunk=50)

            all_success = True
            for split_file in split_files:
                if not self._process_split_pdf(split_file, specialty, pdf_file.stem):
                    all_success = False

            # Cleanup temp files
            import shutil
            if os.path.exists(temp_dir):
                shutil.rmtree(temp_dir)

            return all_success
        else:
            return self._process_split_pdf(pdf_path, specialty, pdf_file.stem)

    def _process_split_pdf(self, pdf_path: str, specialty: str, original_name: str) -> bool:
        """Process a single PDF file (already split if necessary)"""

        pdf_file = Path(pdf_path)

        # Extract text
        text = self.extract_text_from_pdf(pdf_path)
        if not text or len(text) < 100:
            logger.warning(f"Skipping {pdf_file.name} - insufficient content")
            return False

        # Get title
        title = pdf_file.stem.replace('_', ' ').replace('Cópia de ', '')

        # Ingest
        import requests
        payload = {
            "title": title,
            "content": text,
            "sourceType": "textbook",
            "sourceName": original_name,
            "specialty": specialty,
            "author": "Unknown"
        }

        try:
            response = requests.post(
                self.ingestion_endpoint,
                json=payload,
                headers={
                    "Content-Type": "application/json",
                    "Authorization": f"Bearer {self.admin_key}"
                },
                timeout=120
            )

            if response.status_code == 200:
                result = response.json()
                if result.get("success"):
                    logger.info(
                        f"✓ {pdf_file.name}: {result.get('successCount')}/{result.get('totalChunks')} chunks"
                    )
                    return True
            else:
                logger.error(f"API error {response.status_code}")
                return False
        except Exception as e:
            logger.error(f"Error ingesting {pdf_file.name}: {e}")
            return False

    def process_directory(self, directory: str) -> dict:
        """Process all PDFs in directory"""

        path = Path(directory)
        if not path.exists():
            logger.error(f"Directory not found: {directory}")
            return {"total": 0, "success": 0, "failed": 0}

        results = {"total": 0, "success": 0, "failed": 0, "by_specialty": {}}

        # Specialty mapping
        specialty_map = {
            "Anestesiologia": "anestesiologia",
            "Cirurgia Oral Menor": "cirurgia_oral",
            "Dentística": "dentistica",
            "Endodontia": "endodontia",
            "Oclusão": "oclusao",
            "Periodontia": "periodontia",
            "Prótese dentária": "protese"
        }

        # Find all PDFs
        pdf_files = sorted(path.rglob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files")

        for pdf_path in pdf_files:
            results["total"] += 1

            # Get specialty from path
            specialty = None
            for folder, code in specialty_map.items():
                if folder in str(pdf_path):
                    specialty = code
                    if specialty not in results["by_specialty"]:
                        results["by_specialty"][specialty] = {"total": 0, "success": 0}
                    results["by_specialty"][specialty]["total"] += 1
                    break

            success = self.process_pdf(str(pdf_path), specialty)

            if success:
                results["success"] += 1
                if specialty:
                    results["by_specialty"][specialty]["success"] += 1
            else:
                results["failed"] += 1

        return results


def main():
    admin_key = os.environ.get("ADMIN_API_KEY")
    if not admin_key:
        print("Error: ADMIN_API_KEY environment variable not set")
        sys.exit(1)

    app_url = os.environ.get("APP_URL", "http://localhost:3000")

    # Target directory
    if len(sys.argv) < 2:
        target = "Assuntos com PDF"
    else:
        target = sys.argv[1]

    # Resolve path
    base_dir = Path(__file__).parent.parent / target
    if not base_dir.exists():
        base_dir = Path(target)

    if not base_dir.exists():
        print(f"Error: Directory not found: {target}")
        sys.exit(1)

    logger.info(f"Starting PDF extraction and processing from: {base_dir}")

    # Process
    extractor = PDFExtractor(admin_key, app_url)
    results = extractor.process_directory(str(base_dir))

    # Print summary
    print("\n" + "=" * 70)
    print("PROCESSING SUMMARY")
    print("=" * 70)
    print(f"Total PDFs: {results['total']}")
    print(f"Successful: {results['success']}")
    print(f"Failed: {results['failed']}")

    if results['total'] > 0:
        success_rate = (results['success'] / results['total']) * 100
        print(f"Success rate: {success_rate:.1f}%")

    if results["by_specialty"]:
        print("\nBy Specialty:")
        for specialty, counts in sorted(results["by_specialty"].items()):
            rate = (counts['success'] / counts['total'] * 100) if counts['total'] > 0 else 0
            print(f"  {specialty}: {counts['success']}/{counts['total']} ({rate:.0f}%)")

    print("=" * 70)

    sys.exit(0 if results['failed'] == 0 else 1)


if __name__ == "__main__":
    main()
