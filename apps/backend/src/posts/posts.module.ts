import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { PostsController } from './posts.controller';
import { PostsService } from './posts.service';
import { SpacesModule } from '../spaces/spaces.module';
import { PostImageDerivativeService } from './post-image-derivative.service';

@Module({
  imports: [
    SpacesModule,
    MulterModule.register({
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max for video uploads
      },
    }),
  ],
  controllers: [PostsController],
  providers: [PostsService, PostImageDerivativeService],
  exports: [PostsService],
})
export class PostsModule {}
