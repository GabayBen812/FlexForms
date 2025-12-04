import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { Request } from 'express';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import {
  CreateChatGroupDto,
  SendChatMessageDto,
  UpdateChatGroupDto,
} from '../dto/chat.dto';
import { ChatService } from '../services/chat.service';
import { ChatGateway } from '../gateways/chat.gateway';

interface RequestUser {
  id: string;
  organizationId?: string;
  role?: string;
}

@Controller('chat')
@UseGuards(JwtAuthGuard)
export class ChatController {
  constructor(
    private readonly chatService: ChatService,
    private readonly chatGateway: ChatGateway,
  ) {}

  @Get('groups')
  async getGroups(@Req() req: Request) {
    const user = this.getUserFromRequest(req);
    return this.chatService.findGroupsForUser(user.id, user.organizationId);
  }

  @Get('groups/:groupId')
  async getGroup(
    @Param('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const user = this.getUserFromRequest(req);
    return this.chatService.getGroupById(
      groupId,
      user.organizationId,
      user.id,
    );
  }

  @Post('groups')
  async createGroup(
    @Body() dto: CreateChatGroupDto,
    @Req() req: Request,
  ) {
    const user = this.getUserFromRequest(req);
    const result = await this.chatService.createGroup(
      dto,
      user.organizationId,
      user.id,
    );

    this.chatGateway.handleGroupMutation(result.group, result.previousMemberIds);

    return result.group;
  }

  @Patch('groups/:groupId')
  async updateGroup(
    @Param('groupId') groupId: string,
    @Body() dto: UpdateChatGroupDto,
    @Req() req: Request,
  ) {
    const user = this.getUserFromRequest(req);
    const result = await this.chatService.updateGroup(
      groupId,
      dto,
      user.organizationId,
      user.id,
    );

    this.chatGateway.handleGroupMutation(result.group, result.previousMemberIds);

    return result.group;
  }

  @Delete('groups/:groupId')
  async archiveGroup(
    @Param('groupId') groupId: string,
    @Req() req: Request,
  ) {
    const user = this.getUserFromRequest(req);
    const result = await this.chatService.archiveGroup(
      groupId,
      user.organizationId,
      user.id,
    );

    this.chatGateway.handleGroupMutation(result.group, result.previousMemberIds);

    return result.group;
  }

  @Get('groups/:groupId/messages')
  async getMessages(
    @Param('groupId') groupId: string,
    @Req() req: Request,
    @Query('limit') limit?: string,
    @Query('beforeId') beforeId?: string,
  ) {
    const user = this.getUserFromRequest(req);
    const parsedLimit = limit ? Number(limit) : undefined;
    if (parsedLimit !== undefined && Number.isNaN(parsedLimit)) {
      throw new BadRequestException('limit must be a number');
    }
    return this.chatService.getMessages(groupId, user.organizationId, user.id, {
      limit: parsedLimit,
      beforeId,
    });
  }

  @Post('groups/:groupId/messages')
  async sendMessage(
    @Param('groupId') groupId: string,
    @Body() dto: SendChatMessageDto,
    @Req() req: Request,
  ) {
    const user = this.getUserFromRequest(req);
    const payload: SendChatMessageDto = {
      groupId,
      content: dto.content,
    };

    const message = await this.chatService.createMessage(
      payload,
      user.organizationId,
      user.id,
      user.role,
    );

    this.chatGateway.emitMessage(message);

    return message;
  }

  private getUserFromRequest(req: Request): RequestUser & { id: string; organizationId: string } {
    const user = req.user as RequestUser | undefined;
    if (!user?.organizationId) {
      throw new BadRequestException('User organizationId not found');
    }
    if (!user.id) {
      throw new BadRequestException('User id not found');
    }
    return {
      id: user.id,
      organizationId: user.organizationId,
      role: user.role,
    };
  }
}


