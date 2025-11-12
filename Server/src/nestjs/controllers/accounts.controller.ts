import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  Query,
  Req,
  UseGuards,
} from '@nestjs/common';
import { AccountsService } from '../services/accounts.service';
import { CreateAccountDto, UpdateAccountDto } from '../dto/account.dto';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('accounts')
@UseGuards(JwtAuthGuard)
export class AccountsController {
  constructor(private readonly accountsService: AccountsService) {}

  @Post()
  create(@Body() createAccountDto: CreateAccountDto, @Req() req: Request) {
    const user = req.user as { organizationId?: string } | undefined;
    if (user && user.organizationId) {
      createAccountDto.organizationId = user.organizationId;
    } else {
      console.error('User organizationId not found');
      throw new Error('User organizationId not found');
    }
    return this.accountsService.create(createAccountDto);
  }

  @Get()
  findAll(@Req() req: Request, @Query() query: Record<string, any>) {
    const user = req.user as { organizationId?: string } | undefined;
    if (!user?.organizationId) {
      throw new Error('User organizationId not found');
    }
    return this.accountsService.findAll(user.organizationId, query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.accountsService.findOne(id);
  }

  @Put(':id')
  update(@Param('id') id: string, @Body() updateAccountDto: UpdateAccountDto) {
    return this.accountsService.update(id, updateAccountDto);
  }

  @Delete(':id')
  remove(@Param('id') id: string) {
    return this.accountsService.remove(id);
  }
}

