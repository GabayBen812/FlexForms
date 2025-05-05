import { AuthController } from '../controllers/auth.controller';
import { UserModule } from './user.module';
import { AuthService } from '../services/auth.service';
import { Module } from '@nestjs/common';


@Module({
    imports: [UserModule],
    controllers: [AuthController],
    providers: [AuthService],
  })
  export class AuthModule {}
  