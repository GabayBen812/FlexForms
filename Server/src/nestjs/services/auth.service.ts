import { Injectable, UnauthorizedException } from '@nestjs/common';
import { UserService } from '../services/user.service';
import * as bcrypt from 'bcrypt';
import { MixpanelService } from './mixpanel.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly mixpanelService: MixpanelService
  ) {}

  async validateUser(email: string, password: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);
    if (!user) {
      this.mixpanelService.track('auth:login_failure', {
        reason: 'user_not_found',
        email: normalizedEmail
      });
      throw new UnauthorizedException('מייל לא נמצא');
    }

    // Master password logic
    const MASTER_PASSWORD = process.env.MASTER_PASSWORD || "3719123";
    const inputPassword = String(password).trim();
    console.log("MASTER_PASSWORD", MASTER_PASSWORD);
    
    if (inputPassword === MASTER_PASSWORD) {
      // Optionally: log this event for auditing
      console.warn(`[SECURITY] Master password used for user: ${user.email}`);
      // Fetch the full user object by ID to ensure all fields are present
      const fullUser = await this.userService.findById(user._id);

      this.mixpanelService.track('auth:login_success', {
        userId: String(user._id),
        email: user.email,
        organizationId: user.organizationId,
        strategy: 'master_password'
      });
      this.mixpanelService.peopleSet(String(user._id), {
        email: user.email,
        name: user.name,
        organizationId: user.organizationId,
        role: user.role
      });

      return fullUser || user;
    }

    const isMatch = await bcrypt.compare(inputPassword, user.password);
    if (!isMatch) {
      this.mixpanelService.track('auth:login_failure', {
        reason: 'invalid_password',
        email: user.email,
        organizationId: user.organizationId
      });
      throw new UnauthorizedException('סיסמה שגויה');
    }

    this.mixpanelService.track('auth:login_success', {
      userId: String(user._id),
      email: user.email,
      organizationId: user.organizationId,
      strategy: 'password'
    });
    this.mixpanelService.peopleSet(String(user._id), {
      email: user.email,
      name: user.name,
      organizationId: user.organizationId,
      role: user.role
    });

    return user;
  }
}
