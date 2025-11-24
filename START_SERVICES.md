# 启动前后端服务命令

## 🚀 PowerShell 中启动服务的命令

### 方法一：分别在两个 PowerShell 窗口中启动（推荐）

#### 1️⃣ 启动后端服务

打开第一个 **PowerShell 窗口**，运行：

```powershell
# 进入后端目录
cd C:\Users\zhang\Documents\Cursor\test\backend

# 启动后端开发服务器（热重载）
npm run dev
```

**后端将在以下地址运行：**
- API 地址：`http://localhost:3000`
- 健康检查：`http://localhost:3000/health`

**成功标志：** 看到类似以下输出：
```
Server is running on port 3000
```

---

#### 2️⃣ 启动前端服务

打开第二个 **PowerShell 窗口**，运行：

```powershell
# 进入前端目录
cd C:\Users\zhang\Documents\Cursor\test\frontend

# 启动前端开发服务器
npm run dev
```

**前端将在以下地址运行：**
- 前端地址：`http://localhost:5173`（Vite 默认端口）

**成功标志：** 看到类似以下输出：
```
  VITE v5.0.8  ready in xxx ms

  ➜  Local:   http://localhost:5173/
  ➜  Network: use --host to expose
```

---

### 方法二：在单个 PowerShell 窗口中启动（使用后台任务）

#### 使用 `Start-Job` 在后台启动服务

```powershell
# 进入项目根目录
cd C:\Users\zhang\Documents\Cursor\test

# 启动后端（后台任务）
Start-Job -ScriptBlock {
    Set-Location "C:\Users\zhang\Documents\Cursor\test\backend"
    npm run dev
} -Name "BackendServer"

# 启动前端（后台任务）
Start-Job -ScriptBlock {
    Set-Location "C:\Users\zhang\Documents\Cursor\test\frontend"
    npm run dev
} -Name "FrontendServer"

# 查看运行中的任务
Get-Job

# 查看任务输出
Receive-Job -Name "BackendServer"
Receive-Job -Name "FrontendServer"

# 停止任务
Stop-Job -Name "BackendServer"
Stop-Job -Name "FrontendServer"
Remove-Job -Name "BackendServer"
Remove-Job -Name "FrontendServer"
```

---

### 方法三：使用 PowerShell 脚本一键启动（推荐 ⭐）

创建启动脚本 `start-dev.ps1`：

```powershell
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
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; npm run dev"

# 等待一下
Start-Sleep -Seconds 2

# 启动前端（新窗口）
Write-Host "🎨 Starting Frontend Server..." -ForegroundColor Cyan
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev"

Write-Host "✅ Both servers are starting in separate windows!" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Backend: http://localhost:3000" -ForegroundColor Yellow
Write-Host "📝 Frontend: http://localhost:5173" -ForegroundColor Yellow
Write-Host ""
Write-Host "Press any key to continue..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
```

**使用方法：**

1. 在项目根目录创建 `start-dev.ps1` 文件
2. 在 PowerShell 中运行：
```powershell
cd C:\Users\zhang\Documents\Cursor\test
.\start-dev.ps1
```

这会自动在新窗口中启动后端和前端服务！

---

## 📋 常用命令速查

### 后端命令

```powershell
cd C:\Users\zhang\Documents\Cursor\test\backend

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 启动生产版本
npm start

# Prisma 相关
npm run prisma:generate    # 生成 Prisma Client
npm run prisma:migrate     # 运行数据库迁移
npm run prisma:studio      # 打开 Prisma Studio
```

### 前端命令

```powershell
cd C:\Users\zhang\Documents\Cursor\test\frontend

# 开发模式（热重载）
npm run dev

# 构建生产版本
npm run build

# 预览生产版本
npm run preview

# 代码检查
npm run lint
```

---

## 🔍 检查服务是否运行

### 检查后端是否运行

在 PowerShell 中运行：
```powershell
# 使用 Invoke-WebRequest 测试
Invoke-WebRequest -Uri "http://localhost:3000/health" -Method GET

# 或使用 Invoke-RestMethod
Invoke-RestMethod -Uri "http://localhost:3000/health"
```

**正常响应：**
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T12:00:00.000Z"
}
```

### 检查前端是否运行

在浏览器中访问：`http://localhost:5173`

---

## 🛑 停止服务

### 方法一：在运行服务的窗口中按 `Ctrl + C`

### 方法二：使用 PowerShell 命令

```powershell
# 查找并停止 Node.js 进程
Get-Process -Name node | Stop-Process

# 或更精确地停止特定端口的进程
# 停止后端（端口 3000）
$backend = Get-NetTCPConnection -LocalPort 3000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($backend) { Stop-Process -Id $backend -Force }

# 停止前端（端口 5173）
$frontend = Get-NetTCPConnection -LocalPort 5173 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess
if ($frontend) { Stop-Process -Id $frontend -Force }
```

---

## ⚠️ 常见问题

### Q: 端口已被占用怎么办？

**A:** 检查并停止占用端口的进程：

```powershell
# 检查端口 3000（后端）
Get-NetTCPConnection -LocalPort 3000

# 检查端口 5173（前端）
Get-NetTCPConnection -LocalPort 5173

# 停止占用端口的进程
Stop-Process -Id <进程ID> -Force
```

### Q: npm run dev 提示找不到命令？

**A:** 确保已安装依赖：
```powershell
cd backend
npm install

cd ..\frontend
npm install
```

### Q: 后端启动失败？

**A:** 检查：
1. 数据库是否运行（PostgreSQL/Redis）
2. `.env` 文件是否配置正确
3. Prisma Client 是否已生成：`npm run prisma:generate`

### Q: 前端无法连接后端？

**A:** 检查：
1. 后端是否正在运行（访问 `http://localhost:3000/health`）
2. 前端 `.env` 文件中的 `VITE_API_URL` 是否正确
3. 后端的 `CORS_ORIGIN` 是否包含前端地址

---

## 📝 开发流程建议

1. **启动顺序：**
   - 先启动数据库服务（PostgreSQL、Redis）
   - 再启动后端服务
   - 最后启动前端服务

2. **开发时：**
   - 后端修改会自动热重载（tsx watch）
   - 前端修改会自动刷新（Vite HMR）

3. **提交代码前：**
   - 确保两个服务都正常启动
   - 运行前端代码检查：`npm run lint`
   - 测试主要功能是否正常

---

**💡 提示：** 推荐使用方法一（两个窗口分别启动），这样可以看到两个服务的实时日志输出。

