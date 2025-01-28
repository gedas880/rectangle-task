$ErrorActionPreference = "Stop"

Write-Host "Starting development environment..." -ForegroundColor Green

# Function to check if a command exists
function Test-Command($command) {
    try { Get-Command $command -ErrorAction Stop | Out-Null
        return $true
    }
    catch { return $false }
}

# Check requirements
if (-not (Test-Command "dotnet")) {
    Write-Host "Error: dotnet SDK is not installed" -ForegroundColor Red
    exit 1
}

if (-not (Test-Command "npm")) {
    Write-Host "Error: npm is not installed" -ForegroundColor Red
    exit 1
}

# Start backend
$backendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\backend\backend
    Write-Host "Starting backend..."
    dotnet run
}

# Start frontend
$frontendJob = Start-Job -ScriptBlock {
    Set-Location $using:PWD\frontend
    Write-Host "Starting frontend..."
    npm install
    npm start
}

Write-Host "Starting services..." -ForegroundColor Yellow

try {
    # Wait a bit and then get initial output
    Start-Sleep -Seconds 2

    Receive-Job $backendJob
    Write-Host "Backend is starting..." -ForegroundColor Cyan

    Receive-Job $frontendJob
    Write-Host "Frontend is starting..." -ForegroundColor Cyan
    
    Write-Host "`nPress Ctrl+C to stop both services`n" -ForegroundColor Yellow
    
    while ($true) {
        Receive-Job $backendJob
        Receive-Job $frontendJob
        Start-Sleep -Seconds 1
    }
}
finally {
    Write-Host "`nStopping services..." -ForegroundColor Yellow
    Stop-Job $backendJob
    Stop-Job $frontendJob
    Remove-Job $backendJob
    Remove-Job $frontendJob
}