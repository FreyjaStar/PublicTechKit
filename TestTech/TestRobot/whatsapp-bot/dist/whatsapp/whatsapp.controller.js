"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var WhatsappController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappController = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("./whatsapp.service");
const config_1 = require("@nestjs/config");
let WhatsappController = WhatsappController_1 = class WhatsappController {
    whatsappService;
    configService;
    logger = new common_1.Logger(WhatsappController_1.name);
    constructor(whatsappService, configService) {
        this.whatsappService = whatsappService;
        this.configService = configService;
    }
    verifyWebhook(mode, token, challenge) {
        const verifyToken = this.configService.get('WHATSAPP_VERIFY_TOKEN');
        this.logger.log(`Webhook 验证请求: mode=${mode}, token=${token}`);
        if (mode === 'subscribe' && token === verifyToken) {
            this.logger.log('Webhook 验证成功！');
            return challenge;
        }
        this.logger.warn('Webhook 验证失败：Token 不匹配');
        return 'Forbidden';
    }
    async handleWebhook(body) {
        this.logger.log('收到 Webhook 事件');
        this.logger.debug(`Webhook 数据: ${JSON.stringify(body, null, 2)}`);
        if (body.object === 'whatsapp_business_account') {
            for (const entry of body.entry || []) {
                for (const change of entry.changes || []) {
                    if (change.field === 'messages') {
                        const value = change.value;
                        if (value.messages) {
                            for (const message of value.messages) {
                                await this.handleIncomingMessage(message, value.metadata);
                            }
                        }
                        if (value.statuses) {
                            for (const status of value.statuses) {
                                this.handleStatusUpdate(status);
                            }
                        }
                    }
                }
            }
        }
        return 'EVENT_RECEIVED';
    }
    async handleIncomingMessage(message, metadata) {
        this.logger.log(`收到消息: 类型=${message.type}, 发送者=${message.from}`);
        const senderPhone = message.from;
        const messageType = message.type;
        switch (messageType) {
            case 'text':
                const textContent = message.text?.body || '';
                this.logger.log(`文本消息内容: ${textContent}`);
                if (this.isBookingMessage(textContent)) {
                    await this.whatsappService.handleBookingRequest(senderPhone, textContent);
                }
                else {
                    await this.whatsappService.sendAutoReply(senderPhone);
                }
                break;
            case 'interactive':
                const interactiveData = message.interactive;
                this.logger.log(`交互式消息: ${JSON.stringify(interactiveData)}`);
                break;
            default:
                this.logger.log(`未处理的消息类型: ${messageType}`);
        }
    }
    isBookingMessage(text) {
        const bookingKeywords = [
            '预约',
            '预订',
            '订位',
            'book',
            'booking',
            'appointment',
            '预定',
        ];
        return bookingKeywords.some((keyword) => text.toLowerCase().includes(keyword.toLowerCase()));
    }
    handleStatusUpdate(status) {
        this.logger.log(`消息状态更新: ID=${status.id}, 状态=${status.status}`);
    }
};
exports.WhatsappController = WhatsappController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('hub.mode')),
    __param(1, (0, common_1.Query)('hub.verify_token')),
    __param(2, (0, common_1.Query)('hub.challenge')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String]),
    __metadata("design:returntype", Object)
], WhatsappController.prototype, "verifyWebhook", null);
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], WhatsappController.prototype, "handleWebhook", null);
exports.WhatsappController = WhatsappController = WhatsappController_1 = __decorate([
    (0, common_1.Controller)('webhook'),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService,
        config_1.ConfigService])
], WhatsappController);
//# sourceMappingURL=whatsapp.controller.js.map