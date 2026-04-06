import {
  Controller,
  Post,
  Delete,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsLikesService } from './likes.service';

@Controller('comments/likes')
@UseGuards(JwtAuthGuard)
export class CommentsLikesController {
  constructor(private svc: CommentsLikesService) {}

  @Post(':commentId')
  like(
    @Request() req: { user: { id: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.svc.like(req.user.id, commentId);
  }

  @Delete(':commentId')
  unlike(
    @Request() req: { user: { id: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.svc.unlike(req.user.id, commentId);
  }
}
