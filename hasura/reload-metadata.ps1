# PowerShell script to reload Hasura metadata via API

$HASURA_URL = if ($env:HASURA_URL) { $env:HASURA_URL } else { "http://localhost:8080" }
$HASURA_ADMIN_SECRET = if ($env:HASURA_ADMIN_SECRET) { $env:HASURA_ADMIN_SECRET } else { "myadminsecretkey" }

Write-Host "🔄 Reloading Hasura metadata..." -ForegroundColor Cyan

try {
    $headers = @{
        "Content-Type" = "application/json"
        "X-Hasura-Admin-Secret" = $HASURA_ADMIN_SECRET
    }
    
    $body = @{
        type = "reload_metadata"
        args = @{}
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$HASURA_URL/v1/metadata" `
        -Method Post `
        -Headers $headers `
        -Body $body `
        -ErrorAction Stop
    
    Write-Host "✅ Metadata reloaded successfully!" -ForegroundColor Green
    $response | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Failed to reload metadata" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    exit 1
}

