import { Controller, Get, Post, Body } from '@nestjs/common';

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

  @Post()
  create(@Body() userDto: UserDto) {
    const newUser = { ...userDto };
    this.users.push(newUser);
    return newUser;
  }
}
