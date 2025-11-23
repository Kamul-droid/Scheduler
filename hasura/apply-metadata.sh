#!/bin/bash
# Script to apply Hasura metadata and reload schema

set -e

echo "🔧 Applying Hasura metadata..."

# Check if Hasura CLI is available
if ! command -v hasura &> /dev/null; then
    echo "❌ Hasura CLI not found. Please install it first:"
    echo "   curl -L https://github.com/hasura/graphql-engine/raw/stable/cli/get.sh | bash"
    exit 1
fi

# Apply metadata
echo "📦 Applying metadata..."
hasura metadata apply

# Reload metadata (optional, but ensures schema is up to date)
echo "🔄 Reloading metadata..."
hasura metadata reload

echo "✅ Metadata applied successfully!"
echo ""
echo "You can now access Hasura Console at: http://localhost:8080/console"
echo "Or verify the schema with: hasura metadata export"

