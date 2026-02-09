# Automatically apply ADB reverse port forwarding to all connected devices
# Run this script whenever you connect devices or restart the backend

Write-Host "Setting up ADB reverse port forwarding for all devices..." -ForegroundColor Cyan

# Get all connected devices
$devices = adb devices | Select-String "device`$" | ForEach-Object {
    ($_ -split '\s+')[0]
}

if ($devices.Count -eq 0) {
    Write-Host "No devices connected!" -ForegroundColor Red
    exit 1
}

Write-Host "Found $($devices.Count) device(s)" -ForegroundColor Green

# Apply reverse to each device
foreach ($serial in $devices) {
    Write-Host "Applying reverse to device: $serial" -ForegroundColor Yellow
    $result5000 = adb -s $serial reverse tcp:5000 tcp:5000 2>&1
    $result8081 = adb -s $serial reverse tcp:8081 tcp:8081 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  Success: $serial (Ports 5000, 8081)" -ForegroundColor Green
    } else {
        Write-Host "  Failed: $serial" -ForegroundColor Red
        Write-Host "    Port 5000: $result5000" -ForegroundColor Gray
        Write-Host "    Port 8081: $result8081" -ForegroundColor Gray
    }
}

Write-Host ""
Write-Host "All devices configured! Backend is accessible at localhost:5000" -ForegroundColor Cyan
