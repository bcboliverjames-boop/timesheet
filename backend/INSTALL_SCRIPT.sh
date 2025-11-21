#!/bin/bash
# WMS Backend 依赖安装脚本 (Bash)
# 使用方法：在backend目录下运行此脚本
# chmod +x INSTALL_SCRIPT.sh && ./INSTALL_SCRIPT.sh

echo "========================================"
echo "WMS Backend 依赖安装脚本"
echo "========================================"
echo ""

# 步骤1: 检查Node.js
echo "步骤1: 检查Node.js安装..."
if command -v node &> /dev/null; then
    NODE_VERSION=$(node --version)
    NPM_VERSION=$(npm --version)
    echo "✓ Node.js版本: $NODE_VERSION"
    echo "✓ npm版本: $NPM_VERSION"
else
    echo "✗ Node.js未安装或不在PATH中"
    echo "  请访问 https://nodejs.org/ 下载安装Node.js"
    echo "  或使用 nvm 安装: nvm install --lts"
    exit 1
fi
echo ""

# 步骤2: 检查当前目录
echo "步骤2: 检查当前目录..."
if [ ! -f "package.json" ]; then
    echo "✗ 未找到package.json文件"
    echo "  请确保在backend目录下运行此脚本"
    exit 1
fi
echo "✓ 找到package.json"
echo ""

# 步骤3: 检查是否已安装依赖
echo "步骤3: 检查依赖安装状态..."
if [ -d "node_modules" ]; then
    echo "✓ node_modules目录已存在"
    echo "  是否要重新安装？(y/n)"
    read -r response
    if [ "$response" != "y" ] && [ "$response" != "Y" ]; then
        echo "跳过安装"
        exit 0
    fi
    echo "删除现有node_modules..."
    rm -rf node_modules
else
    echo "node_modules目录不存在，需要安装依赖"
fi
echo ""

# 步骤4: 安装依赖
echo "步骤4: 安装依赖包..."
echo "这可能需要几分钟时间，请耐心等待..."
echo ""

if npm install; then
    echo ""
    echo "✓ 依赖安装成功！"
else
    echo ""
    echo "✗ 依赖安装失败"
    echo "  请检查错误信息并参考 INSTALL_GUIDE.md"
    exit 1
fi
echo ""

# 步骤5: 验证安装
echo "步骤5: 验证依赖安装..."
REQUIRED_MODULES=("express" "@types/express" "@types/node" "zod")
ALL_INSTALLED=true

for module in "${REQUIRED_MODULES[@]}"; do
    if [ -d "node_modules/$module" ]; then
        echo "✓ $module 已安装"
    else
        echo "✗ $module 未找到"
        ALL_INSTALLED=false
    fi
done

if [ "$ALL_INSTALLED" = false ]; then
    echo ""
    echo "警告: 某些依赖未正确安装"
    echo "请重新运行: npm install"
fi
echo ""

# 步骤6: 类型检查
echo "步骤6: 运行TypeScript类型检查..."
if npx tsc --noEmit 2>/dev/null; then
    echo "✓ 类型检查通过！没有错误"
else
    echo "⚠ 类型检查发现错误，运行详细信息:"
    npx tsc --noEmit
fi
echo ""

# 完成
echo "========================================"
echo "安装脚本执行完成！"
echo "========================================"
echo ""
echo "下一步:"
echo "1. 运行: npx prisma generate"
echo "2. 运行: npx prisma migrate dev"
echo "3. 运行: npm run dev"
echo ""

