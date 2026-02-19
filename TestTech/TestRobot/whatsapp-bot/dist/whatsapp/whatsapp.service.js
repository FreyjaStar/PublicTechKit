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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
var WhatsappService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.WhatsappService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const axios_1 = __importDefault(require("axios"));
let WhatsappService = WhatsappService_1 = class WhatsappService {
    configService;
    logger = new common_1.Logger(WhatsappService_1.name);
    apiClient;
    phoneNumberId;
    constructor(configService) {
        this.configService = configService;
        const accessToken = this.configService.get('WHATSAPP_ACCESS_TOKEN');
        this.phoneNumberId = this.configService.get('WHATSAPP_PHONE_NUMBER_ID') || '';
        this.apiClient = axios_1.default.create({
            baseURL: 'https://graph.facebook.com/v21.0',
            headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
            },
        });
    }
    async sendTextMessage(to, text) {
        try {
            this.logger.log(`发送文本消息到 ${to}: ${text.substring(0, 50)}...`);
            const response = await this.apiClient.post(`/${this.phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'text',
                text: {
                    preview_url: false,
                    body: text,
                },
            });
            this.logger.log(`消息发送成功: ${response.data.messages[0].id}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`发送消息失败: ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }
    async sendTemplateMessage(to, templateName, languageCode = 'zh_CN', components) {
        try {
            this.logger.log(`发送模板消息到 ${to}: 模板=${templateName}`);
            const messageData = {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'template',
                template: {
                    name: templateName,
                    language: {
                        code: languageCode,
                    },
                },
            };
            if (components) {
                messageData.template.components = components;
            }
            const response = await this.apiClient.post(`/${this.phoneNumberId}/messages`, messageData);
            this.logger.log(`模板消息发送成功: ${response.data.messages[0].id}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`发送模板消息失败: ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }
    async sendButtonMessage(to, bodyText, buttons) {
        try {
            this.logger.log(`发送按钮消息到 ${to}`);
            const response = await this.apiClient.post(`/${this.phoneNumberId}/messages`, {
                messaging_product: 'whatsapp',
                recipient_type: 'individual',
                to: to,
                type: 'interactive',
                interactive: {
                    type: 'button',
                    body: {
                        text: bodyText,
                    },
                    action: {
                        buttons: buttons.map((btn, index) => ({
                            type: 'reply',
                            reply: {
                                id: btn.id || `btn_${index}`,
                                title: btn.title,
                            },
                        })),
                    },
                },
            });
            this.logger.log(`按钮消息发送成功: ${response.data.messages[0].id}`);
            return response.data;
        }
        catch (error) {
            this.logger.error(`发送按钮消息失败: ${error.response?.data?.error?.message || error.message}`);
            throw error;
        }
    }
    async handleBookingRequest(customerPhone, bookingText) {
        this.logger.log(`处理预约请求: 客户=${customerPhone}`);
        const staffPhones = this.getStaffPhones();
        const notificationMessage = this.buildBookingNotification(customerPhone, bookingText);
        for (const staffPhone of staffPhones) {
            try {
                await this.sendTextMessage(staffPhone, notificationMessage);
                this.logger.log(`已通知员工: ${staffPhone}`);
            }
            catch (error) {
                this.logger.error(`通知员工失败: ${staffPhone}`);
            }
        }
        await this.sendTextMessage(customerPhone, '感谢您的预约！我们的工作人员会尽快与您联系确认详情。');
    }
    async sendAutoReply(to) {
        const welcomeMessage = this.configService.get('WELCOME_MESSAGE') ||
            '您好！感谢您的消息。\n\n' +
                '如需预约服务，请发送"预约"并告诉我们您的需求。\n\n' +
                '我们的工作时间：周一至周日 9:00-18:00';
        await this.sendTextMessage(to, welcomeMessage);
    }
    async notifyEmployee(employeePhone, customerPhone, bookingDetails) {
        const message = `📋 新预约通知\n\n` +
            `👤 客户电话: ${customerPhone}\n` +
            `📅 预约时间: ${bookingDetails.dateTime || '待确认'}\n` +
            `📝 服务类型: ${bookingDetails.serviceType || '未指定'}\n` +
            `💬 备注: ${bookingDetails.notes || '无'}\n\n` +
            `请尽快联系客户确认预约详情。`;
        await this.sendTextMessage(employeePhone, message);
    }
    getStaffPhones() {
        const staffPhonesConfig = this.configService.get('STAFF_PHONES');
        if (staffPhonesConfig) {
            return staffPhonesConfig.split(',').map((phone) => phone.trim());
        }
        return [];
    }
    buildBookingNotification(customerPhone, bookingText) {
        const now = new Date().toLocaleString('zh-CN', {
            timeZone: 'Asia/Shanghai',
        });
        return (`🔔 新预约请求\n\n` +
            `⏰ 时间: ${now}\n` +
            `📱 客户电话: ${customerPhone}\n` +
            `📝 消息内容:\n${bookingText}\n\n` +
            `请及时联系客户确认预约详情。`);
    }
};
exports.WhatsappService = WhatsappService;
exports.WhatsappService = WhatsappService = WhatsappService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService])
], WhatsappService);
//# sourceMappingURL=whatsapp.service.js.map