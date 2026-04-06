import {
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
import { LikesService } from './likes.service';

@Controller('likes')
@UseGuards(JwtAuthGuard)
export class LikesController {
  constructor(private likesService: LikesService) {}

  @Post('posts/:postId')
  likePost(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string,
  ) {
    return this.likesService.likePost(req.user.id, postId);
  }

  @Delete('posts/:postId')
  unlikePost(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string,
  ) {
    return this.likesService.unlikePost(req.user.id, postId);
  }

  @Get('posts/:postId')
  getPostLikes(
    @Param('postId') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.likesService.getPostLikes(
      postId,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('check/:postId')
  checkLikeStatus(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string,
  ) {
    return this.likesService.checkLikeStatus(req.user.id, postId);
  }
}
