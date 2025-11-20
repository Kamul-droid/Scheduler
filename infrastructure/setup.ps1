# Resource Scheduler - Setup Script (PowerShell)
# This script helps set up the development environment

Write-Host "🚀 Resource Scheduler Setup" -ForegroundColor Cyan
Write-Host "==========================" -ForegroundColor Cyan
Write-Host ""

# Check if Docker is running
try {
    docker info | Out-Null
    Write-Host "✅ Docker is running" -ForegroundColor Green
} catch {
    Write-Host "❌ Docker is not running. Please start Docker and try again." -ForegroundColor Red
    exit 1
}

Write-Host ""

# Check if .env exists
$envPath = Join-Path (Split-Path $PSScriptRoot -Parent) ".env"
if (-not (Test-Path $envPath)) {
    Write-Host "📝 Creating .env file..." -ForegroundColor Yellow
    $envExample = Join-Path (Split-Path $PSScriptRoot -Parent) ".env.example"
    if (Test-Path $envExample) {
        Copy-Item $envExample $envPath
        Write-Host "✅ .env file created" -ForegroundColor Green
        Write-Host "   Please review and update .env with your configuration" -ForegroundColor Yellow
    } else {
        Write-Host "⚠️  .env.example not found. Please create .env manually." -ForegroundColor Yellow
    }
    Write-Host ""
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
    Write-Host ""
}

# Start services
Write-Host "🐳 Starting PostgreSQL and Hasura..." -ForegroundColor Cyan
docker-compose up -d

Write-Host ""
Write-Host "⏳ Waiting for services to be ready..." -ForegroundColor Yellow
Start-Sleep -Seconds 5

# Check if services are running
$services = docker-compose ps
if ($services -match "Up") {
    Write-Host "✅ Services are running" -ForegroundColor Green
} else {
    Write-Host "⚠️  Services may still be starting. Check with: docker-compose ps" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "📊 Service URLs:" -ForegroundColor Cyan
Write-Host "   PostgreSQL: localhost:5432"
Write-Host "   Hasura Console: http://localhost:8080/console"
Write-Host "   Hasura GraphQL: http://localhost:8080/v1/graphql"
Write-Host ""
Write-Host "🔑 Default Hasura Admin Secret: myadminsecretkey" -ForegroundColor Yellow
Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Open Hasura Console: http://localhost:8080/console"
Write-Host "2. Track all tables in the Data tab"
Write-Host "3. Set up relationships and permissions"
Write-Host "4. Start the backend: cd ..\apps\backend && npm install && npm run start:dev"

