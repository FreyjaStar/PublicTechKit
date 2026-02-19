import { WhatsappService } from './whatsapp.service';
import { ConfigService } from '@nestjs/config';
export declare class WhatsappController {
    private readonly whatsappService;
    private readonly configService;
    private readonly logger;
    constructor(whatsappService: WhatsappService, configService: ConfigService);
    verifyWebhook(mode: string, token: string, challenge: string): string | number;
    handleWebhook(body: WebhookPayload): Promise<string>;
    private handleIncomingMessage;
    private isBookingMessage;
    private handleStatusUpdate;
}
interface WebhookPayload {
    object: string;
    entry?: WebhookEntry[];
}
interface WebhookEntry {
    id: string;
    changes?: WebhookChange[];
}
interface WebhookChange {
    field: string;
    value: WebhookValue;
}
interface WebhookValue {
    messaging_product: string;
    metadata: MessageMetadata;
    contacts?: Contact[];
    messages?: IncomingMessage[];
    statuses?: MessageStatus[];
}
interface MessageMetadata {
    display_phone_number: string;
    phone_number_id: string;
}
interface Contact {
    profile: {
        name: string;
    };
    wa_id: string;
}
interface IncomingMessage {
    from: string;
    id: string;
    timestamp: string;
    type: 'text' | 'image' | 'audio' | 'video' | 'document' | 'location' | 'interactive' | 'button';
    text?: {
        body: string;
    };
    interactive?: {
        type: string;
        button_reply?: {
            id: string;
            title: string;
        };
        list_reply?: {
            id: string;
            title: string;
            description: string;
        };
    };
}
interface MessageStatus {
    id: string;
    status: 'sent' | 'delivered' | 'read' | 'failed';
    timestamp: string;
    recipient_id: string;
}
export {};
