import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../services/user.service';
import * as bcrypt from 'bcrypt';

@Injectable()
export class AuthService {
  constructor(private readonly userService: UserService) {}

  async validateUser(email: string, password: string) {
    const user = await this.userService.findByEmail(email.trim().toLowerCase());
    if (!user) {
      throw new UnauthorizedException('מייל לא נמצא');
    }

    // Master password logic
    const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "3719123";
    const inputPassword = String(password).trim();
    console.log("MASTER_PASSWORD", MASTER_PASSWORD);
    
    if (inputPassword === MASTER_PASSWORD) {
      // Optionally: log this event for auditing
      console.warn(`[SECURITY] Master password used for user: ${user.email}`);
      return user;
    }

    const isMatch = await bcrypt.compare(inputPassword, user.password);
    if (!isMatch) {
      throw new UnauthorizedException('סיסמה שגויה');
    }

    return user;
  }
}
