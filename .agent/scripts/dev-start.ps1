# Smart Hostel Development Startup Script
# Automatically sets up ADB reverse and starts backend + AI service

Write-Host "🚀 Starting Smart Hostel Development Environment..." -ForegroundColor Cyan
Write-Host ""

# Step 1: Setup ADB Reverse Port Forwarding
Write-Host "📱 Setting up ADB reverse port forwarding..." -ForegroundColor Yellow
& "$PSScriptRoot\setup-adb-reverse.ps1"
Write-Host ""

# Step 2: Start Backend Server
Write-Host "🔧 Starting Backend Server..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Codes\smarthostel\backend'; npm run dev" -WindowStyle Normal
Start-Sleep -Seconds 3


Write-Host ""
Write-Host "✅ Development environment started!" -ForegroundColor Green
Write-Host "   - Backend: http://localhost:5000" -ForegroundColor Gray
Write-Host "   - AI Service: http://localhost:8000" -ForegroundColor Gray
Write-Host "   - Frontend: Run 'npx expo run:android' manually to start the mobile app" -ForegroundColor Gray
Write-Host ""

# Step 4: Start AI Service
Write-Host "🤖 Starting AI Service..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd 'c:\Codes\smarthostel\ai-service'; .\venv\Scripts\activate; uvicorn main:app --host 0.0.0.0 --port 8000 --reload" -WindowStyle Normal
Write-Host "Tip: If you get network errors, run:" -ForegroundColor Cyan
Write-Host "   powershell -ExecutionPolicy Bypass -File .agent/scripts/setup-adb-reverse.ps1" -ForegroundColor White
