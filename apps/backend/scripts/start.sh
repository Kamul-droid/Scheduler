#!/bin/sh
set -e

echo "🚀 Starting backend application..."

# Validate that the built application exists
if [ ! -f "dist/main.js" ]; then
  echo "❌ Error: dist/main.js not found. Build may have failed."
  exit 1
fi

# Start the application
echo "✅ Starting NestJS application..."
exec node dist/main.js

