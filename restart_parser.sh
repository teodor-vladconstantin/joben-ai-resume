#!/bin/sh
docker ps --filter "status=running" --format "{{.Names}}" | while read name; do
  if echo "$name" | grep -qi parser; then
    docker stop "$name" || true
  fi
done
docker rm -f joben-parser || true
docker run -d --restart unless-stopped --name joben-parser -p 8000:8000 joben-parser:prod
