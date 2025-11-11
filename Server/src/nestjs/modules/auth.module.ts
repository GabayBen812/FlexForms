import { AuthController } from '../controllers/auth.controller';
import { UserModule } from './user.module';
import { AuthService } from '../services/auth.service';
import { Module } from '@nestjs/common';
import { AnalyticsModule } from './analytics.module';

@Module({
  imports: [UserModule, AnalyticsModule],
  controllers: [AuthController],
  providers: [AuthService],
})
export class AuthModule {}