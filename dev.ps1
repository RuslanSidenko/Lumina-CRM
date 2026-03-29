# 1. Move to backend and build
# This name stays same so Windows Firewall only asks once
Set-Location backend
go build -o dev_app.exe ./cmd/api/main.go
Set-Location ..

# 2. Launch Backend (Minimized)
$B = "-NoExit", "-Command", "cd backend; ./dev_app.exe"
Start-Process powershell -ArgumentList $B -WindowStyle Minimized

# 3. Launch Frontend (Minimized)
$F = "-NoExit", "-Command", "cd frontend; npm run dev"
Start-Process powershell -ArgumentList $F -WindowStyle Minimized

# 4. Simple Status (No quotes to prevent ParserErrors)
Write-Host Lumina_CRM_Started_Successfully -ForegroundColor Green
Write-Host API_at_port_8090
Write-Host App_at_port_3001