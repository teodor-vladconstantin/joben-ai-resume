"""
BERT NER service — yashpwr/resume-ner-bert-v2.

Why this model:
  - F1 = 90.87% on real-world resume data (22,542 samples)
  - 25 entity types: Name, Email, Phone, Location, Companies, Designation,
    Skills, Degree, College Name, Graduation Year, Years of Experience + BIO tags
  - Apache 2.0 license, CPU-optimized, ~431 MB
  - Handles ambiguous entities (e.g. "Google" is a company; "Lead" is a designation)
    that regex and spaCy heuristics often miss

Max-length strategy:
  BERT has a 512 token limit. A 2-page CV can exceed this.
  We use a sliding window with 50-token overlap and merge entities by offset.
"""

import logging
from typing import Any, Dict, List, Optional

logger = logging.getLogger(__name__)

_MODEL_NAME = "yashpwr/resume-ner-bert-v2"


# ─── Lazy singleton ──────────────────────────────────────────────────────────

_pipeline = None


def _get_pipeline():
    global _pipeline
    if _pipeline is not None:
        return _pipeline

    try:
        from transformers import pipeline, AutoTokenizer, AutoModelForTokenClassification
        import torch

        logger.info("Loading BERT NER model: %s", _MODEL_NAME)
        tokenizer = AutoTokenizer.from_pretrained(_MODEL_NAME)
        model = AutoModelForTokenClassification.from_pretrained(_MODEL_NAME)
        model.eval()

        _pipeline = pipeline(
            "token-classification",
            model=model,
            tokenizer=tokenizer,
            aggregation_strategy="simple",  # merge B/I/O tokens automatically
            device=-1,                       # CPU
        )
        logger.info("BERT NER model loaded.")
    except Exception as exc:
        logger.warning("BERT NER model unavailable: %s", exc)
        _pipeline = None

    return _pipeline


# ─── Public API ───────────────────────────────────────────────────────────────

class BertNER:
    """
    Thin wrapper around the HuggingFace NER pipeline with sliding-window support.
    All methods are safe to call even when the model failed to load — they return
    empty results in that case.
    """

    # Entity labels from yashpwr/resume-ner-bert-v2 that we care about
    _LABEL_MAP: Dict[str, str] = {
        "Name": "person",
        "Companies worked at": "company",
        "Designation": "job_title",
        "Skills": "skill",
        "Degree": "degree",
        "College Name": "institution",
        "Location": "location",
        "Email Address": "email",
        "Mobile Number": "phone",
        "Graduation Year": "graduation_year",
        "Years of Experience": "years_experience",
    }

    def __init__(self) -> None:
        self._nlp = _get_pipeline()

    @property
    def available(self) -> bool:
        return self._nlp is not None

    def extract(self, text: str, max_chunk: int = 400, overlap: int = 50) -> Dict[str, Any]:
        """
        Run NER with sliding-window chunking over `text`.
        Returns a dict of entity_type → list of unique strings.
        """
        if not self._nlp or not text.strip():
            return {}

        # Tokenise once to know length
        try:
            from transformers import AutoTokenizer
            tokenizer = self._nlp.tokenizer  # type: ignore[attr-defined]
            tokens = tokenizer(text, add_special_tokens=False)["input_ids"]
            n_tokens = len(tokens)
        except Exception:
            n_tokens = len(text.split()) * 2  # rough estimate

        all_entities: List[Dict] = []

        if n_tokens <= max_chunk:
            raw = self._run_safe(text)
            all_entities = raw
        else:
            # Sliding window over the raw text (approximate by words)
            words = text.split()
            step = max_chunk - overlap
            for start in range(0, len(words), step):
                chunk = " ".join(words[start: start + max_chunk])
                all_entities.extend(self._run_safe(chunk))

        return self._aggregate(all_entities)

    def _run_safe(self, text: str) -> List[Dict]:
        try:
            return self._nlp(text) or []  # type: ignore[operator]
        except Exception as exc:
            logger.warning("BERT NER inference error: %s", exc)
            return []

    def _aggregate(self, entities: List[Dict]) -> Dict[str, Any]:
        """
        Collapse raw token-classification results into entity_type → unique strings.
        Confidence threshold: 0.65 (empirically good for this model).
        """
        result: Dict[str, List[str]] = {}
        seen: set = set()

        for ent in entities:
            label = ent.get("entity_group", "") or ent.get("entity", "")
            score = float(ent.get("score", 0))
            word = (ent.get("word") or "").strip()

            if score < 0.65 or not word:
                continue

            canonical = self._LABEL_MAP.get(label)
            if not canonical:
                continue

            key = (canonical, word.lower())
            if key in seen:
                continue
            seen.add(key)

            result.setdefault(canonical, []).append(word)

        return result

    # Convenience accessors for the most common entity types

    def get_name(self, text: str) -> Optional[str]:
        entities = self.extract(text)
        names = entities.get("person", [])
        return names[0] if names else None

    def get_companies(self, text: str) -> List[str]:
        return self.extract(text).get("company", [])

    def get_job_titles(self, text: str) -> List[str]:
        return self.extract(text).get("job_title", [])

    def get_skills(self, text: str) -> List[str]:
        return self.extract(text).get("skill", [])

    def get_degrees(self, text: str) -> List[str]:
        return self.extract(text).get("degree", [])

    def get_institutions(self, text: str) -> List[str]:
        return self.extract(text).get("institution", [])
