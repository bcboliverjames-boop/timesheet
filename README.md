# SAAS WMS (Warehouse Management System) 仓库管理系统

## 项目概述

一个面向中小企业的云端仓库管理系统（SAAS），支持多租户架构，提供完整的仓储管理解决方案。

## 核心功能模块

### 1. 多租户管理（Tenant Management）
- 租户注册与订阅管理
- 租户数据隔离
- 租户配置与个性化设置

### 2. 用户权限管理（User & Role Management）
- 用户认证与授权（JWT）
- 角色管理（RBAC）
- 权限细粒度控制

### 3. 仓库管理（Warehouse Management）
- 仓库信息管理
- 库位管理
- 区域划分

### 4. 库存管理（Inventory Management）
- 商品/物料管理
- 库存查询与盘点
- 库存预警
- 批次管理（可选）

### 5. 入库管理（Inbound Management）
- 采购入库
- 退货入库
- 其他入库
- 入库单审核流程

### 6. 出库管理（Outbound Management）
- 销售出库
- 调拨出库
- 其他出库
- 出库单审核流程

### 7. 订单管理（Order Management）
- 采购订单
- 销售订单
- 订单跟踪

### 8. 供应商管理（Supplier Management）
- 供应商信息管理
- 供应商评级
- 供应商对账

### 9. 客户管理（Customer Management）
- 客户信息管理
- 客户分级

### 10. 报表分析（Reports & Analytics）
- 库存报表
- 出入库统计
- 销售分析
- 自定义报表

## 技术架构

### 后端技术栈
- **运行环境**: Node.js 18+
- **框架**: Express.js + TypeScript
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma
- **认证**: JWT + bcrypt
- **API文档**: Swagger/OpenAPI
- **日志**: Winston
- **测试**: Jest + Supertest

### 前端技术栈
- **框架**: React 18+ + TypeScript
- **构建工具**: Vite
- **状态管理**: Redux Toolkit / Zustand
- **UI组件库**: Ant Design / Material-UI
- **路由**: React Router
- **HTTP客户端**: Axios
- **表单管理**: React Hook Form

### 基础设施
- **容器化**: Docker + Docker Compose
- **CI/CD**: GitHub Actions / GitLab CI
- **监控**: Prometheus + Grafana（可选）
- **文件存储**: AWS S3 / 阿里云OSS（可选）

## 数据库设计原则

### 多租户架构
- **共享数据库 + 共享Schema + 租户标识**: 所有表包含 `tenantId` 字段
- 数据隔离通过应用层实现（中间件级别）
- 优势：成本低，维护简单，适合中小型SAAS

### 核心表结构
```
- tenants (租户表)
- users (用户表)
- roles (角色表)
- permissions (权限表)
- warehouses (仓库表)
- locations (库位表)
- products (商品表)
- inventory (库存表)
- inbound_orders (入库单表)
- outbound_orders (出库单表)
- purchase_orders (采购订单表)
- sales_orders (销售订单表)
- suppliers (供应商表)
- customers (客户表)
```

## 项目结构

```
wms-saas/
├── backend/                 # 后端服务
│   ├── src/
│   │   ├── config/         # 配置文件
│   │   ├── controllers/    # 控制器
│   │   ├── services/       # 业务逻辑
│   │   ├── models/         # 数据模型
│   │   ├── middleware/     # 中间件
│   │   ├── routes/         # 路由
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript类型定义
│   ├── prisma/             # Prisma配置和迁移
│   └── tests/              # 测试文件
│
├── frontend/               # 前端应用
│   ├── src/
│   │   ├── components/     # 通用组件
│   │   ├── pages/          # 页面组件
│   │   ├── store/          # 状态管理
│   │   ├── services/       # API服务
│   │   ├── hooks/          # 自定义Hooks
│   │   ├── utils/          # 工具函数
│   │   └── types/          # TypeScript类型定义
│   └── public/             # 静态资源
│
├── docker-compose.yml      # Docker编排配置
├── .gitignore
└── README.md
```

## 开发阶段规划

### 第一阶段：基础设施搭建（1-2周）
- [x] 项目结构搭建
- [ ] 数据库设计和Prisma配置
- [ ] 多租户中间件实现
- [ ] 用户认证系统
- [ ] API基础框架

### 第二阶段：核心功能开发（4-6周）
- [ ] 商品管理模块
- [ ] 仓库和库位管理
- [ ] 库存管理基础功能
- [ ] 入库管理
- [ ] 出库管理

### 第三阶段：扩展功能（2-3周）
- [ ] 订单管理
- [ ] 供应商和客户管理
- [ ] 报表分析
- [ ] 库存预警

### 第四阶段：优化与测试（2周）
- [ ] 性能优化
- [ ] 单元测试和集成测试
- [ ] 安全加固
- [ ] 用户体验优化

### 第五阶段：部署与上线（1周）
- [ ] Docker容器化
- [ ] CI/CD配置
- [ ] 生产环境部署
- [ ] 监控和日志系统

## 开发环境要求

- Node.js 18+
- PostgreSQL 14+
- Docker & Docker Compose（推荐）
- Git

## 快速开始

### 1. 克隆项目
```bash
git clone <repository-url>
cd wms-saas
```

### 2. 启动数据库（Docker）
```bash
docker-compose up -d postgres
```

### 3. 后端设置
```bash
cd backend
npm install
cp .env.example .env
# 配置 .env 文件
npx prisma migrate dev
npm run dev
```

### 4. 前端设置
```bash
cd frontend
npm install
cp .env.example .env
# 配置 .env 文件
npm run dev
```

## 安全考虑

1. **数据隔离**: 所有API请求必须包含租户上下文
2. **SQL注入防护**: 使用ORM参数化查询
3. **XSS防护**: 前端输入验证和转义
4. **CSRF防护**: Token验证
5. **密码安全**: bcrypt加密，最小复杂度要求
6. **API限流**: 防止恶意请求
7. **HTTPS**: 生产环境强制HTTPS

## 性能优化策略

1. **数据库索引**: 在常用查询字段建立索引
2. **缓存**: Redis缓存热点数据
3. **分页**: 所有列表接口支持分页
4. **懒加载**: 前端按需加载资源
5. **CDN**: 静态资源使用CDN加速

## 许可证

MIT License

## 贡献指南

欢迎提交Issue和Pull Request！

