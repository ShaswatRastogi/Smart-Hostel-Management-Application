@echo off
echo Starting Redis Server...
start cmd /k "cd redis && redis-server.exe"

echo Starting Smart Hostel Backend...
start cmd /k "cd backend && npm run dev"
echo Starting AI Microservice...
start cmd /k "cd ai-service && venv\Scripts\uvicorn main:app --reload --host 0.0.0.0"
@REM echo Starting Smart Hostel Frontend...
@REM start cmd /k "npx expo start"

echo.
echo Development environment is starting in separate windows.
pause


