# Face ID QR Auth Demo

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)
[![Backend](https://img.shields.io/badge/backend-NestJS-red)](backend/)
[![Frontend](https://img.shields.io/badge/frontend-Vue%203-42b883)](frontend/)

A WebAuthn-based Face ID authentication demo with QR-code flow:
- PC creates a session and shows a QR code
- iPhone scans the code and completes Face ID / Passkey verification
- PC receives real-time status via WebSocket

中文文档: [README.zh-CN.md](README.zh-CN.md)

## Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [Architecture](#architecture)
- [Quick Start](#quick-start)
- [Configuration](#configuration)
- [API Overview](#api-overview)
- [Deployment](#deployment)
- [Troubleshooting](#troubleshooting)
- [License](#license)

## Features

- QR-based registration and authentication
- Passkey/WebAuthn flow with iPhone Face ID
- Real-time status sync via Socket.IO
- SQLite persistence for users and sessions
- Simple deployment with Nginx + PM2

## Tech Stack

### Backend
- NestJS
- TypeORM
- SQLite
- Socket.IO
- `@simplewebauthn/server`

### Frontend
- Vue 3 + TypeScript
- Vite
- Vue Router
- Socket.IO Client
- `@simplewebauthn/browser`

## Architecture

```text
PC Browser            Backend (NestJS)              iPhone Safari
----------            ----------------              --------------
Create session  --->  /api/auth/* session APIs
Render QR       --->  session URL (/register/:id or /auth/:id)
Wait updates    <---  WebSocket: sessionUpdate
                                                 Scan QR
                                                 Start/Finish WebAuthn
```

### Project Structure

```text
.
├── backend/
│   ├── src/
│   │   ├── auth/          # Auth API + WebAuthn logic
│   │   ├── websocket/     # Socket.IO gateway
│   │   └── entities/      # User/Session entities
│   └── package.json
├── frontend/
│   ├── src/
│   │   ├── views/         # Home/Register/Auth pages
│   │   ├── router/
│   │   └── utils/api.ts
│   └── package.json
├── nginx.conf
├── deploy.sh
└── README.zh-CN.md
```

## Quick Start

### Requirements

- Node.js >= 18
- npm >= 9

### 1) Start backend

```bash
cd backend
npm install
npm run start:dev
```

Backend runs on `http://localhost:3000`.

### 2) Start frontend

```bash
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`.

### 3) Test flow

1. Open the PC page in desktop browser.
2. Scan the register/auth QR code with iPhone Safari.
3. Complete Face ID prompt.
4. Check status updates on PC in real time.

## Configuration

Set environment variables for production:

- `RP_ID` (e.g. `faceid.example.com`)
- `ORIGIN` (e.g. `https://faceid.example.com`)

Current fallback values are defined in `backend/src/auth/auth.service.ts`.

## API Overview

Base path: `/api/auth`

- `POST /register/session` - create registration session
- `POST /auth/session` - create authentication session
- `GET /session/:sessionId` - get session status
- `POST /register/start` - generate registration options
- `POST /register/finish` - verify registration response
- `POST /auth/start` - generate authentication options
- `POST /auth/finish` - verify authentication response

WebSocket:

- Client emits: `subscribe`, `unsubscribe`
- Server emits: `sessionUpdate`

## Deployment

The repo includes:

- `deploy.sh` for uploading frontend/backend artifacts and restarting PM2
- `nginx.conf` for static hosting + API/WebSocket reverse proxy

Production checklist:

1. HTTPS enabled (required by WebAuthn).
2. Nginx routes `/api` and `/socket.io` to backend.
3. `RP_ID` and `ORIGIN` match your real domain exactly.

## Troubleshooting

- WebAuthn prompt does not show on iPhone:
  - Use Safari (not in-app browsers).
  - Verify HTTPS and domain match.
- Authentication cannot find account/passkey:
  - Re-register passkey for the same domain.
- Session updates not received on PC:
  - Check WebSocket proxy and CORS settings.

## License

MIT
