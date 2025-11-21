# 安装依赖说明

## 问题说明

当前代码中有56个类型错误，其中大部分是因为依赖包未安装导致的。

## 错误分类

1. **模块找不到错误**（约15个）
   - express, zod, fs, path, cors, helmet等
   - **原因**: `node_modules`目录不存在，依赖包未安装

2. **TenantRequest属性错误**（约38个）
   - query、body、params属性无法识别
   - **原因**: express模块未安装，Request类型无法解析，导致TenantRequest继承的属性无法识别

3. **隐式any类型**（1个）- ✅ **已修复**
   - productController.ts:111的data参数
   - **已修复**: 添加了类型注解 `data: z.infer<typeof productSchema>`

4. **process未定义**（2个）
   - **原因**: @types/node未安装

## 安装步骤

### 方式一：使用npm（推荐）

```bash
# 1. 进入backend目录
cd backend

# 2. 安装所有依赖
npm install

# 3. 验证安装
npm list --depth=0
```

### 方式二：使用yarn

```bash
# 1. 进入backend目录
cd backend

# 2. 安装所有依赖
yarn install

# 3. 验证安装
yarn list --depth=0
```

### 方式三：使用pnpm

```bash
# 1. 进入backend目录
cd backend

# 2. 安装所有依赖
pnpm install

# 3. 验证安装
pnpm list --depth=0
```

## 安装后验证

安装依赖后，运行以下命令检查类型错误：

```bash
# 在backend目录下
npx tsc --noEmit
```

**预期结果**：
- 错误数量从56个减少到0个
- 所有模块找不到的错误会消失
- TenantRequest属性错误会消失

## 如果npm命令不可用

如果遇到 `npm: 无法识别为命令` 的错误，请：

1. **检查Node.js是否安装**
   ```bash
   node --version
   npm --version
   ```

2. **如果未安装Node.js**
   - 访问 https://nodejs.org/
   - 下载并安装LTS版本（推荐18.x或更高）
   - 安装后重启终端

3. **如果已安装但命令不可用**
   - 检查PATH环境变量是否包含Node.js安装目录
   - 通常路径：`C:\Program Files\nodejs\`
   - 将路径添加到系统PATH环境变量中

## 依赖包说明

安装的依赖包包括：

### 运行时依赖
- `express` - Web框架
- `@prisma/client` - Prisma ORM客户端
- `cors` - CORS中间件
- `helmet` - 安全中间件
- `dotenv` - 环境变量管理
- `jsonwebtoken` - JWT认证
- `bcryptjs` - 密码加密
- `zod` - 数据验证
- `winston` - 日志记录
- 等...

### 开发依赖（包含类型定义）
- `@types/express` - Express类型定义
- `@types/node` - Node.js类型定义
- `typescript` - TypeScript编译器
- `prisma` - Prisma CLI工具
- 等...

## 预期修复效果

安装依赖后，以下错误会自动消失：

✅ **模块找不到错误** - 所有15个模块导入错误
✅ **TenantRequest属性错误** - 所有38个属性识别错误  
✅ **process未定义** - 2个全局对象错误

剩余错误：
- ✅ **隐式any类型** - 已修复（1个）

**总计**: 从56个错误 → 0个错误 🎉

## 后续步骤

依赖安装完成后：

1. **生成Prisma Client**
   ```bash
   npx prisma generate
   ```

2. **运行数据库迁移**
   ```bash
   npx prisma migrate dev
   ```

3. **启动开发服务器**
   ```bash
   npm run dev
   ```

