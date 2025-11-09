import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { FilterQuery, Model, Types } from 'mongoose';
import { CreateChatGroupDto, SendChatMessageDto, UpdateChatGroupDto } from '../dto/chat.dto';
import {
  ChatGroup,
  ChatGroupDocument,
} from '../schemas/chat-group.schema';
import {
  ChatMessage,
  ChatMessageDocument,
} from '../schemas/chat-message.schema';

export interface ChatGroupView {
  id: string;
  name: string;
  organizationId: string;
  memberIds: string[];
  createdBy: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface ChatMessageView {
  id: string;
  groupId: string;
  senderId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  readBy: string[];
}

export interface UpdatedGroupResult {
  group: ChatGroupView;
  previousMemberIds: string[];
}

@Injectable()
export class ChatService {
  constructor(
    @InjectModel(ChatGroup.name)
    private readonly chatGroupModel: Model<ChatGroupDocument>,
    @InjectModel(ChatMessage.name)
    private readonly chatMessageModel: Model<ChatMessageDocument>,
  ) {}

  async createGroup(
    dto: CreateChatGroupDto,
    organizationId: string,
    creatorId: string,
  ): Promise<UpdatedGroupResult> {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Group name is required.');
    }

    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );
    const creatorObjectId = this.toObjectId(creatorId, 'creatorId');

    const memberIds = this.normalizeMemberIds(
      dto.memberIds ?? [],
      creatorId,
    );

    const group = await this.chatGroupModel.create({
      name,
      organizationId: organizationObjectId,
      memberIds: memberIds.map((id) => this.toObjectId(id, 'memberIds')),
      createdBy: creatorObjectId,
    });

    const mapped = this.mapGroup(group.toObject());

