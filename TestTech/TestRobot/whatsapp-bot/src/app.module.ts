import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { WhatsappModule } from './whatsapp/whatsapp.module';
import { BookingModule } from './booking/booking.module';

@Module({
  imports: [
    // 全局配置模块，加载 .env 文件
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
    }),
    WhatsappModule,
    BookingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
