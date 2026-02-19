import { ConfigService } from '@nestjs/config';
export declare class WhatsappService {
    private readonly configService;
    private readonly logger;
    private readonly apiClient;
    private readonly phoneNumberId;
    constructor(configService: ConfigService);
    sendTextMessage(to: string, text: string): Promise<SendMessageResponse>;
    sendTemplateMessage(to: string, templateName: string, languageCode?: string, components?: TemplateComponent[]): Promise<SendMessageResponse>;
    sendButtonMessage(to: string, bodyText: string, buttons: InteractiveButton[]): Promise<SendMessageResponse>;
    handleBookingRequest(customerPhone: string, bookingText: string): Promise<void>;
    sendAutoReply(to: string): Promise<void>;
    notifyEmployee(employeePhone: string, customerPhone: string, bookingDetails: BookingDetails): Promise<void>;
    private getStaffPhones;
    private buildBookingNotification;
}
interface SendMessageResponse {
    messaging_product: string;
    contacts: {
        input: string;
        wa_id: string;
    }[];
    messages: {
        id: string;
    }[];
}
interface TemplateComponent {
    type: 'header' | 'body' | 'button';
    parameters?: {
        type: 'text' | 'image' | 'document' | 'video';
        text?: string;
        image?: {
            link: string;
        };
        document?: {
            link: string;
        };
    }[];
    sub_type?: 'quick_reply' | 'url';
    index?: number;
}
interface InteractiveButton {
    id?: string;
    title: string;
}
interface BookingDetails {
    dateTime?: string;
    serviceType?: string;
    notes?: string;
}
export {};
