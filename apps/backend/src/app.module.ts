import {
  Module,
  NestModule,
  MiddlewareConsumer,
  RequestMethod,
} from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { BullModule } from '@nestjs/bull';
import { ThrottlerModule, ThrottlerGuard } from '@nestjs/throttler';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { MailModule } from './mail/mail.module';
import { EmailModule } from './email/email.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { LoggerMiddleware } from './common/middleware/logger.middleware';
import { InternalApiTokenMiddleware } from './common/middleware/internal-api-token.middleware';
import { OnboardingModule } from './onboarding/onboarding.module';
import { SpacesModule } from './spaces/spaces.module';
import { UsersModule } from './users/users.module';
import { PostsModule } from './posts/posts.module';
import { BookmarksModule } from './bookmarks/bookmarks.module';
import { LikesModule } from './likes/likes.module';
import { CommentsModule } from './comments/comments.module';
import { FollowModule } from './follow/follow.module';
import { NotificationsModule } from './notifications/notifications.module';
import { FeedModule } from './feed/feed.module';
import { StoriesModule } from './stories/stories.module';
import { MessagesModule } from './messages/messages.module';
import { EventsModule } from './events/events.module';
import { VideosModule } from './videos/videos.module';
import { AlkitabModule } from './alkitab/alkitab.module';
import { SystemStatusModule } from './system-status/system-status.module';
import { BlogModule } from './blog/blog.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000, // 1 minute
        limit: 100, // 100 requests per minute (general)
      },
    ]),
    BullModule.forRoot({
      redis: process.env.REDIS_URL
        ? process.env.REDIS_URL
        : { host: '127.0.0.1', port: 6379 },
    }),
    PrismaModule,
    AuthModule,
    MailModule,
    EmailModule,
    OnboardingModule,
    SpacesModule,
    UsersModule,
    PostsModule,
    BookmarksModule,
    LikesModule,
    CommentsModule,
    FollowModule,
    NotificationsModule,
    FeedModule,
    StoriesModule,
    MessagesModule,
    EventsModule,
    VideosModule,
    AlkitabModule,
    SystemStatusModule,
    BlogModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(InternalApiTokenMiddleware)
      .exclude(
        { path: 'auth/google/callback', method: RequestMethod.GET },
        { path: 'uploads/(.*)', method: RequestMethod.ALL },
        { path: 'api-docs', method: RequestMethod.ALL },
        { path: 'api-docs/(.*)', method: RequestMethod.ALL },
        { path: 'socket.io/(.*)', method: RequestMethod.ALL },
      )
      .forRoutes('*');

    consumer.apply(LoggerMiddleware).forRoutes('*');
  }
}
