#!/bin/bash
# Production environment preflight check for Andacity.
# Run before deploying to confirm all required variables are present.
# Does not print secret values — only variable names and pass/fail status.
#
# Usage:
#   APP_ORIGIN=https://andacity.com ./scripts/check-production-env.sh
#   # or source a .env file first:
#   source /etc/andacity/production.env && ./scripts/check-production-env.sh

set -euo pipefail

PASS=0
FAIL=0

check_var() {
  local name="$1"
  local is_secret="${2:-false}"
  local value="${!name:-}"

  if [[ -z "$value" ]]; then
    echo "  MISSING  $name"
    FAIL=$((FAIL + 1))
  else
    if [[ "$is_secret" == "true" ]]; then
      echo "  OK       $name (set, value hidden)"
    else
      echo "  OK       $name = $value"
    fi
    PASS=$((PASS + 1))
  fi
}

echo ""
echo "=== Andacity Production Environment Preflight ==="
echo ""

echo "--- Build-time variables (must be passed to docker build --build-arg) ---"
check_var APP_ORIGIN false

echo ""
echo "--- Required runtime variables (must be injected into the container) ---"
check_var DATABASE_URL true
check_var ORIGIN false
check_var PUBLIC_BASE_URL false
check_var OG_SIGNING_SECRET true
check_var CONTACT_EMAIL false
check_var PRIVACY_EMAIL false
check_var LEGAL_EMAIL false

echo ""
echo "--- Optional runtime variables (leave empty for initial beta) ---"

optional_var() {
  local name="$1"
  local value="${!name:-}"
  if [[ -z "$value" ]]; then
    echo "  EMPTY    $name (OK — first-party fallback active)"
  else
    echo "  SET      $name"
  fi
}

optional_var PUBLIC_ANALYTICS_PROVIDER
optional_var PUBLIC_CLOUDFLARE_WEB_ANALYTICS_TOKEN
optional_var PUBLIC_GA_MEASUREMENT_ID
optional_var PUBLIC_SENTRY_DSN

echo ""
echo "--- Validation summary ---"
echo "  Passed: $PASS"
echo "  Failed: $FAIL"
echo ""

if [[ $FAIL -gt 0 ]]; then
  echo "FAIL — $FAIL required variable(s) are missing. Set them before deploying."
  exit 1
else
  echo "PASS — All required variables are present."
  exit 0
fi
