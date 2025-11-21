# 🔧 依赖安装说明（方案一）

## ⚡ 快速开始

**最简单的方式**：打开终端，进入backend目录，运行：

```bash
cd backend
npm install
```

就这么简单！安装完成后，所有55个类型错误将自动消失。

---

## 📖 详细说明

### 为什么需要安装依赖？

当前代码中有55个TypeScript类型错误，其中：
- **15个**：模块找不到错误（express, zod等）
- **38个**：TenantRequest属性错误（因为express类型无法解析）
- **2个**：process未定义错误

**根本原因**：`node_modules`目录不存在，依赖包未安装。

**解决方案**：运行 `npm install` 安装所有依赖包。

### 安装后会修复什么？

✅ 所有模块找不到错误（15个）  
✅ 所有TenantRequest属性错误（38个）  
✅ process未定义错误（2个）  
✅ **总计：从55个错误 → 0个错误** 🎉

---

## 🚀 三种安装方式

### 方式1：手动安装（推荐）

```bash
# 1. 进入backend目录
cd backend

# 2. 安装依赖
npm install

# 3. 验证安装
npx tsc --noEmit
```

### 方式2：使用安装脚本（Windows）

```powershell
cd backend
powershell -ExecutionPolicy Bypass -File INSTALL_SCRIPT.ps1
```

### 方式3：使用安装脚本（Linux/Mac）

```bash
cd backend
chmod +x INSTALL_SCRIPT.sh
./INSTALL_SCRIPT.sh
```

---

## ✅ 安装验证清单

安装完成后，请确认：

- [ ] `node_modules`目录存在
- [ ] `npx tsc --noEmit`返回0错误
- [ ] VS Code/Cursor中不再显示红色错误提示

---

## 📚 相关文档

- [INSTALL_GUIDE.md](./INSTALL_GUIDE.md) - 详细的安装指南和故障排查
- [FIX_COMPLETED.md](../FIX_COMPLETED.md) - 代码修复完成报告

---

## 💡 提示

如果npm命令不可用，请先安装Node.js：
1. 访问 https://nodejs.org/
2. 下载LTS版本并安装
3. 重启终端后运行 `npm install`

---

**安装完成后，即可开始开发！** 🚀

