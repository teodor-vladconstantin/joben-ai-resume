"""
PDF Extractor — PyMuPDF (fitz) based.

Why PyMuPDF over pdfplumber:
  - span-level font flags (flags & 2**4 = bold) — more precise than font-name parsing
  - page.get_text("dict") gives character-accurate bounding boxes
  - ~6s/page benchmark vs 51-141s for heavier frameworks
  - Europass PDFs embed XML as an attachment — extractable directly
  - Better multi-column handling via per-character x0 coordinates
"""

import io
import statistics
from typing import Any, Dict, List, Optional

try:
    import fitz  # PyMuPDF
    _FITZ_AVAILABLE = True
except ImportError:
    _FITZ_AVAILABLE = False

# pdfplumber kept as fallback
try:
    import pdfplumber
    _PDFPLUMBER_AVAILABLE = True
except ImportError:
    _PDFPLUMBER_AVAILABLE = False


class PDFExtractor:
    """
    Extract structured text + layout metadata from PDF bytes.

    Output contract:
      {
        "lines":        List[{text, words, is_bold, is_large, avg_size, x0, y}]
        "median_size":  float
        "europass_xml": str | None   — raw XML if embedded Europass XML found
        "metadata":     {total_pages, total_words, n_columns, extractor}
      }
    """

    LINE_Y_TOLERANCE = 3    # pts — words within this vertical delta share a line
    COLUMN_GAP_MIN   = 80   # pts — horizontal gap that signals a two-column layout
    CLUSTER_GAP      = 120  # pts — gap within a line that splits two logical columns

    def extract(self, pdf_bytes: bytes) -> Dict[str, Any]:
        europass_xml: Optional[str] = None

        if _FITZ_AVAILABLE:
            words, page_metas, europass_xml = self._extract_fitz(pdf_bytes)
            extractor = "pymupdf"
        elif _PDFPLUMBER_AVAILABLE:
            words, page_metas = self._extract_pdfplumber(pdf_bytes)
            extractor = "pdfplumber"
        else:
            raise RuntimeError("Neither pymupdf nor pdfplumber is installed.")

        if not words:
            return {
                "lines": [],
                "median_size": 10.0,
                "europass_xml": None,
                "metadata": {"total_pages": 0, "total_words": 0, "n_columns": 1, "extractor": extractor},
            }

        sizes = [w["size"] for w in words if w["size"] > 0]
        median_size = statistics.median(sizes) if sizes else 10.0

        page_width = page_metas[0]["width"] if page_metas else 600.0
        n_columns = self._detect_columns(words, page_width)
        sorted_words = self._sort_reading_order(words, n_columns, page_width)
        lines = self._words_to_lines(sorted_words, median_size)

        return {
            "lines": lines,
            "median_size": median_size,
            "europass_xml": europass_xml,
            "metadata": {
                "total_pages": len(page_metas),
                "total_words": len(words),
                "n_columns": n_columns,
                "extractor": extractor,
            },
        }

    # ── PyMuPDF extraction ────────────────────────────────────────────────────

    def _extract_fitz(
        self, pdf_bytes: bytes
    ) -> tuple[List[Dict], List[Dict], Optional[str]]:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")

        # Europass XML is stored as an embedded file attachment
        europass_xml: Optional[str] = None
        for i in range(doc.embfile_count()):
            info = doc.embfile_info(i)
            fname = info.get("filename", "").lower()
            if fname.endswith(".xml") or "europass" in fname:
                try:
                    raw = doc.embfile_get(i)
                    europass_xml = raw.decode("utf-8", errors="ignore")
                except Exception:
                    pass
                break

        all_words: List[Dict] = []
        page_metas: List[Dict] = []

        for page in doc:
            page_dict = page.get_text("dict", flags=fitz.TEXT_PRESERVE_WHITESPACE)
            page_words: List[Dict] = []

            for block in page_dict.get("blocks", []):
                if block.get("type") != 0:  # type 0 = text block
                    continue
                for line in block.get("lines", []):
                    for span in line.get("spans", []):
                        text = span.get("text", "").strip()
                        if not text:
                            continue
                        bbox = span.get("bbox", (0, 0, 0, 0))
                        flags = span.get("flags", 0)
                        size = span.get("size", 0.0)
                        font = span.get("font", "")

                        # fitz flags: bit 4 (0x10) = bold
                        is_span_bold = bool(flags & 16) or "bold" in font.lower() or "heavy" in font.lower()

                        # Each span becomes a "word" unit with precise coordinates
                        word: Dict[str, Any] = {
                            "text": text,
                            "x0": bbox[0],
                            "x1": bbox[2],
                            # fitz uses top-left origin → y0 = top of span, y1 = bottom
                            # We store as y0=top (smaller = higher on page)
                            "y0": bbox[1],
                            "y1": bbox[3],
                            "font": font,
                            "size": float(size),
                            "bold": is_span_bold,
                        }
                        page_words.append(word)
                        all_words.append(word)

            page_metas.append({
                "page_num": page.number,
                "width": float(page.rect.width),
                "height": float(page.rect.height),
                "words": page_words,
            })

        doc.close()
        return all_words, page_metas, europass_xml

    # ── pdfplumber fallback ───────────────────────────────────────────────────

    def _extract_pdfplumber(
        self, pdf_bytes: bytes
    ) -> tuple[List[Dict], List[Dict]]:
        all_words: List[Dict] = []
        page_metas: List[Dict] = []

        with pdfplumber.open(io.BytesIO(pdf_bytes)) as pdf:
            for page in pdf.pages:
                raw_words = page.extract_words(extra_attrs=["fontname", "size"])
                page_words: List[Dict] = []
                for w in raw_words:
                    font = w.get("fontname") or ""
                    is_bold = "bold" in font.lower() or "heavy" in font.lower()
                    word: Dict[str, Any] = {
                        "text": w["text"],
                        "x0": w["x0"],
                        "x1": w["x1"],
                        # pdfplumber: y0/y1 in PDF coords (bottom-left origin),
                        # larger y0 = higher on page
                        "y0": w["y0"],
                        "y1": w["y1"],
                        "font": font,
                        "size": float(w.get("size") or 0),
                        "bold": is_bold,
                    }
                    page_words.append(word)
                    all_words.append(word)

                page_metas.append({
                    "page_num": page.page_number - 1,
                    "width": float(page.width),
                    "height": float(page.height),
                    "words": page_words,
                })

        return all_words, page_metas

    # ── Column detection ──────────────────────────────────────────────────────

    def _detect_columns(self, words: List[Dict], page_width: float) -> int:
        """
        Histogram-based column detection.
        Build a distribution of x0 values; a gap wider than COLUMN_GAP_MIN
        that is also centered in the page midpoint ± 40 % signals two columns.
        More reliable than KMeans — O(n log n) and deterministic.
        """
        if not words:
            return 1
        xs = sorted(set(round(w["x0"]) for w in words))
        if len(xs) < 2:
            return 1
        mid = page_width / 2
        for i in range(1, len(xs)):
            gap = xs[i] - xs[i - 1]
            gap_center = (xs[i] + xs[i - 1]) / 2
            if gap >= self.COLUMN_GAP_MIN and abs(gap_center - mid) < mid * 0.4:
                return 2
        return 1

    # ── Reading-order sort ────────────────────────────────────────────────────

    def _sort_reading_order(
        self, words: List[Dict], n_columns: int, page_width: float
    ) -> List[Dict]:
        """
        fitz coords: y0 = distance from TOP (smaller = higher on page).
        pdfplumber coords: y0 = distance from BOTTOM (larger = higher on page).
        The sort key must be consistent with the coordinate system.
        We normalise by detecting which system is in use from the first word.
        """
        if not words:
            return []

        # Detect coordinate system: fitz → y0 small means top; pdfplumber → y0 large means top
        # Heuristic: if median y0 < 400, assume top-left origin (fitz)
        sample_y0s = [w["y0"] for w in words[:50]]
        top_left_origin = statistics.median(sample_y0s) < 400

        if top_left_origin:
            # fitz: sort by y0 ascending (top first), then x0 ascending
            sort_key = lambda w: (w["y0"], w["x0"])
        else:
            # pdfplumber: sort by y0 descending (larger = higher), then x0 ascending
            sort_key = lambda w: (-w["y0"], w["x0"])

        if n_columns == 1:
            return sorted(words, key=sort_key)

        mid = page_width / 2
        left = sorted([w for w in words if w["x0"] < mid], key=sort_key)
        right = sorted([w for w in words if w["x0"] >= mid], key=sort_key)
        return left + right

    # ── Line reconstruction ───────────────────────────────────────────────────

    def _words_to_lines(
        self, words: List[Dict], median_size: float
    ) -> List[Dict[str, Any]]:
        """
        Group words into lines by vertical proximity.
        Annotates each line with:
          is_bold  — any span in the line is bold (fitz flag or font name)
          is_large — average size >= 115 % of document median
        These are used by the parser for font-aware header detection.
        """
        if not words:
            return []

        lines_raw: List[List[Dict]] = []
        current: List[Dict] = [words[0]]
        current_y = (words[0]["y0"] + words[0]["y1"]) / 2

        for w in words[1:]:
            y_center = (w["y0"] + w["y1"]) / 2
            if abs(y_center - current_y) <= self.LINE_Y_TOLERANCE:
                current.append(w)
            else:
                lines_raw.append(current)
                current = [w]
                current_y = y_center
        if current:
            lines_raw.append(current)

        result: List[Dict[str, Any]] = []
        for group in lines_raw:
            group_sorted = sorted(group, key=lambda w: w["x0"])

            # Split on large horizontal gaps (two-column artefact on same y-band)
            clusters: List[List[Dict]] = []
            cluster: List[Dict] = [group_sorted[0]]
            for i in range(1, len(group_sorted)):
                if group_sorted[i]["x0"] - group_sorted[i - 1]["x1"] > self.CLUSTER_GAP:
                    clusters.append(cluster)
                    cluster = [group_sorted[i]]
                else:
                    cluster.append(group_sorted[i])
            clusters.append(cluster)

            for cl in clusters:
                text = " ".join(w["text"] for w in cl).strip()
                if not text:
                    continue
                avg_size = sum(w["size"] for w in cl) / len(cl)
                is_bold = any(w.get("bold", False) for w in cl)
                is_large = avg_size >= median_size * 1.15 and avg_size > 0

                result.append({
                    "text": text,
                    "words": cl,
                    "avg_size": avg_size,
                    "is_bold": is_bold,
                    "is_large": is_large,
                    "x0": cl[0]["x0"],
                    "y": (cl[0]["y0"] + cl[0]["y1"]) / 2,
                })

        return result
