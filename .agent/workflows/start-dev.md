---
description: Start development environment with automatic ADB setup
---

# Start Development Environment

This workflow automatically sets up ADB reverse port forwarding and starts both backend and frontend servers.

## Steps

// turbo-all
1. Run the development startup script:
```powershell
powershell -ExecutionPolicy Bypass -File .agent/scripts/dev-start.ps1
```

This will:
- ✅ Configure ADB reverse for all connected devices
- ✅ Start the backend server (http://localhost:5000)
- ✅ Start the Expo dev server

## Manual ADB Setup (if needed)

If you get network errors after device reconnection, run:
```powershell
powershell -ExecutionPolicy Bypass -File .agent/scripts/setup-adb-reverse.ps1
```

## Individual Commands

### Backend Only
```powershell
cd backend
npm run dev
```

### Frontend Only  
```powershell
npx expo start
```

### ADB Setup Only
```powershell
powershell -ExecutionPolicy Bypass -File .agent/scripts/setup-adb-reverse.ps1
```
