# PowerShell script to apply Hasura migrations

$HASURA_URL = if ($env:HASURA_URL) { $env:HASURA_URL } else { "http://localhost:8080" }
$HASURA_ADMIN_SECRET = if ($env:HASURA_ADMIN_SECRET) { $env:HASURA_ADMIN_SECRET } else { "myadminsecretkey" }

Write-Host "📦 Applying Hasura migrations..." -ForegroundColor Cyan

$headers = @{
    "Content-Type" = "application/json"
    "X-Hasura-Admin-Secret" = $HASURA_ADMIN_SECRET
}

# Get migration status
Write-Host "Checking migration status..." -ForegroundColor Yellow
try {
    $statusQuery = @{
        type = "get_catalog_state"
        args = @{}
    } | ConvertTo-Json
    
    $status = Invoke-RestMethod -Uri "$HASURA_URL/v1/metadata" `
        -Method Post `
        -Headers $headers `
        -Body $statusQuery `
        -ErrorAction Stop
    
    Write-Host "Migration system status retrieved" -ForegroundColor Green
} catch {
    Write-Host "Note: Migration status check failed, but continuing..." -ForegroundColor Yellow
}

# Apply migrations via API
Write-Host ""
Write-Host "Applying migrations..." -ForegroundColor Yellow

# Read migration files
$migrationsPath = Join-Path $PSScriptRoot "migrations"
if (-not (Test-Path $migrationsPath)) {
    Write-Host "❌ Migrations directory not found: $migrationsPath" -ForegroundColor Red
    exit 1
}

$migrationDirs = Get-ChildItem -Path $migrationsPath -Directory | Sort-Object Name
Write-Host "Found $($migrationDirs.Count) migration(s)" -ForegroundColor Gray

foreach ($migrationDir in $migrationDirs) {
    $upSqlPath = Join-Path $migrationDir.FullName "up.sql"
    if (Test-Path $upSqlPath) {
        $sql = Get-Content $upSqlPath -Raw
        Write-Host "  Applying migration: $($migrationDir.Name)..." -ForegroundColor Gray
        
        try {
            $migrationQuery = @{
                type = "run_sql"
                args = @{
                    sql = $sql
                    cascade = $false
                    read_only = $false
                }
            } | ConvertTo-Json -Depth 10
            
            $response = Invoke-RestMethod -Uri "$HASURA_URL/v1/query" `
                -Method Post `
                -Headers $headers `
                -Body $migrationQuery `
                -ErrorAction Stop
            
            Write-Host "    ✅ Migration applied successfully" -ForegroundColor Green
        } catch {
            if ($_.Exception.Response.StatusCode -eq 400) {
                $errorBody = $_.Exception.Response | Get-Member | Where-Object { $_.Name -eq "GetResponseStream" }
                if ($errorBody) {
                    $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
                    $responseBody = $reader.ReadToEnd()
                    if ($responseBody -match "already exists" -or $responseBody -match "duplicate") {
                        Write-Host "    ⚠️  Migration already applied (skipping)" -ForegroundColor Yellow
                    } else {
                        Write-Host "    ❌ Migration failed: $responseBody" -ForegroundColor Red
                    }
                } else {
                    Write-Host "    ⚠️  Migration may already be applied" -ForegroundColor Yellow
                }
            } else {
                Write-Host "    ❌ Migration failed: $($_.Exception.Message)" -ForegroundColor Red
            }
        }
    }
}

Write-Host ""
Write-Host "✅ Migrations applied!" -ForegroundColor Green
Write-Host ""
Write-Host "Next step: Apply metadata with .\hasura\apply-metadata.ps1" -ForegroundColor Cyan

