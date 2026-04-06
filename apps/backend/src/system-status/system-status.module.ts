import { Module } from '@nestjs/common';
import { SystemStatusController } from './system-status.controller';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [SystemStatusController],
})
export class SystemStatusModule {}
