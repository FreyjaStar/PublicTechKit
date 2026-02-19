import { Injectable, Logger } from '@nestjs/common';
import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConfigService } from '@nestjs/config';
import type { Booking, CreateBookingDto, UpdateBookingDto } from './dto';

/**
 * 预约服务
 * 管理预约的创建、更新、通知等功能
 */
@Injectable()
export class BookingService {
  private readonly logger = new Logger(BookingService.name);
  
  // 内存存储预约（实际项目中应该使用数据库）
  private bookings: Map<string, Booking> = new Map();

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * 创建新预约
   */
  async createBooking(dto: CreateBookingDto): Promise<Booking> {
    const booking: Booking = {
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

    // 通知员工
    if (booking.assignedStaff) {
      await this.notifyStaffAboutBooking(booking);
    } else {
      // 如果没有指定员工，通知所有员工
      await this.notifyAllStaff(booking);
    }

    // 发送确认消息给客户
    await this.sendBookingConfirmationToCustomer(booking);

    return booking;
  }

  /**
   * 获取所有预约
   */
  getAllBookings(): Booking[] {
    return Array.from(this.bookings.values());
  }

  /**
   * 根据 ID 获取预约
   */
  getBookingById(id: string): Booking | null {
    return this.bookings.get(id) || null;
  }

  /**
   * 更新预约
   */
  async updateBooking(id: string, dto: UpdateBookingDto): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    if (!booking) {
      return null;
    }

    const updatedBooking: Booking = {
      ...booking,
      ...dto,
      updatedAt: new Date().toISOString(),
    };

    this.bookings.set(id, updatedBooking);
    this.logger.log(`预约已更新: ${id}`);

    return updatedBooking;
  }

  /**
   * 确认预约
   */
  async confirmBooking(id: string): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    if (!booking) {
      return null;
    }

    booking.status = 'confirmed';
    booking.updatedAt = new Date().toISOString();
    this.bookings.set(id, booking);

    // 通知客户预约已确认
    await this.whatsappService.sendTextMessage(
      booking.customerPhone,
      `🎉 您的预约已确认！\n\n` +
      `📋 预约编号: ${booking.id}\n` +
      `📅 时间: ${booking.dateTime}\n` +
      `📝 服务: ${booking.serviceType || '未指定'}\n\n` +
      `如需更改或取消，请提前联系我们。感谢您的预约！`,
    );

    this.logger.log(`预约已确认: ${id}`);
    return booking;
  }

  /**
   * 取消预约
   */
  async cancelBooking(id: string): Promise<Booking | null> {
    const booking = this.bookings.get(id);
    if (!booking) {
      return null;
    }

    booking.status = 'cancelled';
    booking.updatedAt = new Date().toISOString();
    this.bookings.set(id, booking);

    // 通知客户预约已取消
    await this.whatsappService.sendTextMessage(
      booking.customerPhone,
      `❌ 您的预约已取消\n\n` +
      `📋 预约编号: ${booking.id}\n\n` +
      `如有疑问，请联系我们。期待您再次预约！`,
    );

    this.logger.log(`预约已取消: ${id}`);
    return booking;
  }

  /**
   * 获取指定员工的预约
   */
  getBookingsByStaff(staffPhone: string): Booking[] {
    return Array.from(this.bookings.values()).filter(
      (booking) => booking.assignedStaff === staffPhone,
    );
  }

  /**
   * 通知指定员工关于新预约
   */
  private async notifyStaffAboutBooking(booking: Booking): Promise<void> {
    if (!booking.assignedStaff) return;

    const message = this.buildStaffNotificationMessage(booking);
    
    try {
      await this.whatsappService.sendTextMessage(booking.assignedStaff, message);
      this.logger.log(`已通知员工 ${booking.assignedStaff} 关于预约 ${booking.id}`);
    } catch (error) {
      this.logger.error(`通知员工失败: ${error}`);
    }
  }

  /**
   * 通知所有员工关于新预约
   */
  private async notifyAllStaff(booking: Booking): Promise<void> {
    const staffPhonesConfig = this.configService.get<string>('STAFF_PHONES');
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
      } catch (error) {
        this.logger.error(`通知员工 ${phone} 失败: ${error}`);
      }
    }
  }

  /**
   * 构建员工通知消息
   */
  private buildStaffNotificationMessage(booking: Booking): string {
    return (
      `🔔 新预约通知\n\n` +
      `📋 预约编号: ${booking.id}\n` +
      `👤 客户: ${booking.customerName || '未知'}\n` +
      `📱 电话: ${booking.customerPhone}\n` +
      `📅 时间: ${booking.dateTime || '待确认'}\n` +
      `📝 服务: ${booking.serviceType || '未指定'}\n` +
      `💬 备注: ${booking.notes || '无'}\n\n` +
      `⏰ 创建时间: ${booking.createdAt}\n\n` +
      `请及时联系客户确认预约详情。`
    );
  }

  /**
   * 发送预约确认消息给客户
   */
  private async sendBookingConfirmationToCustomer(booking: Booking): Promise<void> {
    const message =
      `✅ 预约请求已收到！\n\n` +
      `📋 预约编号: ${booking.id}\n` +
      `📅 预约时间: ${booking.dateTime || '待确认'}\n` +
      `📝 服务类型: ${booking.serviceType || '未指定'}\n\n` +
      `我们的工作人员会尽快与您联系确认详情。\n` +
      `感谢您的预约！`;

    try {
      await this.whatsappService.sendTextMessage(booking.customerPhone, message);
    } catch (error) {
      this.logger.error(`发送客户确认消息失败: ${error}`);
    }
  }

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    const timestamp = Date.now().toString(36);
    const random = Math.random().toString(36).substring(2, 8);
    return `BK-${timestamp}-${random}`.toUpperCase();
  }
}
