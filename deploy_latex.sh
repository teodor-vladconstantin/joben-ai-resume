#!/bin/sh
cid=$(docker ps -a --format '{{.ID}} {{.Ports}}' | grep '0.0.0.0:3001' | awk '{print $1}' || true)
if [ -n "$cid" ]; then docker rm -f $cid || true; fi
docker run -d --restart unless-stopped --name joben-latex -p 3001:3001 -e LATEX_SERVICE_SECRET=323c0bd3-06e7-46f8-b8d9-91e8bd157b0b joben-latex:prod
