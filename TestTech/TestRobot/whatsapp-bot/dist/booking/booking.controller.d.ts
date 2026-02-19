import { BookingService } from './booking.service';
import type { Booking, CreateBookingDto, UpdateBookingDto } from './dto';
export declare class BookingController {
    private readonly bookingService;
    private readonly logger;
    constructor(bookingService: BookingService);
    createBooking(createDto: CreateBookingDto): Promise<Booking>;
    getAllBookings(): Promise<Booking[]>;
    getBooking(id: string): Promise<Booking | null>;
    updateBooking(id: string, updateDto: UpdateBookingDto): Promise<Booking | null>;
    confirmBooking(id: string): Promise<Booking | null>;
    cancelBooking(id: string): Promise<Booking | null>;
    getStaffBookings(phone: string): Promise<Booking[]>;
}
