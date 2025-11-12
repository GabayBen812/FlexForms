import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Contact, ContactSchema } from '../schemas/contact.schema';
import { ContactRelationship, ContactRelationshipSchema } from '../schemas/contact-relationship.schema';
import { ContactService } from '../services/contact.service';
import { ContactRelationshipService } from '../services/contact-relationship.service';
import { ContactController } from '../controllers/contact.controller';

import { Account, AccountSchema } from '../schemas/account.schema';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: ContactRelationship.name, schema: ContactRelationshipSchema },
      { name: Account.name, schema: AccountSchema },
    ]),
  ],
  controllers: [ContactController],
  providers: [ContactService, ContactRelationshipService],
  exports: [ContactService, ContactRelationshipService],
})
export class ContactModule {}


