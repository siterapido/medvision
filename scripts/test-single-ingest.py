#!/usr/bin/env python3
"""Test ingestion with a single small PDF"""

import sys
import os
import requests
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import pdfplumber
except ImportError:
    print("ERROR: pdfplumber not installed. Run: pip install pdfplumber PyPDF2 requests")
    sys.exit(1)

def extract_text(pdf_path: str) -> str:
    """Extract text from PDF"""
    text_parts = []
    with pdfplumber.open(pdf_path) as pdf:
        for page in pdf.pages[:5]:  # Only first 5 pages for testing
            text = page.extract_text()
            if text:
                text_parts.append(text)
    return "\n".join(text_parts).strip()

def ingest_document(title: str, content: str, specialty: str):
    """Send document to ingestion API"""
    url = "http://localhost:3000/api/admin/ingest-document"
    headers = {
        "Content-Type": "application/json",
        "Authorization": "Bearer test-admin-key-1769526451"
    }
    payload = {
        "title": title,
        "content": content,
        "sourceType": "textbook",
        "sourceName": title,
        "specialty": specialty
    }

    response = requests.post(url, json=payload, headers=headers, timeout=120)
    return response.json()

def main():
    # Find a small PDF to test
    base_dir = Path(__file__).parent.parent / "Assuntos com PDF"

    # Try Dentística (usually simpler PDFs)
    test_pdf = base_dir / "Dentística" / "manual_dentística.pdf"

    if not test_pdf.exists():
        print(f"Test PDF not found: {test_pdf}")
        sys.exit(1)

    print(f"Testing with: {test_pdf.name}")
    print("Extracting text...")

    text = extract_text(str(test_pdf))

    if not text:
        print("No text extracted!")
        sys.exit(1)

    print(f"Extracted {len(text)} characters")
    print("Sending to API...")

    result = ingest_document("Malamed - Test", text[:10000], "anestesiologia")  # Only first 10k chars

    print("\nResult:")
    print(result)

    if result.get("success"):
        print(f"\n✓ SUCCESS: {result.get('successCount')}/{result.get('totalChunks')} chunks ingested")
    else:
        print(f"\n✗ FAILED: {result.get('error')}")
        sys.exit(1)

if __name__ == "__main__":
    main()