    return {
      group: mapped,
      previousMemberIds: [],
    };
  }

  async findGroupsForUser(
    userId: string,
    organizationId: string,
  ): Promise<ChatGroupView[]> {
    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );
    const userObjectId = this.toObjectId(userId, 'userId');

    const groups = await this.chatGroupModel
      .find({
        organizationId: organizationObjectId,
        memberIds: userObjectId,
        isArchived: false,
      })
      .sort({ updatedAt: -1 })
      .lean();

    return groups.map((group) => this.mapGroup(group));
  }

  async findGroupIdsForUser(
    userId: string,
    organizationId: string,
  ): Promise<string[]> {
    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );
    const userObjectId = this.toObjectId(userId, 'userId');

    const groups = await this.chatGroupModel
      .find({
        organizationId: organizationObjectId,
        memberIds: userObjectId,
        isArchived: false,
      })
      .select({ _id: 1 })
      .lean();

    return groups.map((group) => group._id.toString());
  }

  async getGroupById(
    groupId: string,
    organizationId: string,
    requesterId: string,
  ): Promise<ChatGroupView> {
    const group = await this.ensureGroupAccess(
      groupId,
      organizationId,
      requesterId,
    );
    return this.mapGroup(group.toObject());
  }

  async updateGroup(
    groupId: string,
    dto: UpdateChatGroupDto,
    organizationId: string,
    requesterId: string,
  ): Promise<UpdatedGroupResult> {
    const group = await this.ensureGroupAccess(
      groupId,
      organizationId,
      requesterId,
    );

    const previousMemberIds = group.memberIds.map((id) => id.toString());

    if (dto.name) {
      const name = dto.name.trim();
      if (!name) {
        throw new BadRequestException('Group name is required.');
      }
      group.name = name;
    }

    if (dto.memberIds) {
      const memberIds = this.normalizeMemberIds(
        dto.memberIds,
        requesterId,
      );

      if (memberIds.length === 0) {
        throw new BadRequestException('Group must have at least one member.');
      }

      group.memberIds = memberIds.map((id) =>
        this.toObjectId(id, 'memberIds'),
      );
    }

    const updated = await group.save();

    return {
      group: this.mapGroup(updated.toObject()),
      previousMemberIds,
    };
  }

  async archiveGroup(
    groupId: string,
    organizationId: string,
    requesterId: string,
  ): Promise<UpdatedGroupResult> {
    const group = await this.ensureGroupAccess(
      groupId,
      organizationId,
      requesterId,
    );

    const previousMemberIds = group.memberIds.map((id) => id.toString());

    if (group.isArchived) {
      return {
        group: this.mapGroup(group.toObject()),
        previousMemberIds,
      };
    }

    group.isArchived = true;
    const updated = await group.save();

    return {
      group: this.mapGroup(updated.toObject()),
      previousMemberIds,
    };
  }

  async createMessage(
    dto: SendChatMessageDto,
    organizationId: string,
    senderId: string,
  ): Promise<ChatMessageView> {
    const group = await this.ensureGroupAccess(
      dto.groupId,
      organizationId,
      senderId,
    );
    const senderObjectId = this.toObjectId(senderId, 'senderId');

    const content = this.normalizeMessageContent(dto.content);

    const message = await this.chatMessageModel.create({
      groupId: group._id,
      senderId: senderObjectId,
      content,
      readBy: [senderObjectId],
    });

    const messageObject = message.toObject();
    const createdAt =
      (message as any).createdAt ??
      (messageObject as { createdAt?: Date }).createdAt ??
      new Date();

    await this.chatGroupModel
      .updateOne(
        { _id: group._id },
        { $set: { updatedAt: createdAt } },
      )
      .exec();

    return this.mapMessage({
      ...messageObject,
      createdAt,
      updatedAt:
        (message as any).updatedAt ??
        (messageObject as { updatedAt?: Date }).updatedAt ??
        createdAt,
    });
  }

  async getMessages(
    groupId: string,
    organizationId: string,
    requesterId: string,
    options?: {
      limit?: number;
      beforeId?: string;
    },
  ): Promise<{ messages: ChatMessageView[]; hasMore: boolean }> {
    const group = await this.ensureGroupAccess(
      groupId,
      organizationId,
      requesterId,
    );

    const limit = Math.min(Math.max(options?.limit ?? 50, 1), 100);

    const filter: FilterQuery<ChatMessageDocument> = {
      groupId: group._id,
    };

    if (options?.beforeId) {
      const beforeObjectId = this.toObjectId(options.beforeId, 'beforeId');
      const cursorMessage = await this.chatMessageModel
        .findOne({
          _id: beforeObjectId,
          groupId: group._id,
        })
        .select({ createdAt: 1 })
        .lean<{ createdAt: Date }>();

      if (cursorMessage?.createdAt) {
        filter.createdAt = { $lt: cursorMessage.createdAt };
      }
    }

    const messages = await this.chatMessageModel
      .find(filter)
      .sort({ createdAt: -1 })
      .limit(limit + 1)
      .lean();

    const hasMore = messages.length > limit;
    const trimmed = hasMore ? messages.slice(0, limit) : messages;

    return {
      messages: trimmed.reverse().map((message) => this.mapMessage(message)),
      hasMore,
    };
  }

  private normalizeMemberIds(
    memberIds: string[],
    requesterId: string,
  ): string[] {
    const normalized = new Set<string>();
    [...memberIds, requesterId].forEach((id) => {
      normalized.add(id);
    });
    return Array.from(normalized);
  }

  private normalizeMessageContent(content: string): string {
    const normalized = content.trim();
    if (!normalized) {
      throw new BadRequestException('Message content is required.');
    }
    return normalized;
  }

  private mapGroup(group: any): ChatGroupView {
    const plain =
      typeof group?.toObject === 'function' ? group.toObject() : group;

    return {
      id: plain._id.toString(),
      name: plain.name,
      organizationId: plain.organizationId.toString(),
      memberIds: (plain.memberIds ?? []).map((id: Types.ObjectId | string) =>
        id.toString(),
      ),
      createdBy: plain.createdBy.toString(),
      isArchived: plain.isArchived ?? false,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
    };
  }

  private mapMessage(message: any): ChatMessageView {
    const plain =
      typeof message?.toObject === 'function' ? message.toObject() : message;

    return {
      id: plain._id.toString(),
      groupId: plain.groupId.toString(),
      senderId: plain.senderId.toString(),
      content: plain.content,
      createdAt: plain.createdAt,
      updatedAt: plain.updatedAt,
      readBy: (plain.readBy ?? []).map((id: Types.ObjectId | string) =>
        id.toString(),
      ),
    };
  }

  private async ensureGroupAccess(
    groupId: string,
    organizationId: string,
    userId: string,
  ): Promise<ChatGroupDocument> {
    const organizationObjectId = this.toObjectId(
      organizationId,
      'organizationId',
    );
    const groupObjectId = this.toObjectId(groupId, 'groupId');
    const userObjectId = this.toObjectId(userId, 'userId');

    const group = await this.chatGroupModel.findOne({
      _id: groupObjectId,
      organizationId: organizationObjectId,
      isArchived: false,
    });

    if (!group) {
      throw new NotFoundException('Chat group not found.');
    }

    const isMember = group.memberIds.some((memberId) =>
      memberId.equals(userObjectId),
    );

    if (!isMember) {
      throw new ForbiddenException('You are not a member of this group.');
    }

    return group;
  }

  private toObjectId(value: string, fieldName: string): Types.ObjectId {
    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException(`Invalid ${fieldName}.`);
    }
    return new Types.ObjectId(value);
  }
}


