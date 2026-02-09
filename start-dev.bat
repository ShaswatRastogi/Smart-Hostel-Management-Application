@echo off
echo Starting SmartHostel Environment...

:: Start Backend
echo Starting Backend Server (Dev Mode)...
start "SmartHostel Backend" cmd /k "cd backend && npm run dev"

echo Servers started in separate windows.
