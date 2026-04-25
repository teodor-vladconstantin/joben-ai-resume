FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install all deps.
# torch CPU wheel is fetched from PyTorch index; spaCy models from GitHub releases.
RUN pip install --no-cache-dir -r requirements.txt

# Pre-download BERT NER model into the image so first request is instant.
# If download fails (no internet at build time), the service still starts —
# BertNER.available will be False and the parser falls back to spaCy.
RUN python -c "\
from transformers import AutoTokenizer, AutoModelForTokenClassification; \
AutoTokenizer.from_pretrained('yashpwr/resume-ner-bert-v2'); \
AutoModelForTokenClassification.from_pretrained('yashpwr/resume-ner-bert-v2'); \
print('BERT model cached.')" || echo "BERT pre-cache skipped."

# Build ESCO skills corpus (downloads EN + RO from EU servers).
# Falls back to seed list if unavailable at build time.
COPY scripts/ scripts/
RUN python scripts/build_esco_corpus.py || echo "ESCO download skipped; seed list will be used."

COPY . .

EXPOSE 3002

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]
