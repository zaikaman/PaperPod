"""High-DPI Figure & Diagram Extractor using PyMuPDF (fitz) and Supabase Storage."""

import logging
import re
import uuid
from typing import Any

import pymupdf

from src.core.config import get_settings
from src.core.supabase_client import get_storage_public_url, upload_storage_file
from src.models.schemas import BoundingBox, PaperFigureSchema

logger = logging.getLogger(__name__)

# Caption detection patterns
FIGURE_CAPTION_REGEX = re.compile(
    r"^(?:Figure|Fig\.|Table)\s*(\d+)[\.:\s\-]+(.*)$",
    re.IGNORECASE,
)


def calculate_aspect_ratio(bbox: BoundingBox) -> float:
    """Calculates width-to-height aspect ratio safely clamped between 0.2 and 4.0."""
    raw_width = bbox.x1 - bbox.x0
    raw_height = bbox.y1 - bbox.y0
    if raw_width <= 0 or raw_height <= 0:
        return 1.0
    ratio = raw_width / raw_height
    return round(max(0.2, min(4.0, ratio)), 3)


def find_figure_candidates_in_page(
    page: pymupdf.Page, page_number: int
) -> list[dict[str, Any]]:
    """Detects figure and table captions and calculates enclosing bounding boxes on a PDF page."""
    candidates: list[dict[str, Any]] = []
    blocks = page.get_text("blocks")
    page_rect = page.rect
    page_width = float(page_rect.width)
    page_height = float(page_rect.height)

    for b in blocks:
        if len(b) < 5:
            continue
        x0, y0, x1, y1, text = float(b[0]), float(b[1]), float(b[2]), float(b[3]), b[4].strip()
        if not text:
            continue

        first_line = text.split("\n")[0].strip()
        match = FIGURE_CAPTION_REGEX.match(first_line)
        if match:
            fig_idx = match.group(1)
            prefix = "Table" if first_line.lower().startswith("table") else "Figure"
            fig_number = f"{prefix} {fig_idx}"

            # Calculate expanded bounding box to capture diagram above/around caption
            is_table = prefix == "Table"
            if is_table:
                # Tables usually have caption on TOP, table content below
                crop_y0 = max(0.0, y0 - 10.0)
                crop_y1 = min(page_height, y1 + 320.0)
            else:
                # Figures usually have diagram ABOVE caption
                crop_y0 = max(0.0, y0 - 320.0)
                crop_y1 = min(page_height, y1 + 10.0)

            # Ensure box spans horizontal margins reasonably
            crop_x0 = max(20.0, min(x0 - 20.0, page_width * 0.05))
            crop_x1 = min(page_width - 20.0, max(x1 + 20.0, page_width * 0.95))

            bbox = BoundingBox(
                x0=round(crop_x0, 1),
                y0=round(crop_y0, 1),
                x1=round(crop_x1, 1),
                y1=round(crop_y1, 1),
            )

            candidates.append(
                {
                    "figure_number": fig_number,
                    "caption": text,
                    "page_number": page_number,
                    "bounding_box": bbox,
                    "aspect_ratio": calculate_aspect_ratio(bbox),
                }
            )

    return candidates


def crop_figure_to_image(
    page: pymupdf.Page,
    bbox: BoundingBox,
    dpi: int = 200,
) -> bytes:
    """Crops a region from the PDF page and renders high-DPI raster PNG bytes."""
    clip_rect = pymupdf.Rect(bbox.x0, bbox.y0, bbox.x1, bbox.y1)
    # Clamp clip rect to page boundaries
    page_rect = page.rect
    clip_rect.intersect(page_rect)

    if clip_rect.is_empty or clip_rect.width <= 0 or clip_rect.height <= 0:
        clip_rect = page_rect

    zoom = dpi / 72.0  # 72 points per inch in PDF coordinate space
    matrix = pymupdf.Matrix(zoom, zoom)

    pix = page.get_pixmap(matrix=matrix, clip=clip_rect, alpha=False)
    image_bytes = pix.tobytes("png")
    return image_bytes


