FROM python:3.11-slim

WORKDIR /app

RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .

# Install all deps including spaCy large models (specified via URL in requirements.txt)
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 3002

# Use the structured app/ entrypoint
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "3002"]
