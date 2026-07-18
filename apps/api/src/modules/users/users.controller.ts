import { Controller, Delete, HttpCode, UseGuards } from '@nestjs/common';
import { EmailIdentityGuard } from '../auth/identity.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { type AuthenticatedUser } from '@ziweiai/contracts';
import { UsersService } from './users.service';

@Controller('users')
@UseGuards(EmailIdentityGuard)
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Delete('me')
  @HttpCode(204)
  async deleteMe(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    await this.usersService.deleteAccount(user.userId);
  }
}