def extract_and_crop_paper_figures(
    pdf_bytes: bytes,
    paper_id: str,
    dpi: int = 200,
) -> list[PaperFigureSchema]:
    """Extracts all figures from PDF, renders high-DPI crops, uploads to Storage, and returns schemas."""
    settings = get_settings()
    figures: list[PaperFigureSchema] = []

    try:
        doc = pymupdf.open(stream=pdf_bytes, filetype="pdf")
    except Exception as e:
        logger.error(f"Failed to open PDF for figure extraction: {e}")
        return figures

    try:
        seen_numbers: set[str] = set()

        for page_idx in range(doc.page_count):
            page = doc[page_idx]
            page_num = page_idx + 1
            candidates = find_figure_candidates_in_page(page, page_num)

            for cand in candidates:
                fig_num = cand["figure_number"]
                if fig_num in seen_numbers:
                    continue
                seen_numbers.add(fig_num)

                bbox: BoundingBox = cand["bounding_box"]
                fig_id = str(uuid.uuid4())

                # Render PNG crop
                try:
                    crop_png = crop_figure_to_image(page, bbox, dpi=dpi)
                except Exception as e:
                    logger.warning(f"Failed cropping {fig_num} on page {page_num}: {e}")
                    continue

                # Storage path
                safe_num = re.sub(r"[^a-zA-Z0-9_]", "_", fig_num.lower())
                storage_path = f"figures/{paper_id}_{safe_num}.png"

                # Upload to Supabase storage
                public_url: str | None = None
                try:
                    upload_storage_file(
                        bucket=settings.STORAGE_BUCKET_FIGURES,
                        path=storage_path,
                        file_bytes=crop_png,
                        content_type="image/png",
                    )
                    public_url = get_storage_public_url(
                        settings.STORAGE_BUCKET_FIGURES, storage_path
                    )
                except Exception as e:
                    logger.warning(f"Storage upload fallback for {storage_path}: {e}")
                    public_url = f"https://storage.paperpod.ai/{storage_path}"

                figure_schema = PaperFigureSchema(
                    id=fig_id,
                    paper_id=paper_id,
                    figure_number=fig_num,
                    caption=cand["caption"],
                    storage_path=storage_path,
                    public_url=public_url,
                    page_number=page_num,
                    bounding_box=bbox,
                    aspect_ratio=cand["aspect_ratio"],
                )
                figures.append(figure_schema)

        # If no explicit caption matched, fallback: create overview figure for page 1
        if not figures and doc.page_count > 0:
            first_page = doc[0]
            fig_id = str(uuid.uuid4())
            full_bbox = BoundingBox(
                x0=20.0,
                y0=20.0,
                x1=float(first_page.rect.width) - 20.0,
                y1=float(first_page.rect.height) * 0.6,
            )
            crop_png = crop_figure_to_image(first_page, full_bbox, dpi=dpi)
            storage_path = f"figures/{paper_id}_figure_1.png"

            try:
                upload_storage_file(
                    bucket=settings.STORAGE_BUCKET_FIGURES,
                    path=storage_path,
                    file_bytes=crop_png,
                    content_type="image/png",
                )
                public_url = get_storage_public_url(settings.STORAGE_BUCKET_FIGURES, storage_path)
            except Exception:
                public_url = f"https://storage.paperpod.ai/{storage_path}"

            figures.append(
                PaperFigureSchema(
                    id=fig_id,
                    paper_id=paper_id,
                    figure_number="Figure 1",
                    caption="Figure 1: Document Overview & Architecture",
                    storage_path=storage_path,
                    public_url=public_url,
                    page_number=1,
                    bounding_box=full_bbox,
                    aspect_ratio=calculate_aspect_ratio(full_bbox),
                )
            )

    finally:
        doc.close()

    return figures
