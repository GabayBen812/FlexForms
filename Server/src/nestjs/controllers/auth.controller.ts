import { Controller, Post, Body, Res, Get, Req, UseGuards, BadRequestException, NotFoundException } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { UserService } from '../services/user.service';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService
  ) {}

  @Post('login')
  async login(@Body() body: any, @Res() res: Response) {
    const { email, password } = body;
  
    const user = await this.authService.validateUser(email, password);
  
    const token = jwt.sign(
      {
        UserInfo: {
          id: user._id,
          email: user.email,
          organizationId: user.organizationId,
          role: user.role,
          name: user.name,
        },
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '2h' }
    );
    
    const isProd = process.env.NODE_ENV === 'production';
    
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd ? true : false,
      path: '/',
      maxAge: 1000 * 60 * 60 * 2,
    });
  
    return res.status(200).json({ status: 200, message: 'התחברת בהצלחה' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  getUser(@Req() req: ExpressRequest) {
    return req.user;
  }

  @Post('logout')
  logout(@Res() res: Response) {
    res.clearCookie('jwt', {
      httpOnly: true,
      sameSite: 'none',
      secure: true,
    });
    
    return res.status(200).json({ status: 200, message: 'התנתקת בהצלחה' });
  }

  @UseGuards(JwtAuthGuard)
  @Post('switch-organization')
  async switchOrganization(@Body() body: { organizationId: string }, @Req() req: ExpressRequest, @Res() res: Response) {
    const currentUser = req.user as any;
    
    // Validate current user is system_admin
    if (currentUser?.role !== 'system_admin') {
      throw new BadRequestException('Only system_admin users can switch organizations');
    }

    const { organizationId } = body;
    if (!organizationId) {
      throw new BadRequestException('organizationId is required');
    }

    // Find system_admin user in target organization
    const targetUser = await this.userService.findSystemAdminByOrganization(organizationId);
    
    if (!targetUser) {
      throw new NotFoundException('No system_admin user found in the specified organization');
    }

    // Create new JWT token for target user
    const token = jwt.sign(
      {
        UserInfo: {
          id: targetUser._id,
          email: targetUser.email,
          organizationId: targetUser.organizationId,
          role: targetUser.role,
          name: targetUser.name,
        },
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '2h' }
    );
    
    const isProd = process.env.NODE_ENV === 'production';
    
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: isProd ? 'none' : 'lax',
      secure: isProd ? true : false,
      path: '/',
      maxAge: 1000 * 60 * 60 * 2,
    });

    return res.status(200).json({ status: 200, message: 'Switched organization successfully' });
  }

  @Post('forgot-password')
  async forgotPassword(@Body() body: { email: string }) {
    const { email } = body;
    if (!email) {
      throw new BadRequestException('Email is required');
    }

    await this.authService.requestPasswordReset(email);
    
    // Always return success to prevent email enumeration
    return { 
      status: 200, 
      message: 'If an account exists with this email, a password reset link has been sent.' 
    };
  }

  @Post('reset-password')
  async resetPassword(@Body() body: { token: string; password: string }) {
    const { token, password } = body;
    
    if (!token || !password) {
      throw new BadRequestException('Token and password are required');
    }

    if (password.length < 6) {
      throw new BadRequestException('Password must be at least 6 characters long');
    }

    await this.authService.resetPassword(token, password);
    
    return { 
      status: 200, 
      message: 'Password has been reset successfully' 
    };
  }
}
