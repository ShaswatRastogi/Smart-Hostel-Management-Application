---
description: Start development environment with automatic ADB setup
---

# Start Development Environment

This workflow automatically sets up ADB reverse port forwarding and starts the backend and AI service. You will start the frontend manually.

## Steps

// turbo-all
1. Run the development startup script:
```powershell
powershell -ExecutionPolicy Bypass -File .agent/scripts/dev-start.ps1
```

This will:
- ✅ Configure ADB reverse for all connected devices
- ✅ Start the backend server (http://localhost:5000)
- ✅ Start the AI Service (http://localhost:8000)

2. Start the Frontend Application:
```powershell
npx expo run:android
```

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
npx expo run:android
```

### ADB Setup Only
```powershell
powershell -ExecutionPolicy Bypass -File .agent/scripts/setup-adb-reverse.ps1
```
