#!/bin/sh
set -eu

INTERVAL="${FOLLOWUP_CRON_INTERVAL_SECONDS:-3600}"
TARGET="${FOLLOWUP_CRON_TARGET_URL:-http://app:3000/api/cron/followup-7d?limit=100&retries=1}"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET is not set; cannot run followup scheduler"
  exit 1
fi

echo "Followup scheduler started (interval=${INTERVAL}s, target=${TARGET})"

while true; do
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "[$NOW] Triggering followup cron"

  if ! curl -fsS -X POST "$TARGET" -H "Authorization: Bearer $CRON_SECRET"; then
    echo "[$NOW] followup cron trigger failed"
  fi

  sleep "$INTERVAL"
done
