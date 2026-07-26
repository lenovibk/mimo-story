#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")"

docker compose build --no-cache --pull
docker compose up -d --force-recreate
