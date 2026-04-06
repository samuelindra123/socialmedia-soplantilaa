import {
  Controller,
  Get,
  Put,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { UsersService } from './users.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';
import { GetUser } from '../common/decorators/get-user.decorator';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get('profile')
  getMyProfile(@Request() req: { user?: { id: string } }) {
    return this.usersService.getMyProfile(req.user!.id);
  }

  @Put('profile')
  @UseInterceptors(FileInterceptor('profileImage'))
  updateProfile(
    @Request() req: { user?: { id: string } },
    @Body() dto: UpdateProfileDto,
    @UploadedFile() file?: Express.Multer.File,
  ) {
    return this.usersService.updateProfile(req.user!.id, dto, file);
  }

  @Put('profile/background')
  @UseInterceptors(FileInterceptor('backgroundFile'))
  updateBackgroundProfile(
    @Request() req: { user?: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    if (!file) {
      throw new BadRequestException('File tidak ditemukan');
    }
    return this.usersService.updateBackgroundProfile(req.user!.id, file);
  }

  @Get('search')
  searchUsers(@Query() dto: SearchUsersDto) {
    return this.usersService.searchUsers(dto);
  }

  @Get('suggestions')
  getSuggestions(
    @GetUser('id') userId: string,
    @Query('limit') limit: number = 5,
  ) {
    return this.usersService.getSuggestions(userId, +limit);
  }

  @Get(':username')
  getUserByUsername(
    @Param('username') username: string,
    @Request() req: { user?: { id?: string } },
  ) {
    return this.usersService.getUserByUsername(username, req.user?.id);
  }
}
