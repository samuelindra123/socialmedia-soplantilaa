import { Module } from '@nestjs/common';
import { CommentsController } from './comments.controller';
import { CommentsService } from './comments.service';
import { CommentsLikesController } from './likes.controller';
import { CommentsLikesService } from './likes.service';

@Module({
  controllers: [CommentsController, CommentsLikesController],
  providers: [CommentsService, CommentsLikesService],
})
export class CommentsModule {}
