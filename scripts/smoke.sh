#!/usr/bin/env bash
# Post-deploy smoke test: the site, security headers and API respond as expected.
set -euo pipefail
base="${1:?usage: smoke.sh https://host}"

for attempt in 1 2 3 4 5 6; do
  if curl -fsS -o /dev/null "$base/"; then break; fi
  echo "waiting for $base ($attempt)"; sleep 10
done

headers=$(curl -fsS -D - -o /dev/null "$base/")
grep -qi "^content-security-policy: default-src 'none'" <<<"$headers" || { echo "missing CSP"; exit 1; }
grep -qi '^strict-transport-security:' <<<"$headers" || { echo "missing HSTS"; exit 1; }

curl -fsS "$base/api/schedule/traitors" | grep -q '"show":"traitors"' || { echo "schedule API failed"; exit 1; }

status=$(curl -s -o /dev/null -w '%{http_code}' -X POST -H 'Content-Type: application/json' \
  -H 'Origin: https://evil.example' -d '{"show":"traitors","name":"x"}' "$base/api/rooms")
[ "$status" = 403 ] || { echo "cross-origin create was not rejected ($status)"; exit 1; }

echo "smoke test passed for $base"
