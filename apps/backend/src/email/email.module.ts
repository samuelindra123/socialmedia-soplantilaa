import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bull';
import { EmailService } from './email.service';
import { EmailProcessor } from './email.processor';
import { EMAIL_QUEUE_NAME } from './email.constants';
import { PrismaModule } from '../prisma/prisma.module';

@Module({
  imports: [PrismaModule, BullModule.registerQueue({ name: EMAIL_QUEUE_NAME })],
  providers: [EmailService, EmailProcessor],
  exports: [EmailService],
})
export class EmailModule {}
