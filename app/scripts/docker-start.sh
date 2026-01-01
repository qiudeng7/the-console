#!/bin/sh
set -e

echo "🔍 检查数据库连接..."

# 等待数据库就绪
until npx drizzle-kit push 2>/dev/null; do
  echo "⏳ 等待数据库就绪..."
  sleep 2
done

echo "✅ 数据库已就绪"

# 检查是否需要初始化数据
echo "🔍 检查是否需要初始化数据..."

# 通过 drizzle-kit studio 或查询检查用户表
USER_COUNT=$(node -e "
const { getDb } = require('./server/database/db');
const { User } = require('./server/database/schema');
(async () => {
  const db = getDb();
  const users = await db.select({ id: User.id }).from(User);
  console.log(users.length);
  process.exit(0);
})();
") 2>/dev/null || echo "0")

if [ "$USER_COUNT" -eq "0" ]; then
  echo "📦 初始化数据..."
  node scripts/init-data.js
else
  echo "ℹ️  数据已存在，跳过初始化"
fi

echo "🚀 启动应用..."
exec node .output/server/index.mjs
