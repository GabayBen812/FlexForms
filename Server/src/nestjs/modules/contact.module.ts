import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Contact, ContactSchema } from '../schemas/contact.schema';
import { ContactRelationship, ContactRelationshipSchema } from '../schemas/contact-relationship.schema';
import { ContactService } from '../services/contact.service';
import { ContactRelationshipService } from '../services/contact-relationship.service';
import { ContactController } from '../controllers/contact.controller';

@Module({
  imports: [
    MongooseModule.forFeature([
      { name: Contact.name, schema: ContactSchema },
      { name: ContactRelationship.name, schema: ContactRelationshipSchema },
    ]),
  ],
  controllers: [ContactController],
  providers: [ContactService, ContactRelationshipService],
  exports: [ContactService, ContactRelationshipService],
})
export class ContactModule {}


