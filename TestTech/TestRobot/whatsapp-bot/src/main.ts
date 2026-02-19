import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const logger = new Logger('Bootstrap');
  
  const app = await NestFactory.create(AppModule);

  // 启用 CORS（允许跨域请求）
  app.enableCors({
    origin: '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
  });

  // 全局验证管道
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
    }),
  );

  // 设置全局前缀（可选）
  // app.setGlobalPrefix('api');

  const port = process.env.PORT || 3000;
  await app.listen(port);

  logger.log(`🚀 WhatsApp Bot 服务已启动`);
  logger.log(`📡 服务地址: http://localhost:${port}`);
  logger.log(`🔗 Webhook 地址: http://localhost:${port}/webhook`);
  logger.log(`📋 预约 API: http://localhost:${port}/api/bookings`);
}

bootstrap();
