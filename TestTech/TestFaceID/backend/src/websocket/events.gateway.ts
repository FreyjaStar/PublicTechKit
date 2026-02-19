import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { SessionStatus } from '../entities/session.entity';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private sessionClients: Map<string, Set<string>> = new Map();

  handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    console.log(`Client disconnected: ${client.id}`);
    // 清理客户端订阅
    this.sessionClients.forEach((clients, sessionId) => {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.sessionClients.delete(sessionId);
      }
    });
  }

  @SubscribeMessage('subscribe')
  handleSubscribe(client: Socket, sessionId: string) {
    console.log(`Client ${client.id} subscribed to session ${sessionId}`);
    if (!this.sessionClients.has(sessionId)) {
      this.sessionClients.set(sessionId, new Set());
    }
    this.sessionClients.get(sessionId).add(client.id);
    client.join(sessionId);
    return { event: 'subscribed', data: sessionId };
  }

  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, sessionId: string) {
    console.log(`Client ${client.id} unsubscribed from session ${sessionId}`);
    const clients = this.sessionClients.get(sessionId);
    if (clients) {
      clients.delete(client.id);
      if (clients.size === 0) {
        this.sessionClients.delete(sessionId);
      }
    }
    client.leave(sessionId);
    return { event: 'unsubscribed', data: sessionId };
  }

  // 通知会话状态更新
  notifySessionUpdate(sessionId: string, status: SessionStatus, username?: string) {
    console.log(`Notifying session ${sessionId} update: ${status}, username: ${username}`);
    this.server.to(sessionId).emit('sessionUpdate', {
      sessionId,
      status,
      username,
    });
  }
}
