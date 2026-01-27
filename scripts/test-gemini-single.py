#!/usr/bin/env python3
"""
Test script for Gemini Flash PDF Processor
Processes a single PDF to validate the pipeline
"""

import os
import sys
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables
load_dotenv('.env.local')

# Import processor after loading env
from gemini_pdf_processor import PDFProcessor

def find_small_pdf(directory: str) -> str:
    """Find a small PDF for testing"""
    pdf_files = list(Path(directory).rglob("*.pdf"))
    pdf_files = [p for p in pdf_files if ".temp_" not in str(p)]

    if not pdf_files:
        raise FileNotFoundError(f"No PDFs found in {directory}")

    # Sort by size and take the smallest
    pdf_files.sort(key=lambda p: p.stat().st_size)
    return str(pdf_files[0])


def main():
    """Test single PDF processing"""
    directory = "Assuntos com PDF"

    print("\n" + "="*70)
    print("🧪 Testing Gemini Flash PDF Processor")
    print("="*70 + "\n")

    try:
        # Find smallest PDF for testing
        pdf_path = find_small_pdf(directory)
        print(f"Testing with: {Path(pdf_path).name}\n")

        # Process
        processor = PDFProcessor()
        result = processor.process_pdf(pdf_path)

        # Print result
        print("\n" + "="*70)
        print("📊 Test Result")
        print("="*70)
        print(f"Status: {result['status']}")
        if result['status'] == 'success':
            print(f"Chunks: {result['chunks']}")
            print(f"Uploaded: {result['uploaded']}")
            if result.get('failed', 0) > 0:
                print(f"Failed: {result['failed']}")
            print("\n✅ Test passed!")
        else:
            print(f"Error: {result.get('error', 'Unknown error')}")
            print("\n❌ Test failed!")

        print("="*70 + "\n")

    except Exception as e:
        print(f"❌ Test failed with error: {e}\n")
        import traceback
        traceback.print_exc()
        sys.exit(1)


if __name__ == "__main__":
    main()
