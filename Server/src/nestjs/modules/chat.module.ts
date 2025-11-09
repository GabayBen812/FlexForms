import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { ChatGroup, ChatGroupSchema } from '../schemas/chat-group.schema';
import { ChatMessage, ChatMessageSchema } from '../schemas/chat-message.schema';
import { ChatController } from '../controllers/chat.controller';
import { ChatService } from '../services/chat.service';
import { ChatGateway } from '../gateways/chat.gateway';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: ChatGroup.name, schema: ChatGroupSchema },
      { name: ChatMessage.name, schema: ChatMessageSchema },
    ]),
  ],
  controllers: [ChatController],
  providers: [ChatService, ChatGateway],
  exports: [ChatService],
})
export class ChatModule {}


