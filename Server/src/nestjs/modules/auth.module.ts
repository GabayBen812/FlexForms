import { AuthController } from '../controllers/auth.controller';
import { UserModule } from './user.module';
import { AuthService } from '../services/auth.service';
import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics.module';
import { EmailModule } from './email.module';

@Module({
  imports: [UserModule, AnalyticsModule, EmailModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}