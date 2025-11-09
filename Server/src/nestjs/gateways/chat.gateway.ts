import {
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import * as jwt from 'jsonwebtoken';
import {
  ChatMessageView,
  ChatService,
  ChatGroupView,
} from '../services/chat.service';
import { SendChatMessageDto } from '../dto/chat.dto';

interface DecodedToken {
  UserInfo: {
    id: string;
    email: string;
    organizationId?: string;
    name?: string;
  };
}

interface GatewayUser {
  id: string;
  organizationId: string;
}

interface SendMessagePayload {
  groupId: string;
  content: string;
}

@Injectable()
@WebSocketGateway({
  namespace: '/chat',
  cors: {
    origin: true,
    credentials: true,
  },
})
export class ChatGateway
  implements OnGatewayConnection, OnGatewayDisconnect
{
  @WebSocketServer()
  server!: Server;

  private readonly logger = new Logger(ChatGateway.name);
  private readonly userSockets = new Map<string, Set<Socket>>();

  constructor(private readonly chatService: ChatService) {}

  async handleConnection(client: Socket): Promise<void> {
    try {
      const user = await this.authenticate(client);
      client.data.user = user;
      this.registerSocket(user.id, client);

      const groupIds = await this.chatService.findGroupIdsForUser(
        user.id,
        user.organizationId,
      );

      groupIds.forEach((groupId) => client.join(groupId));
      client.emit('connection:ready', { groupIds });
    } catch (error) {
      const reason =
        error instanceof Error ? error.message : String(error ?? 'Unknown error');
      this.logger.warn(
        `Disconnecting socket due to authentication failure: ${reason}`,
      );
      client.disconnect(true);
    }
  }

  handleDisconnect(client: Socket): void {
    const user: GatewayUser | undefined = client.data.user;
    if (!user) {
      return;
    }
    this.unregisterSocket(user.id, client);
  }

  @SubscribeMessage('message:send')
  async handleMessageSend(
    @ConnectedSocket() client: Socket,
    @MessageBody() payload: SendMessagePayload,
  ): Promise<void> {
    const user: GatewayUser | undefined = client.data.user;
    if (!user) {
      throw new UnauthorizedException('Unauthenticated socket');
    }

    const dto: SendChatMessageDto = {
      groupId: payload.groupId,
      content: payload.content,
    };

    const message = await this.chatService.createMessage(
      dto,
      user.organizationId,
      user.id,
    );

    client.join(message.groupId);
    this.emitMessage(message);
  }

  emitMessage(message: ChatMessageView): void {
    this.server.to(message.groupId).emit('message:new', message);
  }

  handleGroupMutation(
    group: ChatGroupView,
    previousMemberIds: string[],
  ): void {
    const groupId = group.id;

    if (group.isArchived) {
      this.server.to(groupId).emit('group:updated', group);
      previousMemberIds.forEach((memberId) =>
        this.removeUserFromGroup(memberId, groupId),
      );
      return;
    }

    const previousMembers = new Set(previousMemberIds);
    const nextMembers = new Set(group.memberIds);

    group.memberIds.forEach((memberId) => {
      this.addUserToGroup(memberId, groupId);
    });

    previousMembers.forEach((memberId) => {
      if (!nextMembers.has(memberId)) {
        this.removeUserFromGroup(memberId, groupId);
      }
    });

    this.server.to(groupId).emit('group:updated', group);
  }

  private async authenticate(client: Socket): Promise<GatewayUser> {
    const token = this.extractToken(client);
    if (!token) {
      throw new UnauthorizedException('Missing token');
    }

    const secret = process.env.ACCESS_TOKEN_SECRET;
    if (!secret) {
      throw new UnauthorizedException('Missing secret');
    }

    const decoded = jwt.verify(token, secret) as DecodedToken;

    const userId = decoded?.UserInfo?.id;
    const organizationId = decoded?.UserInfo?.organizationId;

    if (!userId || !organizationId) {
      throw new UnauthorizedException('Invalid token payload');
    }

    return {
      id: userId,
      organizationId,
    };
  }

  private extractToken(client: Socket): string | null {
    const authToken =
      (client.handshake.auth?.token as string | undefined) ??
      (client.handshake.query?.token as string | undefined) ??
      (client.handshake.headers?.authorization as string | undefined);

    if (!authToken) {
      return null;
    }

    if (authToken.startsWith('Bearer ')) {
      return authToken.slice(7);
    }

    return authToken;
  }

  private registerSocket(userId: string, socket: Socket): void {
    const sockets = this.userSockets.get(userId) ?? new Set<Socket>();
    sockets.add(socket);
    this.userSockets.set(userId, sockets);
  }

  private unregisterSocket(userId: string, socket: Socket): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) {
      return;
    }
    sockets.delete(socket);
    if (sockets.size === 0) {
      this.userSockets.delete(userId);
    }
  }

  private addUserToGroup(userId: string, groupId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) {
      return;
    }

    sockets.forEach((socket) => {
      socket.join(groupId);
    });
  }

  private removeUserFromGroup(userId: string, groupId: string): void {
    const sockets = this.userSockets.get(userId);
    if (!sockets) {
      return;
    }

    sockets.forEach((socket) => {
      socket.leave(groupId);
    });
  }
}


