#!/bin/sh
set -eu

docker rm -f joben-parser >/dev/null 2>&1 || true

docker compose -f docker-compose.prod.yml up -d --build resume-parser

docker ps --format "{{.Names}}\t{{.Status}}\t{{.Ports}}" | grep -i "resume-parser" || true
