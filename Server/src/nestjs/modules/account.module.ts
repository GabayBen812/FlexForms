import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AccountsController } from '../controllers/accounts.controller';
import { AccountsService } from '../services/accounts.service';
import { Account, AccountSchema } from '../schemas/account.schema';

@Module({
  imports: [MongooseModule.forFeature([{ name: Account.name, schema: AccountSchema }])],
  controllers: [AccountsController],
  providers: [AccountsService],
  exports: [AccountsService],
})
export class AccountModule {}

