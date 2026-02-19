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
var BookingController_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BookingController = void 0;
const common_1 = require("@nestjs/common");
const booking_service_1 = require("./booking.service");
let BookingController = BookingController_1 = class BookingController {
    bookingService;
    logger = new common_1.Logger(BookingController_1.name);
    constructor(bookingService) {
        this.bookingService = bookingService;
    }
    async createBooking(createDto) {
        this.logger.log(`创建预约: 客户=${createDto.customerPhone}`);
        return this.bookingService.createBooking(createDto);
    }
    async getAllBookings() {
        return this.bookingService.getAllBookings();
    }
    async getBooking(id) {
        return this.bookingService.getBookingById(id);
    }
    async updateBooking(id, updateDto) {
        this.logger.log(`更新预约: ${id}`);
        return this.bookingService.updateBooking(id, updateDto);
    }
    async confirmBooking(id) {
        this.logger.log(`确认预约: ${id}`);
        return this.bookingService.confirmBooking(id);
    }
    async cancelBooking(id) {
        this.logger.log(`取消预约: ${id}`);
        return this.bookingService.cancelBooking(id);
    }
    async getStaffBookings(phone) {
        return this.bookingService.getBookingsByStaff(phone);
    }
};
exports.BookingController = BookingController;
__decorate([
    (0, common_1.Post)(),
    (0, common_1.HttpCode)(common_1.HttpStatus.CREATED),
    __param(0, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "createBooking", null);
__decorate([
    (0, common_1.Get)(),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getAllBookings", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getBooking", null);
__decorate([
    (0, common_1.Put)(':id'),
    __param(0, (0, common_1.Param)('id')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "updateBooking", null);
__decorate([
    (0, common_1.Post)(':id/confirm'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "confirmBooking", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.OK),
    __param(0, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "cancelBooking", null);
__decorate([
    (0, common_1.Get)('staff/:phone'),
    __param(0, (0, common_1.Param)('phone')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", Promise)
], BookingController.prototype, "getStaffBookings", null);
exports.BookingController = BookingController = BookingController_1 = __decorate([
    (0, common_1.Controller)('api/bookings'),
    __metadata("design:paramtypes", [booking_service_1.BookingService])
], BookingController);
//# sourceMappingURL=booking.controller.js.map