import { Injectable, UnauthorizedException, BadRequestException, NotFoundException } from '@nestjs/common';
import { UserService } from '../services/user.service';
import * as bcrypt from 'bcrypt';
import { MixpanelService } from './mixpanel.service';
import { EmailService } from './email.service';
import * as crypto from 'crypto';

@Injectable()
export class AuthService {
  constructor(
    private readonly userService: UserService,
    private readonly mixpanelService: MixpanelService,
    private readonly emailService: EmailService
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

  async requestPasswordReset(email: string): Promise<void> {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.userService.findByEmail(normalizedEmail);

    // Don't reveal if user exists or not for security
    if (!user) {
      return;
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpires = new Date();
    resetExpires.setHours(resetExpires.getHours() + 1); // Token expires in 1 hour

    // Save token to user
    await this.userService.updateUser(String(user._id), {
      passwordResetToken: resetToken,
      passwordResetExpires: resetExpires,
    } as any);

    // Generate reset URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const resetUrl = `${frontendUrl}/reset-password?token=${resetToken}`;

    // Send email
    await this.emailService.sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetToken,
      resetUrl,
      language: 'he', // Default to Hebrew, can be made dynamic based on user preference
    });
  }

  async resetPassword(token: string, newPassword: string): Promise<void> {
    const user = await this.userService.findByPasswordResetToken(token);

    if (!user || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid or expired reset token');
    }

    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException('Reset token has expired');
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await this.userService.updateUser(String(user._id), {
      password: hashedPassword,
      passwordResetToken: undefined,
      passwordResetExpires: undefined,
    } as any);
  }
}
