import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

/**
 * WhatsApp 服务
 * 封装 WhatsApp Cloud API 的调用
 */
@Injectable()
export class WhatsappService {
  private readonly logger = new Logger(WhatsappService.name);
  private readonly apiClient: AxiosInstance;
  private readonly phoneNumberId: string;

  constructor(private readonly configService: ConfigService) {
    const accessToken = this.configService.get<string>('WHATSAPP_ACCESS_TOKEN');
    this.phoneNumberId = this.configService.get<string>('WHATSAPP_PHONE_NUMBER_ID') || '';

    // 创建 API 客户端
    this.apiClient = axios.create({
      baseURL: 'https://graph.facebook.com/v21.0',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * 发送文本消息
   * @param to - 接收者电话号码（包含国家码，如 8613812345678）
   * @param text - 消息内容
   */
  async sendTextMessage(to: string, text: string): Promise<SendMessageResponse> {
    try {
      this.logger.log(`发送文本消息到 ${to}: ${text.substring(0, 50)}...`);

      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        {
          messaging_product: 'whatsapp',
          recipient_type: 'individual',
          to: to,
          type: 'text',
          text: {
            preview_url: false,
            body: text,
          },
        },
      );

      this.logger.log(`消息发送成功: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `发送消息失败: ${error.response?.data?.error?.message || error.message}`,
      );
      throw error;
    }
  }

  /**
   * 使用模板发送消息
   * @param to - 接收者电话号码
   * @param templateName - 模板名称
   * @param languageCode - 语言代码（如 zh_CN, en_US）
   * @param components - 模板组件参数
   */
  async sendTemplateMessage(
    to: string,
    templateName: string,
    languageCode: string = 'zh_CN',
    components?: TemplateComponent[],
  ): Promise<SendMessageResponse> {
    try {
      this.logger.log(`发送模板消息到 ${to}: 模板=${templateName}`);

      const messageData: any = {
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

      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        messageData,
      );

      this.logger.log(`模板消息发送成功: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `发送模板消息失败: ${error.response?.data?.error?.message || error.message}`,
      );
      throw error;
    }
  }

  /**
   * 发送交互式按钮消息
   * @param to - 接收者电话号码
   * @param bodyText - 消息正文
   * @param buttons - 按钮列表（最多3个）
   */
  async sendButtonMessage(
    to: string,
    bodyText: string,
    buttons: InteractiveButton[],
  ): Promise<SendMessageResponse> {
    try {
      this.logger.log(`发送按钮消息到 ${to}`);

      const response = await this.apiClient.post(
        `/${this.phoneNumberId}/messages`,
        {
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
        },
      );

      this.logger.log(`按钮消息发送成功: ${response.data.messages[0].id}`);
      return response.data;
    } catch (error: any) {
      this.logger.error(
        `发送按钮消息失败: ${error.response?.data?.error?.message || error.message}`,
      );
      throw error;
    }
  }

  /**
   * 处理预约请求
   * 当客户发送预约消息时，通知对应的员工
   */
  async handleBookingRequest(
    customerPhone: string,
    bookingText: string,
  ): Promise<void> {
    this.logger.log(`处理预约请求: 客户=${customerPhone}`);

    // 获取员工列表（可以从数据库或配置获取）
    const staffPhones = this.getStaffPhones();

    // 构建通知消息
    const notificationMessage = this.buildBookingNotification(
      customerPhone,
      bookingText,
    );

    // 通知所有相关员工
    for (const staffPhone of staffPhones) {
      try {
        await this.sendTextMessage(staffPhone, notificationMessage);
        this.logger.log(`已通知员工: ${staffPhone}`);
      } catch (error) {
        this.logger.error(`通知员工失败: ${staffPhone}`);
      }
    }

    // 给客户发送确认消息
    await this.sendTextMessage(
      customerPhone,
      '感谢您的预约！我们的工作人员会尽快与您联系确认详情。',
    );
  }

  /**
   * 发送自动回复消息
   */
  async sendAutoReply(to: string): Promise<void> {
    const welcomeMessage = this.configService.get<string>('WELCOME_MESSAGE') ||
      '您好！感谢您的消息。\n\n' +
      '如需预约服务，请发送"预约"并告诉我们您的需求。\n\n' +
      '我们的工作时间：周一至周日 9:00-18:00';

    await this.sendTextMessage(to, welcomeMessage);
  }

  /**
   * 通知特定员工（针对特定类型的预约）
   * @param employeePhone - 员工电话
   * @param customerPhone - 客户电话
   * @param bookingDetails - 预约详情
   */
  async notifyEmployee(
    employeePhone: string,
    customerPhone: string,
    bookingDetails: BookingDetails,
  ): Promise<void> {
    const message = `📋 新预约通知\n\n` +
      `👤 客户电话: ${customerPhone}\n` +
      `📅 预约时间: ${bookingDetails.dateTime || '待确认'}\n` +
      `📝 服务类型: ${bookingDetails.serviceType || '未指定'}\n` +
      `💬 备注: ${bookingDetails.notes || '无'}\n\n` +
      `请尽快联系客户确认预约详情。`;

    await this.sendTextMessage(employeePhone, message);
  }

  /**
   * 获取员工电话列表
   * 实际使用时应该从数据库获取
   */
  private getStaffPhones(): string[] {
    const staffPhonesConfig = this.configService.get<string>('STAFF_PHONES');
    if (staffPhonesConfig) {
      return staffPhonesConfig.split(',').map((phone) => phone.trim());
    }
    return [];
  }

  /**
   * 构建预约通知消息
   */
  private buildBookingNotification(
    customerPhone: string,
    bookingText: string,
  ): string {
    const now = new Date().toLocaleString('zh-CN', {
      timeZone: 'Asia/Shanghai',
    });

    return (
      `🔔 新预约请求\n\n` +
      `⏰ 时间: ${now}\n` +
      `📱 客户电话: ${customerPhone}\n` +
      `📝 消息内容:\n${bookingText}\n\n` +
      `请及时联系客户确认预约详情。`
    );
  }
}

// ============= 类型定义 =============

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
    image?: { link: string };
    document?: { link: string };
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
