import {
  Controller,
  Get,
  Post,
  Body,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { WhatsappService } from './whatsapp.service';
import { ConfigService } from '@nestjs/config';

/**
 * WhatsApp Webhook 控制器
 * 处理 Meta 平台发送的 Webhook 请求
 */
@Controller('webhook')
export class WhatsappController {
  private readonly logger = new Logger(WhatsappController.name);

  constructor(
    private readonly whatsappService: WhatsappService,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Webhook 验证端点 (GET)
   * Meta 平台会发送 GET 请求来验证 Webhook URL
   * 
   * @param mode - 验证模式，必须是 'subscribe'
   * @param token - 验证 Token，必须与你配置的 VERIFY_TOKEN 匹配
   * @param challenge - 挑战码，验证成功后需要原样返回
   */
  @Get()
  verifyWebhook(
    @Query('hub.mode') mode: string,
    @Query('hub.verify_token') token: string,
    @Query('hub.challenge') challenge: string,
  ): string | number {
    const verifyToken = this.configService.get<string>('WHATSAPP_VERIFY_TOKEN');

    this.logger.log(`Webhook 验证请求: mode=${mode}, token=${token}`);

    if (mode === 'subscribe' && token === verifyToken) {
      this.logger.log('Webhook 验证成功！');
      return challenge;
    }

    this.logger.warn('Webhook 验证失败：Token 不匹配');
    return 'Forbidden';
  }

  /**
   * Webhook 消息接收端点 (POST)
   * 接收来自 WhatsApp 的消息和事件通知
   */
  @Post()
  @HttpCode(HttpStatus.OK)
  async handleWebhook(@Body() body: WebhookPayload): Promise<string> {
    this.logger.log('收到 Webhook 事件');
    this.logger.debug(`Webhook 数据: ${JSON.stringify(body, null, 2)}`);

    // 检查是否是 WhatsApp 消息
    if (body.object === 'whatsapp_business_account') {
      for (const entry of body.entry || []) {
        for (const change of entry.changes || []) {
          if (change.field === 'messages') {
            const value = change.value;

            // 处理收到的消息
            if (value.messages) {
              for (const message of value.messages) {
                await this.handleIncomingMessage(message, value.metadata);
              }
            }

            // 处理消息状态更新
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

  /**
   * 处理收到的消息
   */
  private async handleIncomingMessage(
    message: IncomingMessage,
    metadata: MessageMetadata,
  ): Promise<void> {
    this.logger.log(
      `收到消息: 类型=${message.type}, 发送者=${message.from}`,
    );

    const senderPhone = message.from;
    const messageType = message.type;

    // 根据消息类型处理
    switch (messageType) {
      case 'text':
        const textContent = message.text?.body || '';
        this.logger.log(`文本消息内容: ${textContent}`);

        // 检查是否是预约相关消息
        if (this.isBookingMessage(textContent)) {
          await this.whatsappService.handleBookingRequest(
            senderPhone,
            textContent,
          );
        } else {
          // 普通消息，可以选择自动回复
          await this.whatsappService.sendAutoReply(senderPhone);
        }
        break;

      case 'interactive':
        // 处理交互式消息（按钮点击、列表选择等）
        const interactiveData = message.interactive;
        this.logger.log(
          `交互式消息: ${JSON.stringify(interactiveData)}`,
        );
        break;

      default:
        this.logger.log(`未处理的消息类型: ${messageType}`);
    }
  }

  /**
   * 检查是否是预约相关消息
   */
  private isBookingMessage(text: string): boolean {
    const bookingKeywords = [
      '预约',
      '预订',
      '订位',
      'book',
      'booking',
      'appointment',
      '预定',
    ];
    return bookingKeywords.some((keyword) =>
      text.toLowerCase().includes(keyword.toLowerCase()),
    );
  }

  /**
   * 处理消息状态更新
   */
  private handleStatusUpdate(status: MessageStatus): void {
    this.logger.log(
      `消息状态更新: ID=${status.id}, 状态=${status.status}`,
    );
  }
}

// ============= 类型定义 =============

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
