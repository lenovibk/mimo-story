#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

docker compose -f docker-compose.yml -f docker-compose.prod.yml build --no-cache --pull
docker compose -f docker-compose.yml -f docker-compose.prod.yml up -d --force-recreate
