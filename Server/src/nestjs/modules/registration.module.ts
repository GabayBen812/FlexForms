import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { Registration, RegistrationSchema } from '../schemas/registration.schema';
import { RegistrationService } from '../services/registration.service';
import { RegistrationController } from '../controllers/registration.controller';
import { EmailModule } from './email.module';
import { FormModule } from './form.module';
import { UserModule } from './user.module';

@Module({
  imports: [
    MongooseModule.forFeature([{ name: Registration.name, schema: RegistrationSchema }]),
    EmailModule,
    FormModule,
    UserModule
  ],
  providers: [RegistrationService],
  controllers: [RegistrationController],
  exports: [RegistrationService],
})
export class RegistrationModule {}
