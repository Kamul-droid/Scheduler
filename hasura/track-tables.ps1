# PowerShell script to track tables in Hasura
# Simpler version with better error handling

$HASURA_URL = if ($env:HASURA_URL) { $env:HASURA_URL } else { "http://localhost:8080" }
$HASURA_ADMIN_SECRET = if ($env:HASURA_ADMIN_SECRET) { $env:HASURA_ADMIN_SECRET } else { "myadminsecretkey" }

Write-Host "📦 Tracking tables in Hasura..." -ForegroundColor Cyan
Write-Host "   URL: $HASURA_URL" -ForegroundColor Gray
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "X-Hasura-Admin-Secret" = $HASURA_ADMIN_SECRET
}

$tables = @("employees", "departments", "shifts", "schedules", "constraints")
$trackedCount = 0
$failedCount = 0
$errors = @()

foreach ($table in $tables) {
    Write-Host "  Tracking: $table..." -ForegroundColor Gray -NoNewline
    
    $trackQuery = @{
        type = "pg_track_table"
        args = @{
            source = "default"
            table = @{
                name = $table
                schema = "public"
            }
        }
    } | ConvertTo-Json -Depth 10
    
    try {
        $response = Invoke-WebRequest -Uri "$HASURA_URL/v1/metadata" `
            -Method Post `
            -Headers $headers `
            -Body $trackQuery `
            -UseBasicParsing `
            -ErrorAction Stop
        
        Write-Host " ✅" -ForegroundColor Green
        $trackedCount++
    } catch {
        $statusCode = $null
        $errorMessage = $null
        
        # Handle different exception types
        if ($_.Exception.Response) {
            try {
                # Try to get status code
                if ($_.Exception.Response.StatusCode) {
                    $statusCode = [int]$_.Exception.Response.StatusCode
                }
                
                # Try to read error response - handle both HttpWebResponse and HttpResponseMessage
                try {
                    # For HttpWebResponse (Invoke-WebRequest)
                    if ($_.Exception.Response -is [System.Net.HttpWebResponse]) {
                        $responseStream = $_.Exception.Response.GetResponseStream()
                        $reader = New-Object System.IO.StreamReader($responseStream)
                        $errorMessage = $reader.ReadToEnd()
                        $reader.Close()
                        $responseStream.Close()
                    }
                    # For HttpResponseMessage (Invoke-RestMethod or newer PowerShell)
                    elseif ($_.Exception.Response -is [System.Net.Http.HttpResponseMessage]) {
                        $errorMessage = $_.Exception.Response.Content.ReadAsStringAsync().GetAwaiter().GetResult()
                    }
                    else {
                        $errorMessage = $_.Exception.Message
                    }
                } catch {
                    $errorMessage = $_.Exception.Message
                }
            } catch {
                $errorMessage = $_.Exception.Message
            }
        } else {
            $errorMessage = $_.Exception.Message
        }
        
        # Check if already tracked
        if ($statusCode -eq 400 -and $errorMessage -and ($errorMessage -match "already tracked" -or $errorMessage -match "already exists" -or $errorMessage -match "duplicate")) {
            Write-Host " ⚠️  (already tracked)" -ForegroundColor Yellow
            $trackedCount++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            if ($statusCode) {
                Write-Host "      Status: $statusCode" -ForegroundColor Red
            }
            $errorPreview = if ($errorMessage) { 
                $errorMessage.Substring(0, [Math]::Min(200, $errorMessage.Length)) 
            } else { 
                $_.Exception.Message 
            }
            Write-Host "      Error: $errorPreview" -ForegroundColor Red
            $errors += @{ Table = $table; Status = $statusCode; Error = $errorMessage }
            $failedCount++
        }
    }
}

Write-Host ""
Write-Host "📊 Summary:" -ForegroundColor Cyan
Write-Host "   ✅ Tracked: $trackedCount" -ForegroundColor Green
Write-Host "   ❌ Failed: $failedCount" -ForegroundColor $(if ($failedCount -gt 0) { "Red" } else { "Gray" })

if ($failedCount -gt 0) {
    Write-Host ""
    Write-Host "⚠️  Some tables failed to track. Common issues:" -ForegroundColor Yellow
    Write-Host "   1. Tables don't exist - Run: .\hasura\apply-migrations.ps1" -ForegroundColor White
    Write-Host "   2. Hasura not running - Check: docker-compose ps" -ForegroundColor White
    Write-Host "   3. Wrong admin secret - Check: HASURA_ADMIN_SECRET env var" -ForegroundColor White
}

# Reload metadata
Write-Host ""
Write-Host "🔄 Reloading metadata..." -ForegroundColor Yellow
try {
    $reloadQuery = @{
        type = "reload_metadata"
        args = @{
            reload_remote_schemas = $false
            reload_sources = $true
        }
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-WebRequest -Uri "$HASURA_URL/v1/metadata" `
        -Method Post `
        -Headers $headers `
        -Body $reloadQuery `
        -UseBasicParsing `
        -ErrorAction Stop
    
    Write-Host "   ✅ Metadata reloaded!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Metadata reload failed (tables may still be tracked)" -ForegroundColor Yellow
}

# Verify GraphQL schema
Write-Host ""
Write-Host "🔍 Verifying GraphQL schema..." -ForegroundColor Yellow
try {
    $schemaQuery = @{
        query = "{ __schema { queryType { fields { name } } } }"
    } | ConvertTo-Json
    
    $response = Invoke-WebRequest -Uri "$HASURA_URL/v1/graphql" `
        -Method Post `
        -Headers $headers `
        -Body $schemaQuery `
        -UseBasicParsing `
        -ErrorAction Stop
    
    $schemaData = $response.Content | ConvertFrom-Json
    $fields = $schemaData.data.__schema.queryType.fields
    $queryFields = $fields | Where-Object { $_.name -ne "no_queries_available" } | ForEach-Object { $_.name }
    
    if ($queryFields.Count -gt 0) {
        Write-Host "   ✅ GraphQL schema has $($queryFields.Count) query fields:" -ForegroundColor Green
        foreach ($field in $queryFields) {
            Write-Host "      - $field" -ForegroundColor Gray
        }
    } else {
        Write-Host "   ⚠️  No query fields available" -ForegroundColor Yellow
        Write-Host "      Try: docker-compose -f infrastructure/docker-compose.yml restart hasura" -ForegroundColor Cyan
    }
} catch {
    Write-Host "   ⚠️  Could not verify schema: $($_.Exception.Message)" -ForegroundColor Yellow
}

Write-Host ""
if ($trackedCount -eq $tables.Count) {
    Write-Host "✅ All tables tracked successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Some tables were not tracked. Check errors above." -ForegroundColor Yellow
}

