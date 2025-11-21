# Git 安装指南

## 方法一：从官网下载安装（推荐）

### 步骤 1：下载 Git
访问 Git 官网：https://git-scm.com/download/win
或直接下载：https://github.com/git-for-windows/git/releases/latest

### 步骤 2：运行安装程序
1. 双击下载的 `.exe` 文件（例如：`Git-2.xx.x-64-bit.exe`）
2. 按照安装向导的提示进行安装
3. **推荐设置**：
   - **编辑器选择**：可以选择 VS Code、Notepad++ 或其他你熟悉的编辑器
   - **默认分支名**：建议使用 `main`（而不是 `master`）
   - **PATH 环境变量**：选择 "Git from the command line and also from 3rd-party software"（推荐）
   - **行尾转换**：选择 "Checkout as-is, commit Unix-style line endings"（推荐）
   - **终端模拟器**：选择 "Use MinTTY"（推荐）
   - **额外选项**：可以启用 "Enable file system caching" 和 "Enable Git Credential Manager"

### 步骤 3：验证安装
打开 PowerShell 或 CMD，运行：
```powershell
git --version
```
如果显示版本号（例如：`git version 2.xx.x.windows.x`），说明安装成功。

---

## 方法二：使用 Winget（Windows 10/11 内置）

打开 PowerShell（以管理员身份运行），执行：
```powershell
winget install --id Git.Git -e --source winget
```

---

## 方法三：使用 Chocolatey（如果已安装）

打开 PowerShell（以管理员身份运行），执行：
```powershell
choco install git
```

---

## 安装后的首次配置

安装完成后，建议配置你的用户信息：

```powershell
# 配置用户名
git config --global user.name "你的名字"

# 配置邮箱
git config --global user.email "your.email@example.com"

# 验证配置
git config --list
```

---

## 在你的 WMS 项目中使用 Git

安装完成后，可以初始化 Git 仓库并保存代码：

```powershell
# 进入项目目录
cd C:\Users\zhang\Documents\Cursor\test

# 初始化 Git 仓库
git init

# 添加所有文件到暂存区
git add .

# 创建第一次提交
git commit -m "Initial commit: WMS SAAS project"

# 查看状态
git status

# 查看提交历史
git log
```

---

## 常见问题

### Q: 安装后 PowerShell 仍提示找不到 git？
**A:** 
1. 重启 PowerShell 或重新打开终端窗口
2. 如果还是不行，检查环境变量：在 PowerShell 中运行 `$env:PATH` 查看是否包含 Git 安装路径（通常在 `C:\Program Files\Git\cmd`）

### Q: 如何更新 Git？
**A:** 下载最新版本的安装程序重新安装即可，新版本会自动替换旧版本。

### Q: Git 占用空间大吗？
**A:** 安装程序大约 200-300 MB，安装后占用约 500 MB 左右空间。

---

## 推荐阅读

- Git 官方文档：https://git-scm.com/doc
- GitHub 入门指南：https://guides.github.com/

