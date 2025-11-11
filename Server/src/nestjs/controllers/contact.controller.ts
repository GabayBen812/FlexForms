import { Body, Controller, Delete, Get, Param, Post, Put, Query, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { ContactService, ContactSearchResult } from '../services/contact.service';
import { ContactRelationshipService } from '../services/contact-relationship.service';
import {
  CreateContactDto,
  CreateContactRelationshipForContactDto,
  UpdateContactDto,
} from '../dto/contact.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { FeatureFlagGuard } from '../middlewares/feature-flag.guard';
import { FeatureFlag } from '../middlewares/feature-flag.decorator';
import { ContactStatus, ContactType } from '../schemas/contact.schema';

const CONTACTS_FEATURE_FLAG = 'FF_CONTACTS_UNIFIED';

const toStringParam = (value?: string | string[]): string | undefined =>
  Array.isArray(value) ? value[0] : value;

@Controller('contacts')
@UseGuards(JwtAuthGuard, FeatureFlagGuard)
@FeatureFlag(CONTACTS_FEATURE_FLAG)
export class ContactController {
  constructor(
    private readonly contactService: ContactService,
    private readonly contactRelationshipService: ContactRelationshipService,
  ) {}

  @Get()
  async search(
    @Req() req: Request,
    @Query() query: Record<string, string | string[]>,
  ): Promise<ContactSearchResult> {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new Error('User organizationId not found');
    }

    const typeParam = toStringParam(query.type);
    const statusParam = toStringParam(query.status);
    const search = toStringParam(query.search);
    const limitParam = toStringParam(query.limit);
    const offsetParam = toStringParam(query.offset);

    const type = typeParam && Object.values(ContactType).includes(typeParam as ContactType)
      ? (typeParam as ContactType)
      : undefined;

    const status = statusParam && Object.values(ContactStatus).includes(statusParam as ContactStatus)
      ? (statusParam as ContactStatus)
      : undefined;

    const limit = limitParam ? Number(limitParam) : undefined;
    const offset = offsetParam ? Number(offsetParam) : undefined;

    const namespacedFieldFilters: Record<string, unknown> = {};
    Object.entries(query).forEach(([key, value]) => {
      if (key.startsWith('dynamicFields.')) {
        const fieldKey = key.replace('dynamicFields.', '');
        namespacedFieldFilters[fieldKey] = toStringParam(value);
      }
    });

    let dynamicFieldFilters: Record<string, unknown> = {};
    Object.entries(namespacedFieldFilters).forEach(([key, value]) => {
      if (!value) {
        return;
      }

      if (type === ContactType.PARENT || type === ContactType.KID) {
        const namespace = `${type}.`;
        const namespacedKey = key.startsWith(namespace) ? key : `${namespace}${key}`;
        dynamicFieldFilters[namespacedKey] = value;
      } else {
        dynamicFieldFilters[key] = value;
      }
    });

    return this.contactService.search({
      organizationId: user.organizationId,
      type,
      status,
      search,
      limit,
      offset,
      dynamicFieldFilters,
    });
  }

  @Get('relationships')
  async getRelationshipsBatch(@Query('contactIds') contactIdsParam?: string) {
    if (!contactIdsParam) {
      return [];
    }

    const contactIds = contactIdsParam
      .split(',')
      .map(id => id.trim())
      .filter(Boolean);

    if (!contactIds.length) {
      return [];
    }

    return this.contactRelationshipService.findByContacts(contactIds);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.contactService.findById(id);
  }

  @Post()
  async create(@Req() req: Request, @Body() createContactDto: CreateContactDto) {
    const user = req.user as { organizationId?: string };
    if (!user?.organizationId) {
      throw new Error('User organizationId not found');
    }

    createContactDto.organizationId = user.organizationId;

    return this.contactService.create(createContactDto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() updateContactDto: UpdateContactDto) {
    return this.contactService.update(id, updateContactDto);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    await this.contactRelationshipService.removeAllForContact(id);
    return this.contactService.remove(id);
  }

  @Get(':id/relationships')
  async getRelationships(@Param('id') id: string) {
    return this.contactRelationshipService.findByContact(id);
  }

  @Post(':id/relationships')
  async createRelationship(
    @Param('id') id: string,
    @Body() relationshipDto: CreateContactRelationshipForContactDto,
  ) {
    return this.contactRelationshipService.upsert({
      sourceContactId: id,
      targetContactId: relationshipDto.targetContactId,
      relation: relationshipDto.relation,
      note: relationshipDto.note,
      priority: relationshipDto.priority,
      startDate: relationshipDto.startDate,
      endDate: relationshipDto.endDate,
    });
  }

  @Delete(':id/relationships/:targetId')
  async removeRelationship(@Param('id') id: string, @Param('targetId') targetId: string) {
    await this.contactRelationshipService.removeByPair(id, targetId);
    return { success: true };
  }
}



