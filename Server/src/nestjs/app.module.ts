import { Module } from '@nestjs/common';
import { MongooseModule } from '@nestjs/mongoose';
import { AuthController } from './controllers/auth.controller';
import { UserModule } from './modules/user.module';
import { AuthService } from './services/auth.service';
import * as dotenv from 'dotenv';
import { FormModule } from './modules/form.module';
import { RequestModule } from './modules/request.moudle';
import { AuthModule } from './modules/auth.module';
import { OrganizationModule } from './modules/organization.module';
import { PaymentModule } from './modules/payment.module';
import { RegistrationModule } from './modules/registration.module';
import { clubModule } from './modules/club.moudle';
import { FeatureFlagModule } from './modules/feature-flag.module';
import { RoomModule } from './modules/room.module';
import { KidModule } from './modules/kid.module';
import { HealthController } from './controllers/health.controller';
dotenv.config();
@Module({
  imports: [
    MongooseModule.forRoot((process.env.MONGODB_URI || '').trim()),
    AuthModule,
    FormModule,
    RequestModule,
    UserModule,
    OrganizationModule,
    PaymentModule,
    RegistrationModule,
    clubModule,
    FeatureFlagModule,
    RoomModule,
    KidModule
  ],
  controllers: [AuthController, HealthController],
  providers: [AuthService],
})
export class AppModule {}
