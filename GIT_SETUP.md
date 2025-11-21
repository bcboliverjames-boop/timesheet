# Git 配置和初始化指南

## ✅ Git 已成功安装！

**安装版本：** Git 2.52.0

---

## 📋 后续步骤

### 1. **重新启动 PowerShell**
Git 已安装，但需要重新打开 PowerShell 窗口才能使用。
- 关闭当前的 PowerShell 窗口
- 打开新的 PowerShell 窗口

### 2. **验证安装**
在新的 PowerShell 窗口中运行：
```powershell
git --version
```
应该显示：`git version 2.52.0.windows.1`

### 3. **配置 Git 用户信息**
首次使用 Git 需要配置你的用户名和邮箱：

```powershell
# 配置用户名（替换为你的名字）
git config --global user.name "你的名字"

# 配置邮箱（替换为你的邮箱）
git config --global user.email "your.email@example.com"

# 查看配置
git config --list
```

**示例：**
```powershell
git config --global user.name "Zhang"
git config --global user.email "zhang@example.com"
```

### 4. **初始化 WMS 项目仓库**
在你的项目目录中初始化 Git 仓库：

```powershell
# 进入项目目录
cd C:\Users\zhang\Documents\Cursor\test

# 初始化 Git 仓库
git init

# 查看状态
git status
```

### 5. **创建 .gitignore 文件**
为了避免将敏感文件和临时文件提交到仓库，建议创建 `.gitignore`：

```powershell
# 在项目根目录创建 .gitignore 文件
```

`.gitignore` 应该包含：
```
# 依赖
node_modules/
dist/
build/

# 环境变量
.env
.env.local
.env.*.local

# 日志
logs/
*.log

# IDE
.vscode/
.idea/
*.swp
*.swo

# 操作系统
.DS_Store
Thumbs.db

# Prisma
*.db
*.db-journal

# 临时文件
*.tmp
.cache/
```

### 6. **首次提交代码**
```powershell
# 添加所有文件到暂存区
git add .

# 创建第一次提交
git commit -m "Initial commit: WMS SAAS project with multi-tenant architecture"

# 查看提交历史
git log
```

---

## 🎯 常用 Git 命令

### 日常使用
```powershell
# 查看状态
git status

# 添加文件
git add <文件名>
git add .                    # 添加所有文件

# 提交更改
git commit -m "提交信息"

# 查看提交历史
git log
git log --oneline            # 简洁版

# 查看差异
git diff                     # 查看未暂存的更改
git diff --staged            # 查看已暂存的更改
```

### 分支管理
```powershell
# 创建新分支
git branch <分支名>

# 切换分支
git checkout <分支名>

# 创建并切换分支
git checkout -b <分支名>

# 查看所有分支
git branch

# 合并分支
git merge <分支名>
```

### 远程仓库（可选）
```powershell
# 添加远程仓库（GitHub/GitLab等）
git remote add origin <远程仓库URL>

# 推送代码
git push -u origin main

# 拉取代码
git pull origin main
```

---

## 💡 提示

1. **每次开发新功能前**：
   ```powershell
   git status    # 查看当前状态
   git add .     # 添加更改
   git commit -m "描述你的更改"
   ```

2. **定期提交**：建议每完成一个功能或修复就提交一次，这样有清晰的提交历史。

3. **提交信息要清晰**：使用有意义的提交信息，例如：
   - "添加仓库管理功能"
   - "修复 429 速率限制问题"
   - "更新前端入库界面"

---

## 🔗 相关文档

- 已创建的安装指南：`INSTALL_GIT.md`
- 项目进度文档：`PROJECT_PROGRESS.md`

---

**下一步：重新启动 PowerShell，然后按照步骤 3 和 4 配置 Git 并初始化仓库！**

