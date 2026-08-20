"""Document parsing service utilizing PyMuPDF (fitz) and regex equation extraction."""

import logging
import re
from typing import Any

import pymupdf

logger = logging.getLogger(__name__)

# Regular expressions to identify common LaTeX math structures and equations
MATH_PATTERNS = [
    r"\$\$.*?\$\$",
    r"\$.*?\$",
    r"\\\[.*?\\\]",
    r"\\\(.*?\\\)",
    r"(?:Equation|Eq\.)\s*\d+[:\-]?\s*.*",
    r"[A-Za-z]+\([A-Z,\s]+\)\s*=\s*.*",
]

SECTION_HEADING_PATTERNS = [
    r"^(?:\d+\.?\s+)?(?:Abstract|Introduction|Related Work|Background|Methodology|Model Architecture|Architecture|Experiments|Results|Discussion|Conclusion|References)\b.*$",
    r"^\d+\.\s+[A-Z][A-Za-z\s\-]+$",
]


def extract_latex_equations_from_text(text: str) -> list[str]:
    """Extracts LaTeX equations and mathematical expressions from text."""
    equations: list[str] = []

    # 1. Regex search for dollar delimiters and LaTeX symbols
    for pattern in MATH_PATTERNS:
        matches = re.findall(pattern, text, flags=re.MULTILINE | re.IGNORECASE)
        for match in matches:
            cleaned = match.strip()
            if len(cleaned) > 3 and cleaned not in equations:
                equations.append(cleaned)

    # 2. Line-by-line check for mathematical operators (e.g. =, softmax, \sum, \int)
    for line in text.split("\n"):
        line_str = line.strip()
        if any(
            op in line_str
            for op in ["softmax", "\\sum", "\\prod", "\\frac", "\\sqrt", "argmax", "argmin", "^T"]
        ):
            if line_str not in equations and len(line_str) < 200:
                equations.append(line_str)

    return equations


def is_heading_candidate(line: str, font_size: float = 0, avg_font_size: float = 10.0) -> bool:
    """Determines if a text line is likely a section header."""
    clean = line.strip()
    if not clean or len(clean) > 80:
        return False
    if font_size > avg_font_size * 1.15:
        return True
    for pattern in SECTION_HEADING_PATTERNS:
        if re.match(pattern, clean, re.IGNORECASE):
            return True
    return False


def parse_pdf_document(file_path_or_bytes: Any) -> dict[str, Any]:
    """Parses PDF document using PyMuPDF, extracting metadata, sections, and figures."""
    if isinstance(file_path_or_bytes, bytes):
        doc = pymupdf.open(stream=file_path_or_bytes, filetype="pdf")
    else:
        doc = pymupdf.open(file_path_or_bytes)

    total_pages = doc.page_count
    doc_metadata = doc.metadata or {}

    title: str | None = doc_metadata.get("title") or ""
    authors_raw: str | None = doc_metadata.get("author") or ""
    authors: list[str] = (
        [a.strip() for a in authors_raw.split(",") if a.strip()] if authors_raw else []
    )

    sections: list[dict[str, Any]] = []
    figures: list[dict[str, Any]] = []

    current_section_heading = "1. Overview"
    current_section_lines: list[str] = []
    section_counter = 1

    full_text_blocks: list[str] = []

    for page_idx in range(total_pages):
        page = doc[page_idx]
        page_num = page_idx + 1

        # Extract text blocks in reading order
        blocks = page.get_text("blocks")
        # Format of block: (x0, y0, x1, y1, text, block_no, block_type)

        for b in blocks:
            if len(b) < 5:
                continue
            x0, y0, x1, y1, text = b[0], b[1], b[2], b[3], b[4]
            text_str = text.strip()
            if not text_str:
                continue

            full_text_blocks.append(text_str)

            # Heuristic for title on first page if not in metadata
            if (
                page_num == 1
                and not title
                and len(text_str.split("\n")) <= 3
                and len(text_str) > 10
            ):
                title = text_str.split("\n")[0]

            lines = text_str.split("\n")
            first_line = lines[0].strip()

            if is_heading_candidate(first_line):
                # Save existing section
                if current_section_lines:
                    content = "\n".join(current_section_lines).strip()
                    if content:
                        sections.append(
                            {
                                "section_index": section_counter,
                                "heading": current_section_heading,
                                "content_text": content,
                                "latex_equations": extract_latex_equations_from_text(content),
                            }
                        )
                        section_counter += 1
                current_section_heading = first_line
                current_section_lines = lines[1:]
            else:
                current_section_lines.append(text_str)

            # Check if block mentions figure or table captions
            if re.search(r"^(?:Figure|Fig\.|Table)\s*\d+[:\.]", first_line, re.IGNORECASE):
                fig_num_match = re.search(
                    r"^(Figure\s*\d+|Fig\.\s*\d+|Table\s*\d+)", first_line, re.IGNORECASE
                )
                fig_num = fig_num_match.group(1) if fig_num_match else f"Figure {len(figures) + 1}"

                figures.append(
                    {
                        "figure_number": fig_num,
                        "caption": text_str,
                        "page_number": page_num,
                        "bounding_box": {
                            "x0": float(x0),
                            "y0": max(0.0, float(y0) - 200.0),  # encompass diagram above caption
                            "x1": float(x1),
                            "y1": float(y1),
                        },
                        "aspect_ratio": max(0.5, min(2.5, (x1 - x0) / max(1.0, (y1 - y0)))),
                    }
                )

    # Flush final section
    if current_section_lines:
        content = "\n".join(current_section_lines).strip()
        if content:
            sections.append(
                {
                    "section_index": section_counter,
                    "heading": current_section_heading,
                    "content_text": content,
                    "latex_equations": extract_latex_equations_from_text(content),
                }
            )

    # Fallback if no sections extracted
    if not sections:
        all_text = "\n\n".join(full_text_blocks)
        sections.append(
            {
                "section_index": 1,
                "heading": "1. Main Content",
                "content_text": all_text,
                "latex_equations": extract_latex_equations_from_text(all_text),
            }
        )

    # Fallback title if still empty
    if not title:
        title = "Research Paper Briefing"

    # Extract abstract if available
    abstract: str | None = None
    for s in sections:
        if "abstract" in s["heading"].lower():
            abstract = s["content_text"]
            break

    doc.close()

    return {
        "title": title,
        "authors": authors,
        "abstract": abstract,
        "total_pages": total_pages,
        "sections": sections,
        "figures": figures,
    }
