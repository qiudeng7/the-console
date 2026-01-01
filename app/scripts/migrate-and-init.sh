#!/bin/sh
set -e

echo "🚀 开始数据库迁移..."

# 等待 MySQL 就绪
echo "⏳ 等待 MySQL 数据库..."
while ! npx drizzle-kit push 2>/dev/null; do
  echo "   等待数据库连接..."
  sleep 2
done

echo "✅ 数据库迁移完成"

# 初始化数据
echo "📦 初始化数据..."
node /app/scripts/init-data.js

echo "🎉 迁移和初始化完成！"
