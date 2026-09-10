#!/usr/bin/env bash
# Start the CTF tracker. First run builds the venv and the frontend.
# Usage: ./run.sh [--build] [--port 8000] [--public-url http://LAN-IP:8000]
set -e
cd "$(dirname "$0")"

# Load local secrets (admin dashboard login) from .env if present.
if [ -f .env ]; then set -a; . ./.env; set +a; fi

if [ "$1" = "--build" ] || [ ! -f frontend/dist/index.html ]; then
  [ "$1" = "--build" ] && shift
  echo "Building frontend..."
  (cd frontend && npm ci --silent && npm run build --silent)
fi

[ -d .venv ] || python3 -m venv .venv
.venv/bin/pip install -q -r requirements.txt
exec .venv/bin/python -m backend.app "$@"
