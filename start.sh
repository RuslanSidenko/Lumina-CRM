#!/bin/bash

# 1. Move to backend and build
cd backend || exit
# Build for Linux (no .exe)
go build -o dev_app ./cmd/api/main.go
cd ..

# 2. Launch Backend (in background)
cd backend || exit
./dev_app &    # run in background
BACKEND_PID=$!
cd ..

# 3. Launch Frontend (in background)
cd frontend || exit
npm run dev &   # run in background
FRONTEND_PID=$!
cd ..

# 4. Simple Status
echo -e "\e[32mLumina_CRM_Started_Successfully\e[0m"
echo "API at port 8090"
echo "App at port 3001"

# Optional: wait for background processes (so script doesn't exit immediately)
# wait $BACKEND_PID $FRONTEND_PID