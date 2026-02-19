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
var BookingService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingService = void 0;
const common_1 = require("@nestjs/common");
const whatsapp_service_1 = require("../whatsapp/whatsapp.service");
const config_1 = require("@nestjs/config");
let BookingService = BookingService_1 = class BookingService {
    whatsappService;
    configService;
    logger = new common_1.Logger(BookingService_1.name);
    bookings = new Map();
    constructor(whatsappService, configService) {
        this.whatsappService = whatsappService;
        this.configService = configService;
    }
    async createBooking(dto) {
        const booking = {
            id: this.generateId(),
            customerPhone: dto.customerPhone,
            customerName: dto.customerName,
            serviceType: dto.serviceType,
            dateTime: dto.dateTime,
            notes: dto.notes,
            status: 'pending',
            assignedStaff: dto.assignedStaff,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };
        this.bookings.set(booking.id, booking);
        this.logger.log(`预约已创建: ${booking.id}`);
        if (booking.assignedStaff) {
            await this.notifyStaffAboutBooking(booking);
        }
        else {
            await this.notifyAllStaff(booking);
        }
        await this.sendBookingConfirmationToCustomer(booking);
        return booking;
    }
    getAllBookings() {
        return Array.from(this.bookings.values());
    }
    getBookingById(id) {
        return this.bookings.get(id) || null;
    }
    async updateBooking(id, dto) {
        const booking = this.bookings.get(id);
        if (!booking) {
            return null;
        }
        const updatedBooking = {
            ...booking,
            ...dto,
            updatedAt: new Date().toISOString(),
        };
        this.bookings.set(id, updatedBooking);
        this.logger.log(`预约已更新: ${id}`);
        return updatedBooking;
    }
    async confirmBooking(id) {
        const booking = this.bookings.get(id);
        if (!booking) {
            return null;
        }
        booking.status = 'confirmed';
        booking.updatedAt = new Date().toISOString();
        this.bookings.set(id, booking);
        await this.whatsappService.sendTextMessage(booking.customerPhone, `🎉 您的预约已确认！\n\n` +
            `📋 预约编号: ${booking.id}\n` +
            `📅 时间: ${booking.dateTime}\n` +
            `📝 服务: ${booking.serviceType || '未指定'}\n\n` +
            `如需更改或取消，请提前联系我们。感谢您的预约！`);
        this.logger.log(`预约已确认: ${id}`);
        return booking;
    }
    async cancelBooking(id) {
        const booking = this.bookings.get(id);
        if (!booking) {
            return null;
        }
        booking.status = 'cancelled';
        booking.updatedAt = new Date().toISOString();
        this.bookings.set(id, booking);
        await this.whatsappService.sendTextMessage(booking.customerPhone, `❌ 您的预约已取消\n\n` +
            `📋 预约编号: ${booking.id}\n\n` +
            `如有疑问，请联系我们。期待您再次预约！`);
        this.logger.log(`预约已取消: ${id}`);
        return booking;
    }
    getBookingsByStaff(staffPhone) {
        return Array.from(this.bookings.values()).filter((booking) => booking.assignedStaff === staffPhone);
    }
    async notifyStaffAboutBooking(booking) {
        if (!booking.assignedStaff)
            return;
        const message = this.buildStaffNotificationMessage(booking);
        try {
            await this.whatsappService.sendTextMessage(booking.assignedStaff, message);
            this.logger.log(`已通知员工 ${booking.assignedStaff} 关于预约 ${booking.id}`);
        }
        catch (error) {
            this.logger.error(`通知员工失败: ${error}`);
        }
    }
    async notifyAllStaff(booking) {
        const staffPhonesConfig = this.configService.get('STAFF_PHONES');
        if (!staffPhonesConfig) {
            this.logger.warn('未配置员工电话列表');
            return;
        }
        const staffPhones = staffPhonesConfig.split(',').map((p) => p.trim());
        const message = this.buildStaffNotificationMessage(booking);
        for (const phone of staffPhones) {
            try {
                await this.whatsappService.sendTextMessage(phone, message);
                this.logger.log(`已通知员工 ${phone} 关于预约 ${booking.id}`);
            }
            catch (error) {
                this.logger.error(`通知员工 ${phone} 失败: ${error}`);
            }
        }
    }
    buildStaffNotificationMessage(booking) {
        return (`🔔 新预约通知\n\n` +
            `📋 预约编号: ${booking.id}\n` +
            `👤 客户: ${booking.customerName || '未知'}\n` +
            `📱 电话: ${booking.customerPhone}\n` +
            `📅 时间: ${booking.dateTime || '待确认'}\n` +
            `📝 服务: ${booking.serviceType || '未指定'}\n` +
            `💬 备注: ${booking.notes || '无'}\n\n` +
            `⏰ 创建时间: ${booking.createdAt}\n\n` +
            `请及时联系客户确认预约详情。`);
    }
    async sendBookingConfirmationToCustomer(booking) {
        const message = `✅ 预约请求已收到！\n\n` +
            `📋 预约编号: ${booking.id}\n` +
            `📅 预约时间: ${booking.dateTime || '待确认'}\n` +
            `📝 服务类型: ${booking.serviceType || '未指定'}\n\n` +
            `我们的工作人员会尽快与您联系确认详情。\n` +
            `感谢您的预约！`;
        try {
            await this.whatsappService.sendTextMessage(booking.customerPhone, message);
        }
        catch (error) {
            this.logger.error(`发送客户确认消息失败: ${error}`);
        }
    }
    generateId() {
        const timestamp = Date.now().toString(36);
        const random = Math.random().toString(36).substring(2, 8);
        return `BK-${timestamp}-${random}`.toUpperCase();
    }
};
exports.BookingService = BookingService;
exports.BookingService = BookingService = BookingService_1 = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [whatsapp_service_1.WhatsappService,
        config_1.ConfigService])
], BookingService);
//# sourceMappingURL=booking.service.js.map