import { Controller, Get, Req, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../middlewares/jwt-auth.guard';
import { Request } from 'express';

@Controller('users')
export class UserController {
  @UseGuards(JwtAuthGuard)
  @Get('find')
  getMe(@Req() req: Request) {
    return req.user;
  }
}
