# Smart Hostel Development Startup Script
# Automatically sets up ADB reverse and starts backend + frontend

Write-Host "🚀 Starting Smart Hostel Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup ADB Reverse Port Forwarding
Write-Host "📱 Setting up ADB reverse port forwarding..." -ForegroundColor Yellow
& "$PSScriptRoot\setup-adb-reverse.ps1"
Write-Host ""

# Step 2: Start Backend Server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\smarthostel\backend'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3

# Step 3: Start Frontend (Expo)
Write-Host "📱 Starting Expo Dev Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'd:\smarthostel'; npx expo start" -WindowStyle Normal

Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "   - Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "   - Expo: Check the new terminal window" -ForegroundColor Gray
Write-Host ""
Write-Host "💡 Tip: If you get network errors, run:" -ForegroundColor Cyan
Write-Host "   powershell -ExecutionPolicy Bypass -File .agent/scripts/setup-adb-reverse.ps1" -ForegroundColor White
