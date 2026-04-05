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
if [ $? -ne 0 ]; then
    echo "Backend build FAILED. Aborting."
    exit 1
fi
cd ..

# 2. Launch Backend
cd backend || exit
./dev_app &    # run in background
BACKEND_PID=$!
cd ..

# 3. Wait for backend to be ready (max 15s)
echo "Waiting for backend on :8090..."
for i in $(seq 1 30); do
    if curl -s http://localhost:8090/api/v1/auth/login -o /dev/null 2>&1; then
        echo "Backend is ready."
        break
    fi
    sleep 0.5
done

# 4. Launch Frontend
cd frontend || exit
npm run dev &   # run in background
FRONTEND_PID=$!
cd ..

# 5. Status
echo -e "\e[32mLumina_CRM_Started_Successfully\e[0m"
echo "API at port 8090"
echo "App at port 3000"

# 6. Wait for processes
wait $BACKEND_PID $FRONTEND_PID