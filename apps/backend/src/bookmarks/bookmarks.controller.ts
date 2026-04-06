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
import { BookmarksService } from './bookmarks.service';

@Controller('bookmarks')
@UseGuards(JwtAuthGuard)
export class BookmarksController {
  constructor(private bookmarksService: BookmarksService) {}

  @Post(':postId')
  bookmarkPost(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string,
  ) {
    return this.bookmarksService.bookmarkPost(req.user.id, postId);
  }

  @Delete(':postId')
  unbookmarkPost(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string,
  ) {
    return this.bookmarksService.unbookmarkPost(req.user.id, postId);
  }

  @Get()
  getMyBookmarks(
    @Request() req: { user: { id: string } },
    @Query('page') page: string = '1',
    @Query('limit') limit: string = '10',
  ) {
    return this.bookmarksService.getMyBookmarks(
      req.user.id,
      parseInt(page),
      parseInt(limit),
    );
  }

  @Get('check/:postId')
  checkBookmarkStatus(
    @Request() req: { user: { id: string } },
    @Param('postId') postId: string,
  ) {
    return this.bookmarksService.checkBookmarkStatus(req.user.id, postId);
  }
}
