#!/bin/sh
set -eu

INTERVAL="${FEEDBACK_CRON_INTERVAL_SECONDS:-300}"
TARGET="${FEEDBACK_CRON_TARGET_URL:-http://app:3000/api/cron/feedback-request?limit=200}"

if [ -z "${CRON_SECRET:-}" ]; then
  echo "CRON_SECRET is not set; cannot run feedback scheduler"
  exit 1
fi

echo "Feedback scheduler started (interval=${INTERVAL}s, target=${TARGET})"

while true; do
  NOW=$(date -u +%Y-%m-%dT%H:%M:%SZ)
  echo "[$NOW] Triggering feedback-request cron"

  if ! curl -fsS -X POST "$TARGET" -H "Authorization: Bearer $CRON_SECRET"; then
    echo "[$NOW] feedback-request cron trigger failed"
  fi

  sleep "$INTERVAL"
done
