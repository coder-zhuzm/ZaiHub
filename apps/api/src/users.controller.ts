import { Controller, Get, Post, Body, UseGuards, Request } from '@nestjs/common';
import { JwtAuthGuard } from './auth/jwt-auth.guard';

export class UserDto {
  email: string;
  nickname?: string;
}

@Controller('users')
export class UsersController {
  private users: UserDto[] = [];

  @Get()
  findAll() {
    return this.users;
  }

  @Get('me')
  @UseGuards(JwtAuthGuard)
  getCurrentUser(@Request() req) {
    // 从JWT payload中获取用户信息
    return {
      id: req.user.userId,
      email: req.user.email,
      role: req.user.role,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }

  @Post()
  create(@Body() userDto: UserDto) {
    const newUser = { ...userDto };
    this.users.push(newUser);
    return newUser;
  }
}
