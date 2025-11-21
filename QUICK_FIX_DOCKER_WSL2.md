# 🚀 Docker WSL2 错误快速修复指南

## ⚡ 快速修复（5分钟）

### 最简单的方法

1. **以管理员身份打开PowerShell**
   - 右键点击"开始"按钮
   - 选择"Windows PowerShell (管理员)"

2. **运行修复命令**
   ```powershell
   # 启用WSL功能
   dism.exe /online /enable-feature /featurename:Microsoft-Windows-Subsystem-Linux /all /norestart
   dism.exe /online /enable-feature /featurename:VirtualMachinePlatform /all /norestart
   
   # 启动WSL服务
   Start-Service LxssManager
   Set-Service LxssManager -StartupType Automatic
   
   # 设置WSL版本为2
   wsl --set-default-version 2
   ```

3. **重启计算机**

4. **重启后，以管理员身份启动Docker Desktop**

---

## 📋 或者使用自动化脚本

### Windows PowerShell脚本

```powershell
# 1. 以管理员身份打开PowerShell
# 2. 进入项目目录
cd C:\Users\zhang\Documents\Cursor\test

# 3. 运行修复脚本
powershell -ExecutionPolicy Bypass -File fix-docker-wsl2.ps1
```

---

## ✅ 验证修复

重启后，运行以下命令验证：

```powershell
# 检查WSL状态
wsl --status

# 检查Docker
docker --version

# 测试Docker
docker run hello-world
```

---

## 📚 详细说明

查看完整修复指南：[DOCKER_WSL2_FIX.md](./DOCKER_WSL2_FIX.md)

---

**修复完成后，Docker Desktop应该可以正常工作了！** 🎉

