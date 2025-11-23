# Simple PowerShell script to track tables using Invoke-RestMethod (better JSON handling)

$HASURA_URL = if ($env:HASURA_URL) { $env:HASURA_URL } else { "http://localhost:8080" }
$HASURA_ADMIN_SECRET = if ($env:HASURA_ADMIN_SECRET) { $env:HASURA_ADMIN_SECRET } else { "myadminsecretkey" }

Write-Host "📦 Tracking tables in Hasura..." -ForegroundColor Cyan
Write-Host ""

$headers = @{
    "Content-Type" = "application/json"
    "X-Hasura-Admin-Secret" = $HASURA_ADMIN_SECRET
}

$tables = @("employees", "departments", "shifts", "schedules", "constraints")
$trackedCount = 0
$failedCount = 0

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
        # Use Invoke-RestMethod which handles JSON better
        $response = Invoke-RestMethod -Uri "$HASURA_URL/v1/metadata" `
            -Method Post `
            -Headers $headers `
            -Body $trackQuery `
            -ErrorAction Stop
        
        Write-Host " ✅" -ForegroundColor Green
        $trackedCount++
    } catch {
        $errorObj = $null
        $statusCode = $null
        $errorMessage = $null
        
        # Try to parse the error response
        try {
            # Invoke-RestMethod puts the error response in ErrorDetails.Message or Exception.Message
            if ($_.ErrorDetails.Message) {
                $errorObj = $_.ErrorDetails.Message | ConvertFrom-Json -ErrorAction SilentlyContinue
                $errorMessage = $_.ErrorDetails.Message
            } elseif ($_.Exception.Response) {
                # For web exceptions, try to read the response
                $statusCode = [int]$_.Exception.Response.StatusCode
                if ($_.Exception.Response -is [System.Net.HttpWebResponse]) {
                    $stream = $_.Exception.Response.GetResponseStream()
                    $reader = New-Object System.IO.StreamReader($stream)
                    $errorMessage = $reader.ReadToEnd()
                    $reader.Close()
                    $stream.Close()
                    $errorObj = $errorMessage | ConvertFrom-Json -ErrorAction SilentlyContinue
                }
            }
        } catch {
            $errorMessage = $_.Exception.Message
        }
        
        if (-not $errorMessage) {
            $errorMessage = $_.Exception.Message
        }
        
        # Check if already tracked
        $isAlreadyTracked = $false
        if ($errorObj) {
            if ($errorObj.error -and ($errorObj.error -match "already tracked" -or $errorObj.error -match "already exists")) {
                $isAlreadyTracked = $true
            }
        } elseif ($errorMessage -match "already tracked" -or $errorMessage -match "already exists" -or $errorMessage -match "duplicate") {
            $isAlreadyTracked = $true
        }
        
        if ($statusCode -eq 400 -and $isAlreadyTracked) {
            Write-Host " ⚠️  (already tracked)" -ForegroundColor Yellow
            $trackedCount++
        } else {
            Write-Host " ❌" -ForegroundColor Red
            if ($statusCode) {
                Write-Host "      Status: $statusCode" -ForegroundColor Red
            }
            $errorPreview = if ($errorMessage) {
                $errorMessage.Substring(0, [Math]::Min(150, $errorMessage.Length))
            } else {
                "Unknown error"
            }
            Write-Host "      Error: $errorPreview" -ForegroundColor Red
            $failedCount++
        }
    }
}

Write-Host ""
Write-Host "📊 Summary: Tracked $trackedCount/$($tables.Count) tables" -ForegroundColor $(if ($trackedCount -eq $tables.Count) { "Green" } else { "Yellow" })

if ($failedCount -gt 0) {
    Write-Host ""
    Write-Host "💡 Troubleshooting:" -ForegroundColor Cyan
    Write-Host "   1. Check if tables exist: .\hasura\diagnose.ps1" -ForegroundColor White
    Write-Host "   2. Apply migrations: .\hasura\apply-migrations.ps1" -ForegroundColor White
    Write-Host "   3. Check Hasura console: $HASURA_URL/console" -ForegroundColor White
}

# Reload metadata
Write-Host ""
Write-Host "🔄 Reloading metadata..." -ForegroundColor Yellow
try {
    $reloadQuery = @{
        type = "reload_metadata"
        args = @{
            reload_sources = $true
        }
    } | ConvertTo-Json
    
    Invoke-RestMethod -Uri "$HASURA_URL/v1/metadata" `
        -Method Post `
        -Headers $headers `
        -Body $reloadQuery `
        -ErrorAction Stop | Out-Null
    
    Write-Host "   ✅ Metadata reloaded!" -ForegroundColor Green
} catch {
    Write-Host "   ⚠️  Reload failed (tables may still be tracked)" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "✅ Done! Check GraphQL schema at: $HASURA_URL/v1/graphql" -ForegroundColor Green

