# WMS Backend 依赖安装脚本 (PowerShell)
# 使用方法：在backend目录下运行此脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "WMS Backend 依赖安装脚本" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 步骤1: 检查Node.js
Write-Host "步骤1: 检查Node.js安装..." -ForegroundColor Yellow
try {
    $nodeVersion = node --version
    $npmVersion = npm --version
    Write-Host "✓ Node.js版本: $nodeVersion" -ForegroundColor Green
    Write-Host "✓ npm版本: $npmVersion" -ForegroundColor Green
} catch {
    Write-Host "✗ Node.js未安装或不在PATH中" -ForegroundColor Red
    Write-Host "  请访问 https://nodejs.org/ 下载安装Node.js" -ForegroundColor Yellow
    Write-Host "  安装后请重启终端" -ForegroundColor Yellow
    exit 1
}
Write-Host ""

# 步骤2: 检查当前目录
Write-Host "步骤2: 检查当前目录..." -ForegroundColor Yellow
$currentDir = Get-Location
Write-Host "当前目录: $currentDir" -ForegroundColor Cyan

if (-not (Test-Path "package.json")) {
    Write-Host "✗ 未找到package.json文件" -ForegroundColor Red
    Write-Host "  请确保在backend目录下运行此脚本" -ForegroundColor Yellow
    exit 1
}
Write-Host "✓ 找到package.json" -ForegroundColor Green
Write-Host ""

# 步骤3: 检查是否已安装依赖
Write-Host "步骤3: 检查依赖安装状态..." -ForegroundColor Yellow
if (Test-Path "node_modules") {
    Write-Host "✓ node_modules目录已存在" -ForegroundColor Green
    Write-Host "  是否要重新安装？(Y/N)" -ForegroundColor Yellow
    $response = Read-Host
    if ($response -ne "Y" -and $response -ne "y") {
        Write-Host "跳过安装" -ForegroundColor Yellow
        exit 0
    }
    Write-Host "删除现有node_modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules -ErrorAction SilentlyContinue
} else {
    Write-Host "node_modules目录不存在，需要安装依赖" -ForegroundColor Yellow
}
Write-Host ""

# 步骤4: 安装依赖
Write-Host "步骤4: 安装依赖包..." -ForegroundColor Yellow
Write-Host "这可能需要几分钟时间，请耐心等待..." -ForegroundColor Cyan
Write-Host ""

try {
    npm install
    if ($LASTEXITCODE -eq 0) {
        Write-Host ""
        Write-Host "✓ 依赖安装成功！" -ForegroundColor Green
    } else {
        Write-Host ""
        Write-Host "✗ 依赖安装失败" -ForegroundColor Red
        Write-Host "  请检查错误信息并参考 INSTALL_GUIDE.md" -ForegroundColor Yellow
        exit 1
    }
} catch {
    Write-Host ""
    Write-Host "✗ 安装过程出错: $_" -ForegroundColor Red
    exit 1
}
Write-Host ""

# 步骤5: 验证安装
Write-Host "步骤5: 验证依赖安装..." -ForegroundColor Yellow
$requiredModules = @("express", "@types/express", "@types/node", "zod")
$allInstalled = $true

foreach ($module in $requiredModules) {
    if (Test-Path "node_modules\$module") {
        Write-Host "✓ $module 已安装" -ForegroundColor Green
    } else {
        Write-Host "✗ $module 未找到" -ForegroundColor Red
        $allInstalled = $false
    }
}

if (-not $allInstalled) {
    Write-Host ""
    Write-Host "警告: 某些依赖未正确安装" -ForegroundColor Yellow
    Write-Host "请重新运行: npm install" -ForegroundColor Yellow
}
Write-Host ""

# 步骤6: 类型检查
Write-Host "步骤6: 运行TypeScript类型检查..." -ForegroundColor Yellow
try {
    npx tsc --noEmit 2>&1 | Out-Null
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ 类型检查通过！没有错误" -ForegroundColor Green
    } else {
        Write-Host "⚠ 类型检查发现错误，运行详细信息:" -ForegroundColor Yellow
        npx tsc --noEmit
    }
} catch {
    Write-Host "⚠ 无法运行类型检查: $_" -ForegroundColor Yellow
}
Write-Host ""

# 完成
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "安装脚本执行完成！" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "下一步:" -ForegroundColor Yellow
Write-Host "1. 运行: npx prisma generate" -ForegroundColor Cyan
Write-Host "2. 运行: npx prisma migrate dev" -ForegroundColor Cyan
Write-Host "3. 运行: npm run dev" -ForegroundColor Cyan
Write-Host ""

