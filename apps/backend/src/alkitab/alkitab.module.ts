import { Module } from '@nestjs/common';
import { PrismaModule } from '../prisma/prisma.module';
import { AlkitabController } from './alkitab.controller';
import { AlkitabService } from './alkitab.service';

@Module({
  imports: [PrismaModule],
  controllers: [AlkitabController],
  providers: [AlkitabService],
  exports: [AlkitabService],
})
export class AlkitabModule {}
