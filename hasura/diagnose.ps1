# PowerShell script to diagnose Hasura setup

$HASURA_URL = if ($env:HASURA_URL) { $env:HASURA_URL } else { "http://localhost:8080" }
$HASURA_ADMIN_SECRET = if ($env:HASURA_ADMIN_SECRET) { $env:HASURA_ADMIN_SECRET } else { "myadminsecretkey" }

Write-Host "🔍 Diagnosing Hasura Setup..." -ForegroundColor Cyan
Write-Host ""

# 1. Check Hasura is running
Write-Host "1️⃣ Checking Hasura is running..." -ForegroundColor Yellow
try {
    $version = Invoke-RestMethod -Uri "$HASURA_URL/v1/version" -Method Get -ErrorAction Stop
    Write-Host "   ✅ Hasura is running (Version: $($version.version))" -ForegroundColor Green
} catch {
    Write-Host "   ❌ Hasura is not running or not accessible" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# 2. Check database connection
Write-Host ""
Write-Host "2️⃣ Checking database connection..." -ForegroundColor Yellow
$headers = @{
    "Content-Type" = "application/json"
    "X-Hasura-Admin-Secret" = $HASURA_ADMIN_SECRET
}

try {
    $dbStatus = Invoke-RestMethod -Uri "$HASURA_URL/v1/metadata" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $databases = $dbStatus.databases
    if ($databases -and $databases.Count -gt 0) {
        Write-Host "   ✅ Database connection configured" -ForegroundColor Green
        foreach ($db in $databases) {
            Write-Host "      - Database: $($db.name) ($($db.kind))" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No databases configured" -ForegroundColor Yellow
    }
} catch {
    Write-Host "   ❌ Failed to check database connection" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 3. Check if tables exist in database
Write-Host ""
Write-Host "3️⃣ Checking if tables exist in database..." -ForegroundColor Yellow
try {
    $query = @{
        type = "run_sql"
        args = @{
            sql = "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_type = 'BASE TABLE' ORDER BY table_name;"
        }
    } | ConvertTo-Json -Depth 10
    
    $tablesResponse = Invoke-RestMethod -Uri "$HASURA_URL/v1/query" `
        -Method Post `
        -Headers $headers `
        -Body $query `
        -ErrorAction Stop
    
    if ($tablesResponse.result -and $tablesResponse.result.Count -gt 0) {
        $tables = $tablesResponse.result | Where-Object { $_ -is [array] -and $_.Count -gt 0 } | ForEach-Object { $_[0] }
        Write-Host "   ✅ Found $($tables.Count) tables in database:" -ForegroundColor Green
        foreach ($table in $tables) {
            Write-Host "      - $table" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No tables found in database" -ForegroundColor Yellow
        Write-Host "   💡 You may need to apply migrations first" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Failed to check tables" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 4. Check tracked tables in Hasura
Write-Host ""
Write-Host "4️⃣ Checking tracked tables in Hasura..." -ForegroundColor Yellow
try {
    $metadata = Invoke-RestMethod -Uri "$HASURA_URL/v1/metadata" `
        -Method Get `
        -Headers $headers `
        -ErrorAction Stop
    
    $trackedTables = @()
    if ($metadata.databases) {
        foreach ($db in $metadata.databases) {
            if ($db.tables) {
                $trackedTables += $db.tables | ForEach-Object { $_.table.name }
            }
        }
    }
    
    if ($trackedTables.Count -gt 0) {
        Write-Host "   ✅ Found $($trackedTables.Count) tracked tables:" -ForegroundColor Green
        foreach ($table in $trackedTables) {
            Write-Host "      - $table" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No tables are tracked in Hasura" -ForegroundColor Yellow
        Write-Host "   💡 You need to apply metadata to track tables" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Failed to check tracked tables" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

# 5. Check GraphQL schema
Write-Host ""
Write-Host "5️⃣ Checking GraphQL schema..." -ForegroundColor Yellow
try {
    $schemaQuery = @{
        query = "{ __schema { queryType { fields { name } } } }"
    } | ConvertTo-Json
    
    $schemaResponse = Invoke-RestMethod -Uri "$HASURA_URL/v1/graphql" `
        -Method Post `
        -Headers $headers `
        -Body $schemaQuery `
        -ErrorAction Stop
    
    $fields = $schemaResponse.data.__schema.queryType.fields
    $queryFields = $fields | Where-Object { $_.name -ne "no_queries_available" } | ForEach-Object { $_.name }
    
    if ($queryFields.Count -gt 0) {
        Write-Host "   ✅ GraphQL schema has $($queryFields.Count) query fields:" -ForegroundColor Green
        foreach ($field in $queryFields) {
            Write-Host "      - $field" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No query fields available (only 'no_queries_available')" -ForegroundColor Yellow
        Write-Host "   💡 This means tables are not tracked or metadata is not applied" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ❌ Failed to check GraphQL schema" -ForegroundColor Red
    Write-Host "   Error: $($_.Exception.Message)" -ForegroundColor Red
}

Write-Host ""
Write-Host "📋 Summary and Next Steps:" -ForegroundColor Cyan
Write-Host "   1. If tables don't exist: Apply migrations" -ForegroundColor White
Write-Host "   2. If tables exist but not tracked: Apply metadata" -ForegroundColor White
Write-Host "   3. If metadata applied but still not working: Restart Hasura" -ForegroundColor White
Write-Host ""
Write-Host "   Run: .\hasura\apply-migrations.ps1" -ForegroundColor Yellow
Write-Host "   Run: .\hasura\apply-metadata.ps1" -ForegroundColor Yellow

