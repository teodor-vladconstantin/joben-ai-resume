#!/usr/bin/env bash
# Pre-launch acceptance tests for joben.eu. Run from any host with curl.
set -u

# Resolve the canonical apex (joben.eu 307s to www.joben.eu in Vercel).
APEX="${PROD_URL:-https://joben.eu}"
PROD=$(curl -sI "$APEX" --max-time 5 | awk 'tolower($1)=="location:" {sub(/\r$/,"",$2); print $2}')
PROD="${PROD%/}"
PROD="${PROD:-$APEX}"
echo "Canonical host: $PROD"

bar() { printf "\n\033[1m=== %s ===\033[0m\n" "$1"; }
pass() { printf "  \033[32mPASS\033[0m %s\n" "$1"; }
fail() { printf "  \033[31mFAIL\033[0m %s\n" "$1"; }

bar "TEST 1: POST /api/parse with INVALID Clerk bearer (expect 401)"
out=$(curl -s -o /tmp/jb_t1.body -w "%{http_code}" \
  -X POST "$PROD/api/parse" \
  -H "Authorization: Bearer invalid_clerk_token_xyz" \
  --form "file=@/etc/hostname;type=application/pdf;filename=test.pdf" \
  --max-time 30)
echo "  http=$out"
echo "  body=$(head -c 200 /tmp/jb_t1.body)"
[ "$out" = "401" ] && pass "anonymous/invalid auth rejected" || fail "expected 401, got $out"

bar "TEST 2: POST /api/parse WITHOUT any auth header (expect 401)"
out=$(curl -s -o /tmp/jb_t2.body -w "%{http_code}" \
  -X POST "$PROD/api/parse" \
  --form "file=@/etc/hostname;type=application/pdf;filename=test.pdf" \
  --max-time 30)
echo "  http=$out"
echo "  body=$(head -c 200 /tmp/jb_t2.body)"
[ "$out" = "401" ] && pass "anonymous rejected" || fail "expected 401, got $out"

bar "TEST 3: GET /api/health (expect 200 / 503 with status only, no config map)"
body=$(curl -s -w "\n__HTTP=%{http_code}" "$PROD/api/health" --max-time 10)
code=$(echo "$body" | tail -n 1 | sed 's/__HTTP=//')
payload=$(echo "$body" | sed '$d')
echo "  http=$code"
echo "  body=$payload"
if echo "$payload" | grep -qE 'stripeConfigured|resendConfigured|cronConfigured|rateLimitBackend|latexService'; then
  fail "verbose probe map leaked to anonymous caller"
else
  pass "no probe map disclosed"
fi

bar "TEST 4: Security headers on https://joben.eu"
hdrs=$(curl -sI "$PROD" --max-time 10)
echo "$hdrs" | grep -iE 'x-frame|x-content|content-security-policy|referrer-policy|strict-transport|permissions-policy|x-xss' || true
for h in 'x-frame-options' 'x-content-type-options' 'content-security-policy' 'referrer-policy' 'strict-transport-security' 'permissions-policy'; do
  if echo "$hdrs" | grep -qi "^$h:"; then
    pass "$h present"
  else
    fail "$h missing"
  fi
done

bar "DONE"
