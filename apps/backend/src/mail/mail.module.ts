import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { ResendModule } from 'nestjs-resend';
import { MailService } from './mail.service';

@Module({
  imports: [
    ResendModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        apiKey: config.get<string>('RESEND_API_KEY') || '',
      }),
    }),
  ],
  providers: [MailService],
  exports: [MailService],
})
export class MailModule {}
