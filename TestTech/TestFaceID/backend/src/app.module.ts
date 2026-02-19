import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthModule } from './auth/auth.module';
import { WebsocketModule } from './websocket/websocket.module';
import { User } from './entities/user.entity';
import { Session } from './entities/session.entity';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'sqlite',
      database: 'faceid.db',
      entities: [User, Session],
      synchronize: true,
    }),
    WebsocketModule,
    AuthModule,
  ],
})
export class AppModule {}
