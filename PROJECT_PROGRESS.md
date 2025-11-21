## 项目进展快照（更新：2025-11-21）

### 概览
- 项目：SaaS 多租户 WMS（Node.js/Express/Prisma + React/Vite/Ant Design/Zustand）。
- 当前状态：后端和前端均可启动；已实现租户注册、认证、仓库/商品/仓位/库存/入库/出库全流程与库存调整功能；前端 UI 与 API 已联通。
- 近期修复：Prisma 关系缺失、JWT 类型错误、WSL2/Docker 环境指引、PowerShell 执行策略、429 速率限制调整、前端 429 友好提示。

### 后端状态
- 核心模块：`auth`, `tenant`, `warehouse`, `product`, `inventory`, `inbound`, `outbound` 路由均可用。
- 多租户：`tenantMiddleware` 与 `authMiddleware` 已接入各业务路由。
- 错误处理：集中式 `errorHandler` + `utils/errorHandler.ts`；日志写入 `logs/combined.log` 与 `error.log`。
- 环境变量：需要 `.env`（包含 `DATABASE_URL`, `JWT_SECRET`, `PORT`, `CORS_ORIGIN`, `RATE_LIMIT_*` 等）。429 修复后需重启 `npm run dev`。
- 数据库：Prisma schema 已包含仓位与入出库关联；`prisma migrate dev` 可同步结构。

### 前端状态
- 技术栈：React + Vite + AntD + Zustand；`vite-env.d.ts` 解决 `import.meta.env` 类型。
- 页面：仪表盘、仓库、商品、仓位、库存、入库、出库全部具备列表、创建、编辑、删除/审核/完成等操作；库存支持调整界面。
- API：`src/services/api.ts` 统一拦截器处理 401/429；与后端路由对齐。
- 路由/布局：`Layout.tsx` 提供侧边导航，`App.tsx` 注册所有页面。

### 环境 & 依赖
- Node.js 已安装在 Windows；如需 Docker，须先修复 WSL2（可参考 `DOCKER_WSL2_FIX.md`, `fix-docker-wsl2.ps1`）。
- 依赖安装脚本：`backend/INSTALL_SCRIPT.ps1/.sh` 与文档 `INSTALL_GUIDE.md` 等。
- PowerShell 若遇到执行策略问题，使用 `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`。

### 数据保存建议
1. **Git**（推荐）：安装 Git 后运行 `git init`、`git add .`、`git commit -m "snapshot"` 并推送到远端仓库（GitHub/GitLab）。
2. **压缩备份**：将 `C:\Users\zhang\Documents\Cursor\test` 整体压缩，保存到外部磁盘或云盘。
3. **数据库**：使用 `npx prisma migrate deploy` + `pg_dump`（若使用 PostgreSQL）或导出本地数据库文件。
4. **环境变量**：手工备份 `.env`（目前因安全规则无法自动读取，请手动复制内容）。

### 重启后的继续步骤
1. 安装/启动依赖：PostgreSQL、Redis（如有）、Node.js；必要时运行 `npm install`（前后端分别）。
2. 数据库迁移：`cd backend && npx prisma migrate dev`（或 `deploy`）。
3. 启动服务：
   - `cd backend && npm run dev`
   - `cd frontend && npm run dev`
4. 创建首个租户/管理员：使用 `Invoke-RestMethod` 或 Postman 调用 `POST /api/auth/register`，确保 `subdomain/email` 唯一。
5. 访问前端 `http://localhost:5173`，登录并继续配置仓库、商品、仓位等。

### 待办/潜在下一步
- 引入自动化测试（Jest/Supertest）覆盖关键 API。
- 完善审计日志、操作历史。
- 增强多租户隔离（自定义域、资源配额等）。
- 部署计划（Docker Compose/K8s）与 CI/CD。

> 如需进一步协助（例如打包、部署、编写操作手册等），可直接说明具体需求。

