# Lumina CRM - Local Development Launcher
# Runs both Backend (Go) and Frontend (Next.js) in parallel processes

Write-Host "🚀 Starting Lumina CRM Development Environment..." -ForegroundColor Cyan

# Define background jobs
$BackendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd backend; go run ./cmd/api/main.go" -PassThru
$FrontendJob = Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd frontend; npm run dev" -PassThru

Write-Host "✅ Backend and Frontend processes launched!" -ForegroundColor Green
Write-Host "🌐 API: http://localhost:8090" -ForegroundColor Gray
Write-Host "🌐 App: http://localhost:3001" -ForegroundColor Gray
Write-Host "💡 To stop, simply close the two newly opened PowerShell windows." -ForegroundColor Yellow
