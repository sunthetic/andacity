#!/bin/bash
# Andacity deploy script template.
#
# This file is a REFERENCE IMPLEMENTATION for the deploy.sh that must exist
# on the EC2 server. Copy it to EC2 as deploy.sh and adapt to your environment.
#
# The GitHub Actions workflow at .github/workflows/deploy-production.yml calls:
#   APP_ORIGIN=<origin> ./deploy.sh <ref_name> <app_name> <port> <framework> <cwd>
#
# Required environment variables (set in EC2 env or sourced from a secrets file):
#   DATABASE_URL, ORIGIN, PUBLIC_BASE_URL, OG_SIGNING_SECRET,
#   CONTACT_EMAIL, PRIVACY_EMAIL, LEGAL_EMAIL
#
# Required build-time env (passed by CI workflow via APP_ORIGIN=...):
#   APP_ORIGIN  — e.g. https://andacity.com  (defaults to this value if unset)

set -euo pipefail

# ── Positional args from CI ──────────────────────────────────────────────────
REF_NAME="${1:-main}"
APP_NAME="${2:-andacity}"
APP_PORT="${3:-3000}"
APP_FRAMEWORK="${4:-fastify}"
# $5 is $(pwd) on the EC2 server — unused but accepted to match CI call signature

# ── Build-time config ────────────────────────────────────────────────────────
APP_ORIGIN="${APP_ORIGIN:-https://andacity.com}"

# ── Preflight: required runtime env vars ─────────────────────────────────────
REQUIRED=(DATABASE_URL ORIGIN OG_SIGNING_SECRET CONTACT_EMAIL PRIVACY_EMAIL LEGAL_EMAIL)
MISSING=()
for var in "${REQUIRED[@]}"; do
  [[ -z "${!var:-}" ]] && MISSING+=("$var")
done
if [[ ${#MISSING[@]} -gt 0 ]]; then
  echo "[deploy] ERROR: Missing required environment variables: ${MISSING[*]}" >&2
  echo "[deploy] Set them in the EC2 environment or source a secrets file before running." >&2
  exit 1
fi

echo "[deploy] Starting deployment of ref '${REF_NAME}' as '${APP_NAME}' on port ${APP_PORT}"
echo "[deploy] APP_ORIGIN=${APP_ORIGIN}"

# ── Pull latest code ─────────────────────────────────────────────────────────
echo "[deploy] Pulling latest code..."
git fetch origin "${REF_NAME}"
git checkout "${REF_NAME}"
git pull origin "${REF_NAME}"

# ── Build Docker image ───────────────────────────────────────────────────────
IMAGE_TAG="${APP_NAME}:${REF_NAME}-$(date +%Y%m%d%H%M%S)"
echo "[deploy] Building Docker image ${IMAGE_TAG}..."
docker build \
  --build-arg APP_ORIGIN="${APP_ORIGIN}" \
  --build-arg NODE_ENV=production \
  -t "${APP_NAME}:latest" \
  -t "${IMAGE_TAG}" \
  .
echo "[deploy] Docker image built: ${IMAGE_TAG}"

# ── Stop and remove existing container ───────────────────────────────────────
echo "[deploy] Stopping existing container '${APP_NAME}'..."
docker stop "${APP_NAME}" 2>/dev/null && echo "[deploy] Container stopped." || echo "[deploy] No running container to stop."
docker rm "${APP_NAME}" 2>/dev/null && echo "[deploy] Container removed." || echo "[deploy] No container to remove."

# ── Start new container ───────────────────────────────────────────────────────
# Runtime env vars are injected here, not baked into the image.
# DATABASE_URL, OG_SIGNING_SECRET, and other secrets are never printed.
echo "[deploy] Starting container '${APP_NAME}' on port ${APP_PORT}..."
docker run -d \
  --name "${APP_NAME}" \
  --restart unless-stopped \
  -p "${APP_PORT}:3000" \
  -e DATABASE_URL="${DATABASE_URL}" \
  -e ORIGIN="${ORIGIN}" \
  -e PUBLIC_BASE_URL="${PUBLIC_BASE_URL:-https://andacity.com}" \
  -e OG_SIGNING_SECRET="${OG_SIGNING_SECRET}" \
  -e CONTACT_EMAIL="${CONTACT_EMAIL}" \
  -e PRIVACY_EMAIL="${PRIVACY_EMAIL}" \
  -e LEGAL_EMAIL="${LEGAL_EMAIL}" \
  -e DB_POOL_MAX="${DB_POOL_MAX:-10}" \
  -e DB_READS_ENABLED="${DB_READS_ENABLED:-true}" \
  -e PUBLIC_ANALYTICS_PROVIDER="${PUBLIC_ANALYTICS_PROVIDER:-}" \
  "${APP_NAME}:latest"

# ── Health check ─────────────────────────────────────────────────────────────
echo "[deploy] Waiting for container to start..."
sleep 5
HEALTH=$(curl -sf "http://localhost:${APP_PORT}/healthz" 2>/dev/null || echo "FAIL")
if [[ "$HEALTH" == *'"ok":true'* ]]; then
  echo "[deploy] Health check passed: ${HEALTH}"
else
  echo "[deploy] WARNING: Health check did not return ok:true. Response: ${HEALTH}" >&2
  echo "[deploy] Container may still be starting — check 'docker logs ${APP_NAME}'" >&2
fi

echo "[deploy] Deployment complete. Container '${APP_NAME}' is running on port ${APP_PORT}."
echo "[deploy] Image: ${IMAGE_TAG}"
