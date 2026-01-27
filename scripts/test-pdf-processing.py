#!/usr/bin/env python3
"""
Test PDF Processing Pipeline (Offline)
Tests extraction and splitting WITHOUT requiring the server
"""

import os
import sys
import json
import logging
from pathlib import Path
from datetime import datetime

try:
    import pdfplumber
    import PyPDF2
except ImportError:
    print("Installing dependencies...")
    os.system("pip install pdfplumber PyPDF2 -q")
    import pdfplumber
    import PyPDF2

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def get_pdf_info(pdf_path: str) -> dict:
    """Get detailed info about a PDF"""
    try:
        size_mb = os.path.getsize(pdf_path) / (1024 * 1024)

        with pdfplumber.open(pdf_path) as pdf:
            page_count = len(pdf.pages)

            # Extract first 500 chars to check content quality
            text_sample = ""
            for page in pdf.pages[:3]:
                text = page.extract_text()
                if text:
                    text_sample += text

            # Calculate approximate text length
            total_text = ""
            for page in pdf.pages:
                text = page.extract_text()
                if text:
                    total_text += text

            return {
                "status": "success",
                "size_mb": round(size_mb, 2),
                "page_count": page_count,
                "text_length": len(total_text),
                "needs_split": size_mb > 50 or page_count > 200,
                "sample": text_sample[:200] + "..."
            }
    except Exception as e:
        return {
            "status": "error",
            "error": str(e)
        }


def analyze_pdfs(directory: str) -> dict:
    """Analyze all PDFs in directory"""

    path = Path(directory)
    if not path.exists():
        logger.error(f"Directory not found: {directory}")
        return {}

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

    results = {
        "timestamp": datetime.now().isoformat(),
        "directory": str(path),
        "specialties": {}
    }

    # Find all PDFs
    pdf_files = sorted(path.rglob("*.pdf"))
    logger.info(f"\n{'='*70}")
    logger.info(f"Found {len(pdf_files)} PDF files")
    logger.info(f"{'='*70}\n")

    total_size = 0
    total_pages = 0
    total_text = 0
    needs_split_count = 0

    for pdf_path in pdf_files:
        # Get specialty
        specialty = None
        for folder, code in specialty_map.items():
            if folder in str(pdf_path):
                specialty = code
                if specialty not in results["specialties"]:
                    results["specialties"][specialty] = {"files": [], "total_size": 0, "total_pages": 0}
                break

        logger.info(f"📄 {pdf_path.name}")
        info = get_pdf_info(str(pdf_path))

        if info["status"] == "success":
            logger.info(f"   Size: {info['size_mb']}MB | Pages: {info['page_count']} | Text: {info['text_length']} chars")

            if info["needs_split"]:
                logger.warning(f"   ⚠️  LARGE FILE - Will be split into chunks")
                needs_split_count += 1

            # Add to results
            if specialty:
                results["specialties"][specialty]["files"].append({
                    "name": pdf_path.name,
                    "size_mb": info["size_mb"],
                    "pages": info["page_count"],
                    "text_length": info["text_length"],
                    "needs_split": info["needs_split"]
                })
                results["specialties"][specialty]["total_size"] += info["size_mb"]
                results["specialties"][specialty]["total_pages"] += info["page_count"]

            total_size += info["size_mb"]
            total_pages += info["page_count"]
            total_text += info["text_length"]
        else:
            logger.error(f"   ❌ Error: {info['error']}")

        logger.info("")

    # Summary
    logger.info("=" * 70)
    logger.info("SUMMARY")
    logger.info("=" * 70)
    logger.info(f"Total Files: {len(pdf_files)}")
    logger.info(f"Total Size: {total_size:.1f}MB")
    logger.info(f"Total Pages: {total_pages}")
    logger.info(f"Total Text: {total_text:,} characters")
    logger.info(f"Files needing split: {needs_split_count}")

    logger.info("\n📊 BY SPECIALTY:")
    for specialty, data in sorted(results["specialties"].items()):
        logger.info(f"\n  {specialty.upper()}:")
        logger.info(f"    Files: {len(data['files'])}")
        logger.info(f"    Size: {data['total_size']:.1f}MB")
        logger.info(f"    Pages: {data['total_pages']}")

        for file_info in data['files']:
            status = "⚠️  SPLIT" if file_info['needs_split'] else "✅ OK"
            logger.info(f"      {status} {file_info['name']} ({file_info['size_mb']}MB, {file_info['pages']} pages)")

    logger.info("\n" + "=" * 70)
    logger.info("✅ ANALYSIS COMPLETE")
    logger.info("=" * 70)

    # Estimate chunking
    logger.info("\n📈 ESTIMATED PROCESSING:")
    estimated_chunks = total_text / 1500  # 1500 chars per chunk
    logger.info(f"  Expected chunks (1500 chars): ~{int(estimated_chunks)}")
    logger.info(f"  Expected documents to ingest: {len(pdf_files)} (after splitting)")
    logger.info(f"  Estimated API calls: {len(pdf_files)}")
    logger.info(f"  Estimated embedding calls: ~{int(estimated_chunks)}")

    # Processing recommendation
    logger.info("\n🚀 RECOMMENDED PROCESSING ORDER:")
    for specialty in sorted(results["specialties"].keys()):
        size = results["specialties"][specialty]["total_size"]
        logger.info(f"  1. {specialty}: {size:.1f}MB")

    return results


def save_report(results: dict, output_file: str):
    """Save analysis report as JSON"""
    with open(output_file, 'w') as f:
        json.dump(results, f, indent=2)
    logger.info(f"\n📋 Report saved to: {output_file}")


def main():
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

    # Analyze
    results = analyze_pdfs(str(base_dir))

    # Save report
    report_file = f"pdf_analysis_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
    save_report(results, report_file)

    print("\n✅ Analysis complete!")
    print(f"Report: {report_file}")


if __name__ == "__main__":
    main()
