import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MulterModule } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';
import { MessagesService } from './messages.service';
import { MessagesController } from './messages.controller';
import { MessagesGateway } from './messages.gateway';
import { NotificationsModule } from '../notifications/notifications.module';

@Module({
  imports: [
    NotificationsModule,
    MulterModule.register({
      storage: memoryStorage(),
      limits: {
        fileSize: 50 * 1024 * 1024, // 50MB max
      },
    }),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => {
        const secret = config.get<string>('JWT_SECRET');
        const raw = config.get<string>('JWT_EXPIRATION');
        let expiresIn: number | undefined;
        if (raw) {
          const num = Number(raw);
          if (Number.isFinite(num)) {
            expiresIn = num;
          } else {
            const m = raw.match(/^(\d+)([smhdw])$/);
            if (m) {
              const val = parseInt(m[1], 10);
              const unit = m[2];
              const map: Record<string, number> = {
                s: 1,
                m: 60,
                h: 3600,
                d: 86400,
                w: 604800,
              };
              expiresIn = val * map[unit];
            } else {
              expiresIn = 604800;
            }
          }
        } else {
          expiresIn = 604800;
        }
        const opts: import('@nestjs/jwt').JwtModuleOptions = {
          signOptions: { expiresIn },
        };
        if (secret) opts.secret = secret;
        return opts;
      },
    }),
  ],
  providers: [MessagesService, MessagesGateway],
  controllers: [MessagesController],
})
export class MessagesModule {}
