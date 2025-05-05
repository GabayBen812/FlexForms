import { Controller, Post, Body, Res, Get, Req, UseGuards } from '@nestjs/common';
import { Request as ExpressRequest, Response } from 'express';
import * as jwt from 'jsonwebtoken';
import { AuthService } from '../services/auth.service';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

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
        },
      },
      process.env.ACCESS_TOKEN_SECRET!,
      { expiresIn: '2h' }
    );
    
    
  
    res.cookie('jwt', token, {
      httpOnly: true,
      sameSite: 'strict',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 2,
    });
  
    return res.status(200).json({ message: 'התחברת בהצלחה' });
  }

  @UseGuards(JwtAuthGuard)
  @Get('user')
  getUser(@Req() req: ExpressRequest) {
    return req.user;
  }
  
}
