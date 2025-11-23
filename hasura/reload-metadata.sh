#!/bin/bash
# Script to reload Hasura metadata via API (useful when Hasura is running in Docker)

set -e

HASURA_URL="${HASURA_URL:-http://localhost:8080}"
HASURA_ADMIN_SECRET="${HASURA_ADMIN_SECRET:-myadminsecretkey}"

echo "🔄 Reloading Hasura metadata..."

# Reload metadata via API
response=$(curl -s -w "\n%{http_code}" -X POST \
  "${HASURA_URL}/v1/metadata" \
  -H "Content-Type: application/json" \
  -H "X-Hasura-Admin-Secret: ${HASURA_ADMIN_SECRET}" \
  -d '{
    "type": "reload_metadata",
    "args": {}
  }')

http_code=$(echo "$response" | tail -n1)
body=$(echo "$response" | sed '$d')

if [ "$http_code" -eq 200 ]; then
    echo "✅ Metadata reloaded successfully!"
    echo "$body" | jq '.' 2>/dev/null || echo "$body"
else
    echo "❌ Failed to reload metadata (HTTP $http_code)"
    echo "$body"
    exit 1
fi

