import { WhatsappService } from '../whatsapp/whatsapp.service';
import { ConfigService } from '@nestjs/config';
import type { Booking, CreateBookingDto, UpdateBookingDto } from './dto';
export declare class BookingService {
    private readonly whatsappService;
    private readonly configService;
    private readonly logger;
    private bookings;
    constructor(whatsappService: WhatsappService, configService: ConfigService);
    createBooking(dto: CreateBookingDto): Promise<Booking>;
    getAllBookings(): Booking[];
    getBookingById(id: string): Booking | null;
    updateBooking(id: string, dto: UpdateBookingDto): Promise<Booking | null>;
    confirmBooking(id: string): Promise<Booking | null>;
    cancelBooking(id: string): Promise<Booking | null>;
    getBookingsByStaff(staffPhone: string): Booking[];
    private notifyStaffAboutBooking;
    private notifyAllStaff;
    private buildStaffNotificationMessage;
    private sendBookingConfirmationToCustomer;
    private generateId;
}
