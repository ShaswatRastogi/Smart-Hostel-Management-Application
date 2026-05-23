#!/bin/bash
echo "Starting Smart Hostel Backend..."
cd backend && npm run dev &

echo "Starting AI Microservice..."
cd ai-service && source venv/bin/activate && uvicorn main:app --reload --host 0.0.0.0 &

echo ""
echo "Development environment is starting..."
echo "Backend: http://localhost:5000"
echo "AI Service: http://localhost:8000"
echo "Press Ctrl+C to stop all services."
wait
