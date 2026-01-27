#!/usr/bin/env python3
"""
PDF Extraction and Ingestion Script for Odonto GPT RAG

Extracts text from PDFs in specialty folders and ingests into Supabase knowledge base.
Usage:
    python scripts/extract-and-ingest-pdfs.py "Assuntos com PDF/Endodontia"
    python scripts/extract-and-ingest-pdfs.py "Assuntos com PDF"  # Process all
"""

import os
import json
import sys
import re
import requests
from pathlib import Path
from typing import Dict, List, Optional
import logging

try:
    import pdfplumber
except ImportError:
    print("Error: pdfplumber not installed. Install with: pip install pdfplumber")
    sys.exit(1)

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Specialty mapping
SPECIALTY_MAP = {
    "Anestesiologia": "anestesiologia",
    "Cirurgia Oral Menor": "cirurgia_oral",
    "Dentística": "dentistica",
    "Endodontia": "endodontia",
    "Oclusão": "oclusao",
    "Periodontia": "periodontia",
    "Prótese dentária": "protese"
}

class PDFExtractor:
    def __init__(self, admin_key: str, app_url: str = "http://localhost:3000"):
        self.admin_key = admin_key
        self.app_url = app_url
        self.ingestion_endpoint = f"{app_url}/api/admin/ingest-document"

    def extract_text_from_pdf(self, pdf_path: str) -> Optional[str]:
        """Extract text from PDF file"""
        try:
            text_parts = []
            with pdfplumber.open(pdf_path) as pdf:
                for page in pdf.pages:
                    text = page.extract_text()
                    if text:
                        text_parts.append(text)

            if not text_parts:
                logger.warning(f"No text extracted from {pdf_path}")
                return None

            full_text = "\n".join(text_parts)
            return full_text.strip()
        except Exception as e:
            logger.error(f"Error extracting PDF {pdf_path}: {e}")
            return None

    def clean_text(self, text: str) -> str:
        """Clean extracted text"""
        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)
        # Remove control characters
        text = ''.join(char for char in text if ord(char) >= 32 or char in '\n\t')
        return text.strip()

    def get_specialty_from_path(self, path: str) -> Optional[str]:
        """Extract specialty from folder path"""
        for folder, specialty_code in SPECIALTY_MAP.items():
            if folder in path:
                return specialty_code
        return None

    def ingest_document(
        self,
        title: str,
        content: str,
        source_type: str = "textbook",
        source_name: Optional[str] = None,
        specialty: Optional[str] = None,
        author: Optional[str] = None
    ) -> bool:
        """Send document to ingestion API"""

        if len(content) < 100:
            logger.warning(f"Content too short for {title}: {len(content)} chars")
            return False

        payload = {
            "title": title,
            "content": content,
            "sourceType": source_type,
            "sourceName": source_name,
            "specialty": specialty,
            "author": author or "Unknown"
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
                        f"✓ Successfully ingested {title}: "
                        f"{result.get('successCount')}/{result.get('totalChunks')} chunks"
                    )
                    return True
                else:
                    logger.error(f"Ingestion failed for {title}: {result.get('message')}")
                    return False
            else:
                logger.error(
                    f"API error {response.status_code} for {title}: {response.text}"
                )
                return False

        except requests.exceptions.Timeout:
            logger.error(f"Timeout ingesting {title}")
            return False
        except Exception as e:
            logger.error(f"Error ingesting {title}: {e}")
            return False

    def process_pdf(self, pdf_path: str) -> bool:
        """Process a single PDF file"""
        pdf_file = Path(pdf_path)

        if not pdf_file.exists():
            logger.error(f"PDF file not found: {pdf_path}")
            return False

        logger.info(f"Processing: {pdf_file.name}")

        # Extract text
        text = self.extract_text_from_pdf(pdf_path)
        if not text:
            return False

        # Clean text
        text = self.clean_text(text)

        # Get specialty
        specialty = self.get_specialty_from_path(pdf_path)

        # Get title from filename (remove .pdf)
        title = pdf_file.stem.replace('_', ' ').replace('Cópia de ', '')

        # Ingest
        success = self.ingest_document(
            title=title,
            content=text,
            source_type="textbook",
            source_name=title,
            specialty=specialty,
            author="Unknown"
        )

        return success

    def process_directory(self, directory: str) -> Dict[str, int]:
        """Process all PDFs in a directory"""
        path = Path(directory)

        if not path.exists():
            logger.error(f"Directory not found: {directory}")
            return {"total": 0, "success": 0, "failed": 0}

        results = {"total": 0, "success": 0, "failed": 0, "by_specialty": {}}

        # Find all PDFs
        pdf_files = list(path.rglob("*.pdf"))
        logger.info(f"Found {len(pdf_files)} PDF files")

        for pdf_path in pdf_files:
            results["total"] += 1
            specialty = self.get_specialty_from_path(str(pdf_path))

            if specialty:
                if specialty not in results["by_specialty"]:
                    results["by_specialty"][specialty] = {"total": 0, "success": 0}
                results["by_specialty"][specialty]["total"] += 1

            success = self.process_pdf(str(pdf_path))

            if success:
                results["success"] += 1
                if specialty:
                    results["by_specialty"][specialty]["success"] += 1
            else:
                results["failed"] += 1

        return results


def main():
    # Get configuration
    admin_key = os.environ.get("ADMIN_API_KEY")
    if not admin_key:
        print("Error: ADMIN_API_KEY environment variable not set")
        sys.exit(1)

    app_url = os.environ.get("APP_URL", "http://localhost:3000")

    # Get target directory
    if len(sys.argv) < 2:
        target = "Assuntos com PDF"
    else:
        target = sys.argv[1]

    # Resolve path
    base_dir = Path(__file__).parent.parent / target
    if not base_dir.exists():
        # Try as absolute path
        base_dir = Path(target)

    if not base_dir.exists():
        print(f"Error: Directory not found: {target}")
        sys.exit(1)

    logger.info(f"Starting PDF extraction from: {base_dir}")

    # Process
    extractor = PDFExtractor(admin_key, app_url)
    results = extractor.process_directory(str(base_dir))

    # Print summary
    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"Total PDFs: {results['total']}")
    print(f"Successful: {results['success']}")
    print(f"Failed: {results['failed']}")
    print(f"Success rate: {(results['success']/results['total']*100):.1f}%" if results['total'] > 0 else "N/A")

    if results["by_specialty"]:
        print("\nBy Specialty:")
        for specialty, counts in results["by_specialty"].items():
            rate = (counts['success']/counts['total']*100) if counts['total'] > 0 else 0
            print(f"  {specialty}: {counts['success']}/{counts['total']} ({rate:.0f}%)")

    print("=" * 60)

    # Exit code
    sys.exit(0 if results['failed'] == 0 else 1)


if __name__ == "__main__":
    main()
