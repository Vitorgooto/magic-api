import { Controller, Post, Body } from '@nestjs/common';
import { UserService } from './user.service';
import { AuthService } from '../auth/auth.service';

@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService, private readonly authService: AuthService) {}

  @Post('signup')
  async createUser(@Body() body: any) {
    const { username, password } = body;
    return this.userService.create(username, password);
  }

  @Post('login')
  async loginUser(@Body() body: any) {
    const { username, password } = body;
    const user = await this.userService.findOne(username);
    if (user && await this.authService.validateUser(password, user.password)) {
      return this.authService.login(user);
    }
    return { message: 'Invalid credentials' };
  }
}
