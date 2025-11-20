# Script to create .env files from templates

Write-Host "Creating .env files..." -ForegroundColor Cyan

# Create root .env file
if (-not (Test-Path ".env")) {
    if (Test-Path "env.template") {
        Copy-Item "env.template" ".env"
        Write-Host "✅ Created .env in project root" -ForegroundColor Green
    } else {
        Write-Host "❌ env.template not found" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  .env already exists in project root (skipped)" -ForegroundColor Yellow
}

# Create infrastructure/.env file
if (-not (Test-Path "infrastructure\.env")) {
    if (Test-Path "infrastructure\env.template") {
        Copy-Item "infrastructure\env.template" "infrastructure\.env"
        Write-Host "✅ Created .env in infrastructure directory" -ForegroundColor Green
    } else {
        Write-Host "❌ infrastructure/env.template not found" -ForegroundColor Red
    }
} else {
    Write-Host "⚠️  .env already exists in infrastructure directory (skipped)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Done! Review and update .env files if needed." -ForegroundColor Green

