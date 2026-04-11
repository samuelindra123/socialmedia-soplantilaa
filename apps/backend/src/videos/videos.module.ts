import { Module } from '@nestjs/common';
import { VideosController } from './videos.controller';
import { VideosService } from './videos.service';
import { SpacesService } from './spaces.service';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [VideosController],
  providers: [VideosService, SpacesService],
  exports: [VideosService],
})
export class VideosModule {}
