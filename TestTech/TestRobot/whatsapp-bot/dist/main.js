"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const app_module_1 = require("./app.module");
const common_1 = require("@nestjs/common");
async function bootstrap() {
    const logger = new common_1.Logger('Bootstrap');
    const app = await core_1.NestFactory.create(app_module_1.AppModule);
    app.enableCors({
        origin: '*',
        methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
        credentials: true,
    });
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
    }));
    const port = process.env.PORT || 3000;
    await app.listen(port);
    logger.log(`🚀 WhatsApp Bot 服务已启动`);
    logger.log(`📡 服务地址: http://localhost:${port}`);
    logger.log(`🔗 Webhook 地址: http://localhost:${port}/webhook`);
    logger.log(`📋 预约 API: http://localhost:${port}/api/bookings`);
}
bootstrap();
//# sourceMappingURL=main.js.map