# Face ID 扫码认证系统

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/backend-NestJS-red)](backend/)
[![Frontend](https://img.shields.io/badge/frontend-Vue%203-42b883)](frontend/)

基于 WebAuthn / Passkey 的 Face ID 认证示例：
- PC 端创建会话并展示二维码
- iPhone 扫码后通过 Face ID 完成注册/认证
- PC 端通过 WebSocket 实时收到状态更新

English: [README.md](README.md)

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [系统架构](#系统架构)
- [快速开始](#快速开始)
- [配置说明](#配置说明)
- [API 概览](#api-概览)
- [部署](#部署)
- [故障排查](#故障排查)
- [许可证](#许可证)

## 功能特性

- 扫码注册（Passkey 注册）
- 扫码认证（Face ID 验签）
- 基于 Socket.IO 的实时状态回传
- SQLite 持久化用户和会话
- 提供 Nginx + PM2 的部署方案

## 技术栈

### 后端
- NestJS
- TypeORM
- SQLite
- Socket.IO
- `@simplewebauthn/server`

### 前端
- Vue 3 + TypeScript
- Vite
- Vue Router
- Socket.IO Client
- `@simplewebauthn/browser`

## 系统架构

```text
PC 浏览器             后端 (NestJS)                 iPhone Safari
---------            ----------------              ---------------
创建会话       --->  /api/auth/* 接口
展示二维码     --->  会话链接 (/register/:id 或 /auth/:id)
等待状态       <---  WebSocket: sessionUpdate
                                                 扫码访问
                                                 调用 WebAuthn
```

### 项目结构

```text
.
├── backend/
│   ├── src/
│   │   ├── auth/          # 认证接口 + WebAuthn 核心逻辑
│   │   ├── websocket/     # Socket.IO 网关
│   │   └── entities/      # User/Session 实体
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/         # Home/Register/Auth 页面
│   │   ├── router/
│   │   └── utils/api.ts
│   └── package.json
├── nginx.conf
├── deploy.sh
└── README.md
```

## 快速开始

### 环境要求

- Node.js >= 18
- npm >= 9

### 1) 启动后端

```bash
cd backend
npm install
npm run start:dev
```

后端地址：`http://localhost:3000`

### 2) 启动前端

```bash
cd frontend
npm install
npm run dev
```

前端地址：`http://localhost:5173`

### 3) 验证流程

1. 在 PC 打开首页。
2. 使用 iPhone Safari 扫描二维码。
3. 完成 Face ID。
4. 在 PC 观察实时状态更新。

## 配置说明

生产环境建议通过环境变量配置：

- `RP_ID`（示例：`faceid.example.com`）
- `ORIGIN`（示例：`https://faceid.example.com`）

当前默认值定义在 `backend/src/auth/auth.service.ts`。

## API 概览

基础路径：`/api/auth`

- `POST /register/session` 创建注册会话
- `POST /auth/session` 创建认证会话
- `GET /session/:sessionId` 查询会话状态
- `POST /register/start` 获取注册选项
- `POST /register/finish` 提交注册结果
- `POST /auth/start` 获取认证选项
- `POST /auth/finish` 提交认证结果

WebSocket：

- 客户端发送：`subscribe`、`unsubscribe`
- 服务端推送：`sessionUpdate`

## 部署

仓库已包含：

- `deploy.sh`：上传构建产物并重启 PM2
- `nginx.conf`：前端静态托管 + API/WebSocket 反向代理

上线检查清单：

1. 必须启用 HTTPS（WebAuthn 要求）。
2. Nginx 正确代理 `/api` 与 `/socket.io`。
3. `RP_ID` / `ORIGIN` 与真实域名完全一致。

## 故障排查

- iPhone 无法弹出 WebAuthn/Face ID：
  - 确认使用 Safari，不要使用 App 内置浏览器。
  - 确认 HTTPS 与域名配置一致。
- 认证时看不到账号或 Passkey：
  - 在同域名下重新注册通行密钥。
- PC 收不到状态更新：
  - 检查 WebSocket 代理和 CORS 配置。

## 许可证

MIT
