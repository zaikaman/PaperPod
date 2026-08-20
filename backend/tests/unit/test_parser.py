"""Unit tests for PyMuPDF PDF parser and section extraction."""

import os

import pytest

from src.services.parser import extract_latex_equations_from_text, parse_pdf_document


@pytest.fixture
def sample_pdf_path() -> str:
    path = os.path.join(os.path.dirname(__file__), "..", "fixtures", "sample_paper.pdf")
    assert os.path.exists(path), f"Test fixture PDF not found at {path}"
    return path


def test_extract_latex_equations() -> None:
    text = "Here is an equation: Attention(Q, K, V) = softmax((Q * K^T) / sqrt(d_k)) * V and another $x = y + 1$."
    equations = extract_latex_equations_from_text(text)
    assert len(equations) > 0
    assert any("softmax" in eq or "Attention" in eq or "x = y" in eq for eq in equations)


def test_parse_sample_pdf_document(sample_pdf_path: str) -> None:
    parsed_doc = parse_pdf_document(sample_pdf_path)

    assert parsed_doc["title"] is not None
    assert "Attention" in parsed_doc["title"]
    assert parsed_doc["total_pages"] >= 1
    assert len(parsed_doc["sections"]) >= 1

    # Check section content
    intro_section = next(
        (
            s
            for s in parsed_doc["sections"]
            if "Introduction" in s["heading"] or "Architecture" in s["heading"]
        ),
        None,
    )
    assert intro_section is not None
    assert len(intro_section["content_text"]) > 20
