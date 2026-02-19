#!/bin/bash

# FaceID 项目部署脚本
SERVER="root@121.4.53.143"
REMOTE_DIR="/var/www/faceid"

echo "🚀 开始部署 FaceID 项目..."

# 1. 在服务器上创建目录
echo "📁 创建服务器目录..."
ssh $SERVER "mkdir -p $REMOTE_DIR/backend $REMOTE_DIR/frontend"

# 2. 上传后端文件
echo "📤 上传后端文件..."
scp -r backend/dist backend/package.json backend/package-lock.json $SERVER:$REMOTE_DIR/backend/

# 3. 上传前端文件
echo "📤 上传前端文件..."
scp -r frontend/dist/* $SERVER:$REMOTE_DIR/frontend/

# 4. 在服务器上安装依赖并启动
echo "📦 安装后端依赖..."
ssh $SERVER "cd $REMOTE_DIR/backend && npm install --production"

# 5. 配置 PM2
echo "⚙️ 配置 PM2..."
ssh $SERVER "npm install -g pm2 2>/dev/null || true"
ssh $SERVER "cd $REMOTE_DIR/backend && pm2 delete faceid-backend 2>/dev/null || true"
ssh $SERVER "cd $REMOTE_DIR/backend && pm2 start dist/main.js --name faceid-backend"
ssh $SERVER "pm2 save"

echo "✅ 部署完成！"
echo "🌐 访问: https://faceid.leadisle.cn"
