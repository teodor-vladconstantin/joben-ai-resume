FROM node:20-bookworm-slim

# Install LaTeX utilities
RUN apt-get update && apt-get install -y --no-install-recommends \
    texlive-latex-base \
    texlive-fonts-recommended \
    texlive-fonts-extra \
    fonts-lmodern \
    texlive-latex-extra \
    curl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy package info
COPY package.json ./
RUN npm install

# Copy application
COPY . .

EXPOSE 3001

CMD ["node", "index.js"]
