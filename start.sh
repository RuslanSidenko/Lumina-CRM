#!/bin/bash

# Function to clean up background processes
cleanup() {
    echo -e "\nStopping frontend and backend..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit
}

# Trap Ctrl+C (SIGINT) and call cleanup
trap cleanup SIGINT

# 1. Move to backend and build
cd backend || exit
go build -o dev_app ./cmd/api/main.go
cd ..

# 2. Launch Backend
cd backend || exit
./dev_app &    # run in background
BACKEND_PID=$!
cd ..

# 3. Launch Frontend
cd frontend || exit
npm run dev &   # run in background
FRONTEND_PID=$!
cd ..

# 4. Status
echo -e "\e[32mLumina_CRM_Started_Successfully\e[0m"
echo "API at port 8090"
echo "App at port 3001"

# 5. Wait for processes
wait $BACKEND_PID $FRONTEND_PID