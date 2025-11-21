# Docker Desktop WSL2 错误修复脚本
# 使用方法：以管理员身份运行此脚本

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Docker Desktop WSL2 错误修复脚本" -ForegroundColor Cyan
Write-Host "错误代码: Wsl/0x80070422" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# 检查管理员权限
$isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
if (-not $isAdmin) {
    Write-Host "⚠ 警告: 未以管理员身份运行" -ForegroundColor Yellow
    Write-Host "请右键点击PowerShell，选择'以管理员身份运行'" -ForegroundColor Yellow
    Write-Host "按任意键退出..." -ForegroundColor Yellow
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    exit 1
}

Write-Host "✓ 检测到管理员权限" -ForegroundColor Green
Write-Host ""

# 步骤1: 检查WSL服务状态
Write-Host "步骤1: 检查WSL服务状态..." -ForegroundColor Yellow
try {
    $service = Get-Service LxssManager -ErrorAction SilentlyContinue
    if ($service) {
        Write-Host "  服务状态: $($service.Status)" -ForegroundColor Cyan
        Write-Host "  启动类型: $($service.StartType)" -ForegroundColor Cyan
        
        if ($service.Status -ne "Running") {
            Write-Host "  正在启动WSL服务..." -ForegroundColor Yellow
            Start-Service LxssManager
            Write-Host "  ✓ WSL服务已启动" -ForegroundColor Green
        } else {
            Write-Host "  ✓ WSL服务正在运行" -ForegroundColor Green
        }
        
        if ($service.StartType -ne "Automatic") {
            Write-Host "  设置WSL服务为自动启动..." -ForegroundColor Yellow
            Set-Service LxssManager -StartupType Automatic
            Write-Host "  ✓ WSL服务已设置为自动启动" -ForegroundColor Green
        }
    } else {
        Write-Host "  ⚠ WSL服务未找到，可能需要启用WSL功能" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ 检查WSL服务时出错: $_" -ForegroundColor Red
}
Write-Host ""

# 步骤2: 启用WSL功能
Write-Host "步骤2: 启用WSL功能..." -ForegroundColor Yellow
Write-Host "  这可能需要几分钟时间..." -ForegroundColor Cyan

try {
    # 启用Windows Subsystem for Linux
    Write-Host "  正在启用 Windows Subsystem for Linux..." -ForegroundColor Yellow
    $result1 = dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ Windows Subsystem for Linux 已启用" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ Windows Subsystem for Linux 可能已经启用或需要重启" -ForegroundColor Yellow
    }
    
    # 启用虚拟机平台
    Write-Host "  正在启用 虚拟机平台..." -ForegroundColor Yellow
    $result2 = dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart 2>&1
    
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ 虚拟机平台 已启用" -ForegroundColor Green
    } else {
        Write-Host "  ⚠ 虚拟机平台 可能已经启用或需要重启" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ✗ 启用功能时出错: $_" -ForegroundColor Red
}
Write-Host ""

# 步骤3: 检查WSL版本
Write-Host "步骤3: 检查WSL版本..." -ForegroundColor Yellow
try {
    $wslVersion = wsl --version 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  ✓ WSL已安装" -ForegroundColor Green
        $wslVersion | ForEach-Object { Write-Host "    $_" -ForegroundColor Cyan }
        
        # 设置默认版本为WSL2
        Write-Host "  设置WSL默认版本为2..." -ForegroundColor Yellow
        wsl --set-default-version 2 2>&1 | Out-Null
        
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ WSL默认版本已设置为2" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ 可能需要更新WSL内核" -ForegroundColor Yellow
        }
    } else {
        Write-Host "  ⚠ WSL命令不可用" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ 无法检查WSL版本: $_" -ForegroundColor Yellow
}
Write-Host ""

# 步骤4: 更新WSL内核（可选）
Write-Host "步骤4: 检查是否需要更新WSL内核..." -ForegroundColor Yellow
Write-Host "  是否要更新WSL内核？(Y/N)" -ForegroundColor Cyan
$updateWSL = Read-Host
if ($updateWSL -eq "Y" -or $updateWSL -eq "y") {
    try {
        Write-Host "  正在更新WSL内核..." -ForegroundColor Yellow
        wsl --update 2>&1 | Out-Null
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ WSL内核已更新" -ForegroundColor Green
        } else {
            Write-Host "  ⚠ 更新WSL内核时出现问题" -ForegroundColor Yellow
        }
    } catch {
        Write-Host "  ✗ 更新WSL内核时出错: $_" -ForegroundColor Red
    }
}
Write-Host ""

# 步骤5: 检查WSL发行版
Write-Host "步骤5: 检查WSL发行版..." -ForegroundColor Yellow
try {
    $distros = wsl --list --verbose 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "  已安装的WSL发行版:" -ForegroundColor Cyan
        $distros | ForEach-Object { Write-Host "    $_" -ForegroundColor Cyan }
    } else {
        Write-Host "  ⚠ 无法列出WSL发行版" -ForegroundColor Yellow
    }
} catch {
    Write-Host "  ⚠ 检查WSL发行版时出错: $_" -ForegroundColor Yellow
}
Write-Host ""

# 步骤6: 检查Docker相关服务
Write-Host "步骤6: 检查Docker相关服务..." -ForegroundColor Yellow
$dockerServices = @("com.docker.service", "docker")
$foundServices = $false

foreach ($serviceName in $dockerServices) {
    try {
        $service = Get-Service -Name $serviceName -ErrorAction SilentlyContinue
        if ($service) {
            $foundServices = $true
            Write-Host "  $($service.Name): $($service.Status)" -ForegroundColor Cyan
        }
    } catch {
        # 忽略未找到的服务
    }
}

if (-not $foundServices) {
    Write-Host "  ℹ 未找到Docker服务（Docker Desktop可能未运行）" -ForegroundColor Cyan
}
Write-Host ""

# 完成提示
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "修复步骤完成！" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "下一步操作:" -ForegroundColor Yellow
Write-Host "1. 如果修改了Windows功能，请重启计算机" -ForegroundColor Cyan
Write-Host "2. 重启后，以管理员身份启动Docker Desktop" -ForegroundColor Cyan
Write-Host "3. 等待Docker Desktop完成WSL发行版部署" -ForegroundColor Cyan
Write-Host "4. 验证修复:" -ForegroundColor Cyan
Write-Host "   docker --version" -ForegroundColor White
Write-Host "   wsl --status" -ForegroundColor White
Write-Host ""

Write-Host "是否现在重启计算机？(Y/N)" -ForegroundColor Yellow
$restart = Read-Host
if ($restart -eq "Y" -or $restart -eq "y") {
    Write-Host "正在重启计算机..." -ForegroundColor Yellow
    Restart-Computer -Confirm
} else {
    Write-Host "请手动重启计算机以应用更改" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "按任意键退出..." -ForegroundColor Cyan
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")

