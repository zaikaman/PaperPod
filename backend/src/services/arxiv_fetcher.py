"""arXiv metadata scraper and PDF download service."""

import logging
import re
from typing import Any

import httpx
from bs4 import BeautifulSoup

from src.services.parser import parse_pdf_document

logger = logging.getLogger(__name__)


def extract_arxiv_id(query: str) -> str | None:
    """Extracts standardized arXiv ID from URL or raw identifier string."""
    clean = query.strip()
    # Match patterns like:
    # 1706.03762 or 1706.03762v5 or abs/1706.03762 or pdf/1706.03762.pdf
    match = re.search(r"(?:abs|pdf)?(?:/)?([0-9]{4}\.[0-9]{4,5}(?:v[0-9]+)?)", clean)
    if match:
        return match.group(1)
    # Old arXiv ID formats like math/0001001 or hep-th/9912012
    old_match = re.search(r"([a-z\-]+/[0-9]{7})", clean, re.IGNORECASE)
    if old_match:
        return old_match.group(1)
    return None


async def fetch_arxiv_paper(arxiv_url_or_id: str) -> dict[str, Any]:
    """Fetches arXiv metadata and downloads the corresponding PDF for parsing."""
    arxiv_id = extract_arxiv_id(arxiv_url_or_id)
    if not arxiv_id:
        raise ValueError(f"Invalid arXiv link or identifier: {arxiv_url_or_id}")

    abs_url = f"https://arxiv.org/abs/{arxiv_id}"
    pdf_url = f"https://arxiv.org/pdf/{arxiv_id}.pdf"

    headers = {"User-Agent": "PaperPod/1.0 (Research Audio Companion; mailto:contact@paperpod.ai)"}

    async with httpx.AsyncClient(timeout=30.0, follow_redirects=True, headers=headers) as client:
        # 1. Fetch Abstract Page HTML for clean metadata
        logger.info(f"Fetching arXiv metadata from {abs_url}...")
        abs_res = await client.get(abs_url)

        title: str | None = None
        authors: list[str] = []
        abstract: str | None = None

        if abs_res.status_code == 200:
            soup = BeautifulSoup(abs_res.text, "html.parser")

            # Title
            title_tag = soup.find("h1", class_="title")
            if title_tag:
                title = title_tag.text.replace("Title:", "").strip()

            # Authors
            authors_div = soup.find("div", class_="authors")
            if authors_div:
                authors = [a.text.strip() for a in authors_div.find_all("a")]

            # Abstract
            abstract_block = soup.find("blockquote", class_="abstract")
            if abstract_block:
                abstract = abstract_block.text.replace("Abstract:", "").strip()

        # 2. Download the PDF bytes
        logger.info(f"Downloading arXiv PDF from {pdf_url}...")
        pdf_res = await client.get(pdf_url)
        if pdf_res.status_code != 200:
            raise RuntimeError(
                f"Failed to download arXiv PDF from {pdf_url} (HTTP {pdf_res.status_code})"
            )

        pdf_bytes = pdf_res.content

        # 3. Parse PDF with PyMuPDF
        parsed = parse_pdf_document(pdf_bytes)

        # Merge metadata with preference for arXiv web metadata
        if title:
            parsed["title"] = title
        if authors:
            parsed["authors"] = authors
        if abstract:
            parsed["abstract"] = abstract

        parsed["arxiv_id"] = arxiv_id
        parsed["source_url"] = abs_url
        parsed["pdf_bytes"] = pdf_bytes

        return parsed
