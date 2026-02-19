import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Put,
  Delete,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { BookingService } from './booking.service';
import type { Booking, CreateBookingDto, UpdateBookingDto } from './dto';

/**
 * 预约管理控制器
 * 提供 REST API 用于管理预约
 */
@Controller('api/bookings')
export class BookingController {
  private readonly logger = new Logger(BookingController.name);

  constructor(private readonly bookingService: BookingService) {}

  /**
   * 创建新预约
   * POST /api/bookings
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  async createBooking(@Body() createDto: CreateBookingDto): Promise<Booking> {
    this.logger.log(`创建预约: 客户=${createDto.customerPhone}`);
    return this.bookingService.createBooking(createDto);
  }

  /**
   * 获取所有预约
   * GET /api/bookings
   */
  @Get()
  async getAllBookings(): Promise<Booking[]> {
    return this.bookingService.getAllBookings();
  }

  /**
   * 获取单个预约
   * GET /api/bookings/:id
   */
  @Get(':id')
  async getBooking(@Param('id') id: string): Promise<Booking | null> {
    return this.bookingService.getBookingById(id);
  }

  /**
   * 更新预约状态
   * PUT /api/bookings/:id
   */
  @Put(':id')
  async updateBooking(
    @Param('id') id: string,
    @Body() updateDto: UpdateBookingDto,
  ): Promise<Booking | null> {
    this.logger.log(`更新预约: ${id}`);
    return this.bookingService.updateBooking(id, updateDto);
  }

  /**
   * 确认预约
   * POST /api/bookings/:id/confirm
   */
  @Post(':id/confirm')
  @HttpCode(HttpStatus.OK)
  async confirmBooking(@Param('id') id: string): Promise<Booking | null> {
    this.logger.log(`确认预约: ${id}`);
    return this.bookingService.confirmBooking(id);
  }

  /**
   * 取消预约
   * DELETE /api/bookings/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  async cancelBooking(@Param('id') id: string): Promise<Booking | null> {
    this.logger.log(`取消预约: ${id}`);
    return this.bookingService.cancelBooking(id);
  }

  /**
   * 获取指定员工的预约
   * GET /api/bookings/staff/:phone
   */
  @Get('staff/:phone')
  async getStaffBookings(@Param('phone') phone: string): Promise<Booking[]> {
    return this.bookingService.getBookingsByStaff(phone);
  }
}
