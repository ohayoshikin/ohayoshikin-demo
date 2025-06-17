# ========================
# Build stage
# ========================
FROM node:22-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖声明
COPY package.json package-lock.json* pnpm-lock.yaml* ./

# 安装 pnpm（如果你用 pnpm）
RUN npm install -g pnpm

# 安装依赖
RUN pnpm install

# 复制项目文件
COPY . .

# 编译项目（适用于 Next.js）
RUN pnpm build



# ========================
# Production stage
# ========================
FROM node:22-alpine AS runner

# 创建非 root 用户
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=52001

# 复制运行所需文件
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# 使用非 root 用户运行
USER nextjs

# 默认端口（Next.js 默认监听 3000）
EXPOSE 52005

# 启动应用
CMD ["node_modules/.bin/next", "start"]