# WhatsApp 预约通知机器人

基于 NestJS 构建的 WhatsApp Business API 集成服务，用于处理客户预约并自动通知员工。

## 功能特点

- ✅ 接收 WhatsApp 消息（通过 Webhook）
- ✅ 自动识别预约相关消息
- ✅ 自动通知员工新的预约请求
- ✅ 发送确认消息给客户
- ✅ 预约管理 REST API
- ✅ 支持发送文本、模板、按钮消息

## 前置要求

### 1. 创建 Meta 开发者应用

1. 访问 [Meta for Developers](https://developers.facebook.com/)
2. 使用 Facebook 账号登录
3. 创建新应用，选择 **Business** 类型
4. 在应用中添加 **WhatsApp** 产品

### 2. 配置 WhatsApp Business

1. 在 Meta Business Suite 中创建或关联 WhatsApp Business 账户
2. 添加一个用于 API 的电话号码（测试期间可使用 Meta 提供的测试号码）
3. 获取以下信息：
   - **Phone Number ID**
   - **WhatsApp Business Account ID**
   - **Access Token**（临时或永久）

### 3. 部署要求

- Node.js 18+
- 公网可访问的服务器（用于接收 Webhook）
- HTTPS 证书（Meta 要求 Webhook URL 必须是 HTTPS）

## 快速开始

### 1. 安装依赖

```bash
cd whatsapp-bot
npm install
```

### 2. 配置环境变量

```bash
# 复制示例配置
cp .env.example .env

# 编辑 .env 文件，填入你的配置
```

### 3. 启动服务

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod
```

### 4. 配置 Webhook

1. 进入 Meta 开发者控制台
2. 选择你的应用 → WhatsApp → 配置
3. 点击 **配置 Webhook**
4. 填入：
   - **Webhook URL**: `https://your-domain.com/webhook`
   - **Verify Token**: 与 `.env` 中的 `WHATSAPP_VERIFY_TOKEN` 相同
5. 订阅 **messages** 字段

## API 文档

### Webhook 端点

#### 验证 Webhook (GET /webhook)

Meta 用于验证 Webhook URL 的端点。

#### 接收消息 (POST /webhook)

接收来自 WhatsApp 的消息和事件通知。

### 预约管理 API

#### 创建预约

```http
POST /api/bookings
Content-Type: application/json

{
  "customerPhone": "8613812345678",
  "customerName": "张三",
  "serviceType": "理发",
  "dateTime": "2024-01-15 14:00",
  "notes": "需要染发",
  "assignedStaff": "8613987654321"
}
```

#### 获取所有预约

```http
GET /api/bookings
```

#### 获取单个预约

```http
GET /api/bookings/:id
```

#### 确认预约

```http
POST /api/bookings/:id/confirm
```

#### 取消预约

```http
DELETE /api/bookings/:id
```

#### 获取员工的预约

```http
GET /api/bookings/staff/:phone
```

## 工作流程

```
客户发送消息 → WhatsApp → Meta Webhook → 你的服务器
                                              ↓
                                        解析消息内容
                                              ↓
                                    ┌─────────┴─────────┐
                                    ↓                   ↓
                              预约消息              普通消息
                                    ↓                   ↓
                              通知员工            自动回复
                                    ↓
                              发送确认给客户
```

## 定价说明

WhatsApp Business API **不是完全免费的**：

### 免费消息

- 客户主动发送消息后，24小时内的回复是免费的（非模板消息）
- 实用型模板消息在客户服务时间窗内免费

### 收费消息

- 营销类模板消息收费
- 超出 24 小时时间窗的消息需要使用模板，可能收费
- 价格因国家/地区而异

详见 [WhatsApp Business 定价](https://developers.facebook.com/documentation/business-messaging/whatsapp/pricing)

## 注意事项

1. **电话号码格式**: 使用国际格式，包含国家码，不带 `+` 号，如 `8613812345678`

2. **24小时规则**: 只能在客户最后发送消息后的 24 小时内免费回复。超过 24 小时需要使用模板消息。

3. **模板消息**: 需要预先在 Meta Business Suite 中创建并审核通过。

4. **测试期间**: 可以使用 Meta 提供的测试号码，但只能发送给已添加为测试联系人的号码。

## 常见问题

### Q: 为什么我收不到 Webhook？

1. 确保 Webhook URL 是 HTTPS
2. 检查 Verify Token 是否正确
3. 确认已订阅 messages 字段
4. 查看服务器日志是否有错误

### Q: 如何获取永久 Access Token？

1. 在 Meta Business Suite 中创建系统用户
2. 为系统用户生成永久 Token
3. 详见 [Access Token 文档](https://developers.facebook.com/documentation/business-messaging/whatsapp/access-tokens)

### Q: 个人能创建 WhatsApp 机器人吗？

可以！你需要：
- Facebook 开发者账户（免费）
- Meta Business 账户（免费）
- 一个电话号码用于 WhatsApp Business

## 项目结构

```
src/
├── main.ts                    # 应用入口
├── app.module.ts              # 主模块
├── whatsapp/
│   ├── whatsapp.module.ts     # WhatsApp 模块
│   ├── whatsapp.controller.ts # Webhook 控制器
│   └── whatsapp.service.ts    # WhatsApp API 服务
└── booking/
    ├── booking.module.ts      # 预约模块
    ├── booking.controller.ts  # 预约 API 控制器
    └── booking.service.ts     # 预约业务逻辑
```

## 许可证

MIT
