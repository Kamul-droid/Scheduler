# PowerShell script to apply Hasura metadata
# This script tracks tables in Hasura so they appear in the GraphQL schema

$HASURA_URL = if ($env:HASURA_URL) { $env:HASURA_URL } else { "http://localhost:8080" }
$HASURA_ADMIN_SECRET = if ($env:HASURA_ADMIN_SECRET) { $env:HASURA_ADMIN_SECRET } else { "myadminsecretkey" }

Write-Host "📦 Tracking tables in Hasura..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "X-Hasura-Admin-Secret" = $HASURA_ADMIN_SECRET
}

# List of tables to track
$tables = @("employees", "departments", "shifts", "schedules", "constraints")

Write-Host "Tracking $($tables.Count) tables..." -ForegroundColor Yellow

$trackedCount = 0
$failedCount = 0

foreach ($table in $tables) {
    Write-Host "  Tracking: $table..." -ForegroundColor Gray -NoNewline
    
    try {
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
        
        # Use Invoke-WebRequest to get better error details
        $response = Invoke-WebRequest -Uri "$HASURA_URL/v1/metadata" `
            -Method Post `
            -Headers $headers `
            -Body $trackQuery `
            -ErrorAction Stop
        
        if ($response.StatusCode -eq 200) {
            Write-Host " ✅" -ForegroundColor Green
            $trackedCount++
        } else {
            Write-Host " ⚠️  (Status: $($response.StatusCode))" -ForegroundColor Yellow
            $trackedCount++
        }
    } catch {
        $statusCode = $null
        $errorBody = $null
        
        # Get error details from the exception
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
            
            # Read the error response body - Invoke-WebRequest uses ErrorResponse property
            try {
                if ($_.Exception.Response -is [System.Net.Http.HttpResponseMessage]) {
                    # For Invoke-WebRequest, read from Content property
                    $errorBody = $_.Exception.Response.Content.ReadAsStringAsync().Result
                } else {
                    # Fallback for other exception types
                    $responseStream = $_.Exception.Response.GetResponseStream()
                    $streamReader = New-Object System.IO.StreamReader($responseStream)
                    $errorBody = $streamReader.ReadToEnd()
                    $streamReader.Close()
                    $responseStream.Close()
                }
            } catch {
                # If we can't read the stream, try to get error from exception
                $errorBody = $_.Exception.Message
                if ($_.ErrorDetails) {
                    $errorBody = $_.ErrorDetails.Message
                }
            }
        } else {
            $errorBody = $_.Exception.Message
            if ($_.ErrorDetails) {
                $errorBody = $_.ErrorDetails.Message
            }
        }
        
        if ($statusCode -eq 400) {
            # Check if table is already tracked
            if ($errorBody -match "already tracked" -or $errorBody -match "already exists" -or $errorBody -match "duplicate") {
                Write-Host " ⚠️  (already tracked)" -ForegroundColor Yellow
                $trackedCount++
            } else {
                Write-Host " ❌" -ForegroundColor Red
                Write-Host "    Status: $statusCode" -ForegroundColor Red
                $errorPreview = if ($errorBody) { $errorBody.Substring(0, [Math]::Min(150, $errorBody.Length)) } else { "Unknown error" }
                Write-Host "    Error: $errorPreview" -ForegroundColor Red
                $failedCount++
            }
        } elseif ($statusCode -eq 404) {
            Write-Host " ❌ (table not found)" -ForegroundColor Red
            Write-Host "    Run: .\hasura\apply-migrations.ps1" -ForegroundColor Yellow
            $failedCount++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            if ($statusCode) {
                Write-Host "    Status: $statusCode" -ForegroundColor Red
            }
            $errorPreview = if ($errorBody) { $errorBody.Substring(0, [Math]::Min(150, $errorBody.Length)) } else { $_.Exception.Message }
            Write-Host "    Error: $errorPreview" -ForegroundColor Red
            $failedCount++
        }
    }
}

Write-Host ""
if ($trackedCount -eq $tables.Count) {
    Write-Host "✅ All tables tracked successfully!" -ForegroundColor Green
} else {
    Write-Host "⚠️  Tracked $trackedCount out of $($tables.Count) tables" -ForegroundColor Yellow
    if ($failedCount -gt 0) {
        Write-Host "   $failedCount table(s) failed to track" -ForegroundColor Red
    }
}

# Reload metadata to ensure everything is synced
Write-Host ""
Write-Host "Reloading metadata..." -ForegroundColor Yellow
try {
    $reloadQuery = @{
        type = "reload_metadata"
        args = @{
            reload_remote_schemas = $false
            reload_sources = $true
        }
    } | ConvertTo-Json -Depth 10
    
    $response = Invoke-RestMethod -Uri "$HASURA_URL/v1/metadata" `
        -Method Post `
        -Headers $headers `
        -Body $reloadQuery `
        -ErrorAction Stop
    
    Write-Host "✅ Metadata reloaded!" -ForegroundColor Green
} catch {
    Write-Host "⚠️  Metadata reload failed (but tables may still be tracked)" -ForegroundColor Yellow
}

# Verify tables are now in GraphQL schema
Write-Host ""
Write-Host "Verifying GraphQL schema..." -ForegroundColor Yellow
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
        Write-Host "✅ GraphQL schema has $($queryFields.Count) query fields:" -ForegroundColor Green
        foreach ($field in $queryFields) {
            Write-Host "   - $field" -ForegroundColor Gray
        }
    } else {
        Write-Host "⚠️  No query fields available yet" -ForegroundColor Yellow
        Write-Host "   Try restarting Hasura: docker-compose restart hasura" -ForegroundColor Cyan
    }
} catch {
    Write-Host "⚠️  Could not verify schema" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Setup complete!" -ForegroundColor Green

