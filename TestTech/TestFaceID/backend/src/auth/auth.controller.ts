import { Controller, Post, Get, Body, Param, HttpException, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SessionStatus } from '../entities/session.entity';
import { EventsGateway } from '../websocket/events.gateway';

@Controller('api/auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private eventsGateway: EventsGateway,
  ) {}

  // PC端：创建注册会话
  @Post('register/session')
  async createRegisterSession() {
    const session = await this.authService.createRegisterSession();
    return { sessionId: session.id, expiresAt: session.expiresAt };
  }

  // PC端：创建认证会话
  @Post('auth/session')
  async createAuthSession() {
    const session = await this.authService.createAuthSession();
    return { sessionId: session.id, expiresAt: session.expiresAt };
  }

  // PC端/手机端：获取会话状态
  @Get('session/:sessionId')
  async getSessionStatus(@Param('sessionId') sessionId: string) {
    const session = await this.authService.getSession(sessionId);
    if (!session) {
      throw new HttpException('Session not found', HttpStatus.NOT_FOUND);
    }
    return {
      id: session.id,
      type: session.type,
      status: session.status,
      username: session.username,
      expiresAt: session.expiresAt,
    };
  }

  // 手机端：开始注册
  @Post('register/start')
  async startRegistration(@Body() body: { sessionId: string; username: string }) {
    try {
      const options = await this.authService.startRegistration(body.sessionId, body.username);
      // 通知PC端已扫码
      this.eventsGateway.notifySessionUpdate(body.sessionId, SessionStatus.SCANNED);
      return options;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 手机端：完成注册
  @Post('register/finish')
  async finishRegistration(@Body() body: { sessionId: string; response: any }) {
    try {
      const result = await this.authService.finishRegistration(body.sessionId, body.response);
      // 通知PC端注册结果
      this.eventsGateway.notifySessionUpdate(
        body.sessionId,
        result.verified ? SessionStatus.SUCCESS : SessionStatus.FAILED,
        result.username,
      );
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 手机端：开始认证
  @Post('auth/start')
  async startAuthentication(@Body() body: { sessionId: string }) {
    try {
      const options = await this.authService.startAuthentication(body.sessionId);
      // 通知PC端已扫码
      this.eventsGateway.notifySessionUpdate(body.sessionId, SessionStatus.SCANNED);
      return options;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 手机端：完成认证
  @Post('auth/finish')
  async finishAuthentication(@Body() body: { sessionId: string; response: any }) {
    try {
      const result = await this.authService.finishAuthentication(body.sessionId, body.response);
      // 通知PC端认证结果
      this.eventsGateway.notifySessionUpdate(
        body.sessionId,
        result.verified ? SessionStatus.SUCCESS : SessionStatus.FAILED,
        result.username,
      );
      return result;
    } catch (error) {
      throw new HttpException(error.message, HttpStatus.BAD_REQUEST);
    }
  }

  // 获取所有用户
  @Get('users')
  async getAllUsers() {
    return this.authService.getAllUsers();
  }
}
