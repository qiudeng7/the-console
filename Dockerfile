FROM node:20-alpine

WORKDIR /app

RUN npm install -g pnpm

COPY package.json pnpm-lock.yaml ./
RUN pnpm install --frozen-lockfile

COPY . .

RUN pnpm build

# 暴露端口（app 使用 3000，queue 使用 4000）
EXPOSE 3000 4000

CMD ["node", ".output/server/index.mjs"]
