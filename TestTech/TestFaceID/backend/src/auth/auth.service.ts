import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import {
  generateRegistrationOptions,
  verifyRegistrationResponse,
  generateAuthenticationOptions,
  verifyAuthenticationResponse,
} from '@simplewebauthn/server';
import { User } from '../entities/user.entity';
import { Session, SessionType, SessionStatus } from '../entities/session.entity';
import { v4 as uuidv4 } from 'uuid';

const RP_NAME = 'FaceID Demo';
const RP_ID = process.env.RP_ID || 'faceid.leadisle.cn';
const ORIGIN = process.env.ORIGIN || 'https://faceid.leadisle.cn';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Session)
    private sessionRepository: Repository<Session>,
  ) {}

  // 创建注册会话（生成二维码用）
  async createRegisterSession(): Promise<Session> {
    const session = this.sessionRepository.create({
      id: uuidv4(),
      type: SessionType.REGISTER,
      status: SessionStatus.PENDING,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000), // 5分钟过期
    });
    return this.sessionRepository.save(session);
  }

  // 创建认证会话（生成二维码用）
  async createAuthSession(): Promise<Session> {
    const session = this.sessionRepository.create({
      id: uuidv4(),
      type: SessionType.AUTH,
      status: SessionStatus.PENDING,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    });
    return this.sessionRepository.save(session);
  }

  // 获取会话状态
  async getSession(sessionId: string): Promise<Session | null> {
    return this.sessionRepository.findOne({ where: { id: sessionId } });
  }

  // 更新会话状态
  async updateSessionStatus(sessionId: string, status: SessionStatus, username?: string): Promise<void> {
    await this.sessionRepository.update(sessionId, { status, username });
  }

  // 开始注册流程（手机端调用）
  async startRegistration(sessionId: string, username: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session || session.type !== SessionType.REGISTER) {
      throw new Error('Invalid session');
    }
    if (new Date() > session.expiresAt) {
      throw new Error('Session expired');
    }

    // 检查用户名是否已存在
    const existingUser = await this.userRepository.findOne({ where: { username } });
    if (existingUser && existingUser.credentialId) {
      throw new Error('Username already registered');
    }

    // 创建或获取用户
    let user = existingUser;
    if (!user) {
      user = this.userRepository.create({ id: uuidv4(), username });
      await this.userRepository.save(user);
    }

    const options = await generateRegistrationOptions({
      rpName: RP_NAME,
      rpID: RP_ID,
      userID: new TextEncoder().encode(user.id),
      userName: username,
      attestationType: 'none',
      authenticatorSelection: {
        residentKey: 'required',
        userVerification: 'required',
        authenticatorAttachment: 'platform',
        requireResidentKey: true,
      },
    });

    // 保存 challenge 到会话
    await this.sessionRepository.update(sessionId, {
      challenge: options.challenge,
      userId: user.id,
      username: username,
      status: SessionStatus.SCANNED,
    });

    return options;
  }

  // 完成注册（手机端调用）
  async finishRegistration(sessionId: string, response: any) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session || !session.challenge || !session.userId) {
      throw new Error('Invalid session');
    }

    const verification = await verifyRegistrationResponse({
      response,
      expectedChallenge: session.challenge,
      expectedOrigin: ORIGIN,
      expectedRPID: RP_ID,
    });

    if (verification.verified && verification.registrationInfo) {
      const { credential } = verification.registrationInfo;
      
      // 直接使用 response.id（浏览器发送的 base64url 编码的凭证ID）
      // 这样认证时可以直接匹配
      await this.userRepository.update(session.userId, {
        credentialId: response.id,
        publicKey: Buffer.from(credential.publicKey).toString('base64'),
        counter: credential.counter,
        transports: JSON.stringify(response.response.transports || []),
      });

      await this.sessionRepository.update(sessionId, {
        status: SessionStatus.SUCCESS,
      });

      return { verified: true, username: session.username };
    }

    await this.sessionRepository.update(sessionId, {
      status: SessionStatus.FAILED,
    });

    return { verified: false };
  }

  // 开始认证流程（手机端调用）
  async startAuthentication(sessionId: string) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session || session.type !== SessionType.AUTH) {
      throw new Error('Invalid session');
    }
    if (new Date() > session.expiresAt) {
      throw new Error('Session expired');
    }

    // 使用空的 allowCredentials，让设备自动发现本地保存的 Passkey
    const options = await generateAuthenticationOptions({
      rpID: RP_ID,
      userVerification: 'required',
      // 不传 allowCredentials，iOS 会显示所有为此域名保存的 Passkey
    });

    await this.sessionRepository.update(sessionId, {
      challenge: options.challenge,
      status: SessionStatus.SCANNED,
    });

    return options;
  }

  // 完成认证（手机端调用）
  async finishAuthentication(sessionId: string, response: any) {
    const session = await this.sessionRepository.findOne({ where: { id: sessionId } });
    if (!session || !session.challenge) {
      throw new Error('Invalid session');
    }

    // 查找对应的用户 - response.id 是 base64url 编码的凭证ID
    const credentialId = response.id;
    console.log('Looking for credentialId:', credentialId);
    
    // 获取所有用户并打印凭证ID进行对比
    const allUsers = await this.userRepository.find();
    console.log('All users credentials:', allUsers.map(u => ({ username: u.username, credentialId: u.credentialId })));
    
    // 尝试直接匹配
    let user = await this.userRepository.findOne({
      where: { credentialId },
    });
    
    // 如果直接匹配失败，尝试遍历查找
    if (!user) {
      user = allUsers.find(u => u.credentialId === credentialId);
    }

    if (!user) {
      console.log('User not found for credentialId:', credentialId);
      await this.sessionRepository.update(sessionId, {
        status: SessionStatus.FAILED,
      });
      return { verified: false, error: 'User not found' };
    }
    
    console.log('Found user:', user.username);

    try {
      const verification = await verifyAuthenticationResponse({
        response,
        expectedChallenge: session.challenge,
        expectedOrigin: ORIGIN,
        expectedRPID: RP_ID,
        credential: {
          id: user.credentialId,
          publicKey: Buffer.from(user.publicKey, 'base64'),
          counter: user.counter,
          transports: user.transports ? JSON.parse(user.transports) : undefined,
        },
      });

      if (verification.verified) {
        // 更新计数器
        await this.userRepository.update(user.id, {
          counter: verification.authenticationInfo.newCounter,
        });

        await this.sessionRepository.update(sessionId, {
          status: SessionStatus.SUCCESS,
          username: user.username,
        });

        return { verified: true, username: user.username };
      }
    } catch (error) {
      console.error('Authentication error:', error);
    }

    await this.sessionRepository.update(sessionId, {
      status: SessionStatus.FAILED,
    });

    return { verified: false };
  }

  // 获取所有用户（用于调试）
  async getAllUsers() {
    return this.userRepository.find({
      select: ['id', 'username', 'createdAt'],
    });
  }
}
