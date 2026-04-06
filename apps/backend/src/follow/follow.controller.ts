import {
  Body,
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { FollowService } from './follow.service';
import { FollowRequestDto } from './dto/follow-request.dto';
import { FollowActionDto } from './dto/follow-action.dto';

@Controller('follow')
@UseGuards(JwtAuthGuard)
export class FollowController {
  constructor(private followService: FollowService) {}

  @Get('mutuals')
  getMutualFollows(@Request() req: { user: { id: string } }) {
    return this.followService.getMutualFollows(req.user.id);
  }

  @Post('request')
  requestFollow(
    @Request() req: { user: { id: string } },
    @Body() dto: FollowRequestDto,
  ) {
    return this.followService.requestFollow(req.user.id, dto.username);
  }

  @Post('accept')
  acceptFollow(
    @Request() req: { user: { id: string } },
    @Body() dto: FollowActionDto,
  ) {
    return this.followService.acceptFollowRequest(
      req.user.id,
      dto.followRequestId,
    );
  }

  @Post('reject')
  rejectFollow(
    @Request() req: { user: { id: string } },
    @Body() dto: FollowActionDto,
  ) {
    return this.followService.rejectFollowRequest(
      req.user.id,
      dto.followRequestId,
    );
  }

  @Delete(':username')
  unfollowUser(
    @Request() req: { user: { id: string } },
    @Param('username') username: string,
  ) {
    return this.followService.unfollowUser(req.user.id, username);
  }

  @Get(':username/followers')
  getFollowers(
    @Param('username') username: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.followService.getFollowers(
      username,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get(':username/following')
  getFollowing(
    @Param('username') username: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.followService.getFollowing(
      username,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('check/:username')
  checkFollowStatus(
    @Request() req: { user: { id: string } },
    @Param('username') username: string,
  ) {
    return this.followService.checkFollowStatus(req.user.id, username);
  }

  @Get('stats/:username')
  getFollowStats(@Param('username') username: string) {
    return this.followService.getFollowStats(username);
  }
}
