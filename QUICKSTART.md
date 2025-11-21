# 快速开始指南

本指南将帮助您快速搭建和运行SAAS WMS系统。

## 前置要求

- Node.js 18+
- PostgreSQL 14+ (或使用Docker)
- npm 或 yarn

## 步骤 1: 启动数据库

### 方式一：使用Docker（推荐）

```bash
# 启动PostgreSQL和Redis
docker-compose up -d

# 查看容器状态
docker-compose ps
```

### 方式二：本地PostgreSQL

确保PostgreSQL服务已启动，并创建数据库：
```sql
CREATE DATABASE wms_db;
CREATE USER wms_user WITH PASSWORD 'wms_password';
GRANT ALL PRIVILEGES ON DATABASE wms_db TO wms_user;
```

## 步骤 2: 配置后端

```bash
cd backend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件，配置数据库连接等信息
# DATABASE_URL="postgresql://wms_user:wms_password@localhost:5432/wms_db?schema=public"
# JWT_SECRET="your-super-secret-jwt-key"
```

## 步骤 3: 初始化数据库

```bash
cd backend

# 生成Prisma Client
npx prisma generate

# 运行数据库迁移
npx prisma migrate dev --name init

# （可选）查看数据库数据
npx prisma studio
```

## 步骤 4: 启动后端服务

```bash
cd backend

# 开发模式启动
npm run dev

# 服务将在 http://localhost:3000 启动
```

验证后端是否正常：
```bash
curl http://localhost:3000/health
```

## 步骤 5: 配置前端

```bash
cd frontend

# 安装依赖
npm install

# 复制环境变量文件
cp .env.example .env

# 编辑 .env 文件（通常使用默认值即可）
# VITE_API_BASE_URL=http://localhost:3000/api
```

## 步骤 6: 启动前端服务

```bash
cd frontend

# 开发模式启动
npm run dev

# 服务将在 http://localhost:5173 启动
```

## 步骤 7: 创建第一个租户和用户

### 方式一：通过API注册

```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "tenantName": "测试公司",
    "subdomain": "test",
    "email": "admin@test.com",
    "password": "123456",
    "name": "管理员"
  }'
```

### 方式二：通过Prisma Studio创建

```bash
cd backend
npx prisma studio
```

在Prisma Studio中：
1. 创建Tenant记录
2. 创建User记录（密码需要用bcrypt加密）

## 步骤 8: 登录系统

1. 打开浏览器访问 http://localhost:5173
2. 使用注册的邮箱和密码登录
3. 开始使用WMS系统！

## 常用命令

### 后端

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm start

# 数据库迁移
npx prisma migrate dev

# 查看数据库
npx prisma studio

# 重置数据库（注意：会删除所有数据）
npx prisma migrate reset
```

### 前端

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 预览构建结果
npm run preview
```

## 故障排查

### 1. 数据库连接失败

- 检查PostgreSQL服务是否运行
- 检查 `.env` 文件中的 `DATABASE_URL` 配置
- 检查防火墙设置

### 2. 端口被占用

- 后端默认端口: 3000
- 前端默认端口: 5173
- 可以在配置文件中修改端口

### 3. Prisma Client生成失败

```bash
# 删除 node_modules 和 .prisma 目录，重新安装
rm -rf node_modules .prisma
npm install
npx prisma generate
```

### 4. 前端无法连接后端

- 检查后端服务是否运行
- 检查 `frontend/.env` 中的 `VITE_API_BASE_URL` 配置
- 检查CORS配置（`backend/src/index.ts`）

## 下一步

- 查看 [README.md](./README.md) 了解项目详细说明
- 查看 [ARCHITECTURE.md](./ARCHITECTURE.md) 了解系统架构
- 开始开发您的业务功能！

## 开发建议

1. **代码规范**: 使用ESLint和Prettier保持代码风格一致
2. **Git工作流**: 遵循规范的提交信息格式
3. **测试**: 编写单元测试和集成测试
4. **文档**: 及时更新API文档和代码注释

