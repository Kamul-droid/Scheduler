#!/bin/bash

# Resource Scheduler - Setup Script
# This script helps set up the development environment

set -e

echo "🚀 Resource Scheduler Setup"
echo "=========================="
echo ""

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker and try again."
    exit 1
fi

echo "✅ Docker is running"
echo ""

# Check if .env exists
if [ ! -f "../.env" ]; then
    echo "📝 Creating .env file from .env.example..."
    cp ../.env.example ../.env 2>/dev/null || echo "⚠️  .env.example not found. Please create .env manually."
    echo "✅ .env file created"
    echo "   Please review and update .env with your configuration"
    echo ""
else
    echo "✅ .env file already exists"
    echo ""
fi

# Start services
echo "🐳 Starting PostgreSQL and Hasura..."
docker-compose up -d

echo ""
echo "⏳ Waiting for services to be ready..."
sleep 5

# Check if services are healthy
if docker-compose ps | grep -q "healthy"; then
    echo "✅ Services are healthy"
else
    echo "⚠️  Services may still be starting. Check with: docker-compose ps"
fi

echo ""
echo "📊 Service URLs:"
echo "   PostgreSQL: localhost:5432"
echo "   Hasura Console: http://localhost:8080/console"
echo "   Hasura GraphQL: http://localhost:8080/v1/graphql"
echo ""
echo "🔑 Default Hasura Admin Secret: myadminsecretkey"
echo ""
echo "✅ Setup complete!"
echo ""
echo "Next steps:"
echo "1. Open Hasura Console: http://localhost:8080/console"
echo "2. Track all tables in the Data tab"
echo "3. Set up relationships and permissions"
echo "4. Start the backend: cd ../apps/backend && npm install && npm run start:dev"

