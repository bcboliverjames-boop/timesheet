# 启动开发环境脚本

Write-Host "🚀 Starting WMS Development Environment..." -ForegroundColor Green

# 检查依赖是否安装
if (-not (Test-Path "backend\node_modules")) {
    Write-Host "⚠️  Backend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    Set-Location ..
}

if (-not (Test-Path "frontend\node_modules")) {
    Write-Host "⚠️  Frontend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    Set-Location ..
}

# 启动后端（新窗口）
Write-Host "📦 Starting Backend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Backend Server' -ForegroundColor Green; npm run dev"

# 等待一下
Start-Sleep -Seconds 2

# 启动前端（新窗口）
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Frontend Server' -ForegroundColor Green; npm run dev"

Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Backend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "📝 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

