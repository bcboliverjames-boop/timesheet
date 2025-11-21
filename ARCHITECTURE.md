# SAAS WMS 系统架构文档

## 系统架构概述

本项目采用前后端分离的架构，支持多租户（Multi-Tenant）SAAS模式。

## 技术栈

### 后端
- **运行时**: Node.js 18+
- **框架**: Express.js
- **语言**: TypeScript
- **数据库**: PostgreSQL 14+
- **ORM**: Prisma
- **认证**: JWT
- **日志**: Winston

### 前端
- **框架**: React 18 + TypeScript
- **构建工具**: Vite
- **UI组件库**: Ant Design
- **状态管理**: Zustand
- **路由**: React Router
- **HTTP客户端**: Axios

## 多租户架构

### 数据隔离策略

采用 **共享数据库 + 共享Schema + 租户标识** 的方式：

- 所有表都包含 `tenantId` 字段
- 通过中间件在应用层实现数据隔离
- 优势：成本低、维护简单、适合中小型SAAS

### 实现方式

1. **中间件层隔离**
   - `tenantMiddleware`: 从请求头提取租户ID
   - 所有查询自动添加 `tenantId` 过滤条件

2. **JWT Token包含租户信息**
   - Token payload中包含 `tenantId`
   - 确保用户只能访问所属租户的数据

3. **数据库约束**
   - 通过Prisma schema定义唯一索引确保数据隔离
   - 例如：`@@unique([tenantId, sku])`

## 核心模块设计

### 1. 认证授权模块

- **注册流程**: 创建租户 + 创建第一个管理员用户
- **登录流程**: 验证用户 + 生成JWT Token
- **Token管理**: JWT包含用户信息和租户信息
- **权限控制**: 基于角色的访问控制（RBAC）

### 2. 仓库管理模块

- 仓库信息管理
- 库位管理（支持区域、通道、货架、位置层级）
- 库位状态管理

### 3. 商品管理模块

- 商品基础信息
- SKU管理
- 条码管理
- 商品分类

### 4. 库存管理模块

- 实时库存查询
- 库存调整
- 库存预警（基于最小库存）
- 多仓库库存统计

### 5. 入库管理模块

**流程**:
1. 创建入库单（待审核）
2. 审核入库单
3. 执行入库（更新库存）
4. 完成入库单

**类型**:
- 采购入库
- 退货入库
- 调拨入库
- 其他入库

### 6. 出库管理模块

**流程**:
1. 创建出库单（待审核，预留库存）
2. 审核出库单
3. 执行出库（扣减库存）
4. 完成出库单

**类型**:
- 销售出库
- 调拨出库
- 退货出库
- 报损出库
- 其他出库

## 数据库设计

### 核心实体关系

```
Tenant (租户)
  ├── User (用户)
  ├── Warehouse (仓库)
  │   └── Location (库位)
  ├── Product (商品)
  ├── Supplier (供应商)
  └── Customer (客户)

Inventory (库存)
  ├── Warehouse (仓库)
  ├── Location (库位) [可选]
  └── Product (商品)

InboundOrder (入库单)
  ├── Warehouse (仓库)
  ├── Supplier (供应商) [可选]
  ├── User (创建人)
  └── InboundItem (入库明细)
      ├── Product (商品)
      └── Location (库位) [可选]

OutboundOrder (出库单)
  ├── Warehouse (仓库)
  ├── Customer (客户) [可选]
  ├── User (创建人)
  └── OutboundItem (出库明细)
      ├── Product (商品)
      └── Location (库位) [可选]
```

## API设计规范

### RESTful API

- GET `/api/resource` - 列表查询（支持分页、过滤、排序）
- GET `/api/resource/:id` - 详情查询
- POST `/api/resource` - 创建
- PUT `/api/resource/:id` - 更新
- DELETE `/api/resource/:id` - 删除

### 请求头

```
Authorization: Bearer <token>
X-Tenant-Id: <tenant-id>
Content-Type: application/json
```

### 响应格式

**成功响应**:
```json
{
  "data": {...},
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

**错误响应**:
```json
{
  "error": "Error message",
  "details": [...]
}
```

## 安全考虑

1. **数据隔离**: 所有查询必须包含租户过滤
2. **SQL注入**: 使用Prisma ORM参数化查询
3. **XSS防护**: 前端输入验证和转义
4. **CSRF防护**: JWT Token验证
5. **密码安全**: bcrypt加密存储
6. **API限流**: express-rate-limit中间件
7. **HTTPS**: 生产环境强制HTTPS

## 性能优化

1. **数据库索引**: 在常用查询字段建立索引
2. **缓存**: Redis缓存热点数据（可选）
3. **分页**: 所有列表接口支持分页
4. **懒加载**: 前端按需加载资源
5. **CDN**: 静态资源使用CDN加速

## 部署架构

### 开发环境
```
Frontend (Vite Dev Server:5173)
    ↓
Backend (Express:3000)
    ↓
PostgreSQL (Docker:5432)
```

### 生产环境
```
Nginx (反向代理)
    ├── Frontend (静态文件)
    └── Backend API (Node.js)
         └── PostgreSQL
```

## 扩展性考虑

1. **水平扩展**: 后端无状态设计，支持多实例部署
2. **数据库扩展**: 支持读写分离、分库分表
3. **缓存层**: Redis缓存提升性能
4. **消息队列**: 异步处理耗时任务（可选）
5. **文件存储**: 支持OSS/S3存储商品图片等文件

## 开发规范

### 代码规范
- TypeScript严格模式
- ESLint代码检查
- Prettier代码格式化

### Git工作流
- 主分支: `main`
- 开发分支: `develop`
- 功能分支: `feature/*`
- 修复分支: `fix/*`

### 提交规范
```
feat: 新功能
fix: 修复bug
docs: 文档更新
style: 代码格式调整
refactor: 代码重构
test: 测试相关
chore: 构建/工具相关
```

