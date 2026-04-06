import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Param,
  Body,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CommentsService } from './comments.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';

@Controller('comments')
@UseGuards(JwtAuthGuard)
export class CommentsController {
  constructor(private commentsService: CommentsService) {}

  @Post('posts/:postId')
  createComment(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string,
    @Body() dto: CreateCommentDto,
  ) {
    return this.commentsService.createComment(req.user.id, postId, dto);
  }

  @Get('posts/:postId')
  getPostComments(
    @Request() req: { user?: { id: string } },
    @Param('postId') postId: string,
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '20',
  ) {
    return this.commentsService.getPostComments(
      postId,
      parseInt(page),
      parseInt(limit),
      req.user?.id,
    );
  }

  @Get(':commentId/replies')
  getCommentReplies(
    @Request() req: { user?: { id: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.getCommentReplies(commentId, req.user?.id);
  }

  @Put(':commentId')
  updateComment(
    @Request() req: { user: { id: string } },
    @Param('commentId') commentId: string,
    @Body() dto: UpdateCommentDto,
  ) {
    return this.commentsService.updateComment(req.user.id, commentId, dto);
  }

  @Delete(':commentId')
  deleteComment(
    @Request() req: { user: { id: string } },
    @Param('commentId') commentId: string,
  ) {
    return this.commentsService.deleteComment(req.user.id, commentId);
  }
}
