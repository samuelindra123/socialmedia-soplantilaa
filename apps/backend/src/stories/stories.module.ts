import { Module } from '@nestjs/common';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { StoriesController } from './stories.controller';
import { StoriesService } from './stories.service';
import { StoryThumbnailService } from './story-thumbnail.service';
import { SpacesModule } from '../spaces/spaces.module';

@Module({
  imports: [
    SpacesModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 100 * 1024 * 1024, // 100MB max for stories (video support)
      },
    }),
  ],
  controllers: [StoriesController],
  providers: [StoriesService, StoryThumbnailService],
  exports: [StoriesService],
})
export class StoriesModule {}
