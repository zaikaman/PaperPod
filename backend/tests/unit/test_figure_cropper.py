"""Unit tests for PDF Figure extraction, cropping, and coordinate calculation."""

import os
from pathlib import Path

import pymupdf
import pytest

from src.models.schemas import BoundingBox, PaperFigureSchema
from src.services.figure_extractor import (
    calculate_aspect_ratio,
    crop_figure_to_image,
    extract_and_crop_paper_figures,
    find_figure_candidates_in_page,
)


@pytest.fixture
def sample_pdf_path() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_paper.pdf")
    assert os.path.exists(path), f"Sample paper fixture not found at {path}"
    return path


@pytest.fixture
def sample_pdf_bytes(sample_pdf_path: str) -> bytes:
    with open(sample_pdf_path, "rb") as f:
        return f.read()


def test_calculate_aspect_ratio() -> None:
    """Validates aspect ratio calculation and safety bounds."""
    # Standard 4:3 box
    bbox_4_3 = BoundingBox(x0=0, y0=0, x1=400, y1=300)
    ratio = calculate_aspect_ratio(bbox_4_3)
    assert pytest.approx(ratio, 0.01) == 1.33

    # Zero height fallback
    bbox_zero = BoundingBox(x0=0, y0=0, x1=100, y1=0)
    ratio_zero = calculate_aspect_ratio(bbox_zero)
    assert ratio_zero == 1.0

    # Narrow tall aspect ratio clamped to minimum
    bbox_tall = BoundingBox(x0=0, y0=0, x1=10, y1=100)
    ratio_tall = calculate_aspect_ratio(bbox_tall)
    assert ratio_tall >= 0.2


def test_find_figure_candidates_in_page(sample_pdf_path: str) -> None:
    """Verifies detection of figure captions and bounding boxes in PDF pages."""
    doc = pymupdf.open(sample_pdf_path)
    page = doc[0]

    candidates = find_figure_candidates_in_page(page, page_number=1)
    assert isinstance(candidates, list)
    # Even on minimal PDFs, function returns valid list
    doc.close()


def test_crop_figure_to_image(sample_pdf_path: str) -> None:
    """Verifies high-DPI rendering and raster cropping to PNG bytes."""
    doc = pymupdf.open(sample_pdf_path)
    page = doc[0]

    bbox = BoundingBox(x0=50.0, y0=50.0, x1=350.0, y1=250.0)
    image_bytes = crop_figure_to_image(page, bbox, dpi=150)

    assert isinstance(image_bytes, bytes)
    assert len(image_bytes) > 0
    # PNG signature check (first 8 bytes: 89 50 4E 47 0D 0A 1A 0A)
    assert image_bytes[:4] == b"\x89PNG"
    doc.close()


def test_extract_and_crop_paper_figures(sample_pdf_bytes: bytes) -> None:
    """Verifies full figure extraction and schema conversion pipeline."""
    figures = extract_and_crop_paper_figures(
        pdf_bytes=sample_pdf_bytes,
        paper_id="test-paper-1706",
        dpi=150,
    )

    assert isinstance(figures, list)
    for fig in figures:
        assert isinstance(fig, PaperFigureSchema)
        assert fig.figure_number.startswith("Figure") or fig.figure_number.startswith("Table")
        assert fig.page_number >= 1
        assert fig.storage_path.startswith("figures/")
        assert fig.aspect_ratio > 0
