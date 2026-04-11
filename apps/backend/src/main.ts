import { NestFactory } from '@nestjs/core';
import {
  ExpressAdapter,
  NestExpressApplication,
} from '@nestjs/platform-express';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { IoAdapter } from '@nestjs/platform-socket.io';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { join } from 'path';
import * as classValidator from 'class-validator';
import * as classTransformer from 'class-transformer';
import { ServerOptions } from 'socket.io';

class SocketIOAdapter extends IoAdapter {
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: [
          process.env.FRONTEND_URL || 'http://localhost:3000',
          'http://localhost:3000',
          'https://www.soplantila.my.id',
          'https://soplantila.my.id',
        ],
        credentials: true,
        methods: ['GET', 'POST'],
      },
      transports: ['websocket', 'polling'],
      allowEIO3: true,
    });
    return server;
  }
}

async function bootstrap() {
  // Provide adapter explicitly to avoid module-resolution issues in monorepo installs.
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );

  // Increase body size limit for video uploads (150MB to allow validation in controller)
  app.use(json({ limit: '150mb' }));
  app.use(urlencoded({ limit: '150mb', extended: true }));

  // Serve static files for uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // WebSocket adapter with CORS
  // Bind to the underlying HTTP server explicitly to avoid instanceof edge-cases
  // where the adapter may not attach to the same server in monorepo/dev setups.
  app.useWebSocketAdapter(new SocketIOAdapter(app.getHttpServer()));

  // Global exception filter for multer errors
  app.use((err: any, req: any, res: any, next: any) => {
    if (err && err.message && err.message.includes('Invalid format')) {
      return res.status(400).json({
        statusCode: 400,
        message: err.message,
        error: 'Bad Request',
      });
    }
    next(err);
  });

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
      validatorPackage: classValidator,
      transformerPackage: classTransformer,
    }),
  );

  // CORS
  app.enableCors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  });

  // Swagger Documentation
  const config = new DocumentBuilder()
    .setTitle('Renunganku Social Media API')
    .setDescription(
      'Complete REST API for social media platform with real-time features',
    )
    .setVersion('1.0')
    .addTag('Authentication', 'User registration, login, and verification')
    .addTag('Onboarding', 'User onboarding and profile setup')
    .addTag('Users', 'User management and search')
    .addTag('Posts', 'Create, read, update, delete posts with media')
    .addTag('Bookmarks', 'Save and manage bookmarked posts')
    .addTag('Likes', 'Like and unlike posts')
    .addTag('Comments', 'Comment on posts with nested replies')
    .addTag('Follow', 'Follow and unfollow users')
    .addTag('Notifications', 'Real-time notifications')
    .addTag('Feed', 'Personalized and trending feeds')
    .addTag('Stories', 'Create and view 24h stories')
    .addTag('Messages', 'Direct messaging')
    .addTag('Videos', 'Upload dan pemrosesan video')
    .addTag('Alkitab', 'Kitab, pasal, dan ayat AYT')
    .addBearerAuth(
      {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Enter JWT token',
        in: 'header',
      },
      'JWT-auth',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  const port = process.env.PORT || 4000;
  await app.listen(port);

  console.log(`\n🚀 Backend is running on: http://localhost:${port}`);
  console.log(`📚 API Documentation: http://localhost:${port}/api-docs`);
  console.log(`📝 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(
    `🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}`,
  );
  console.log(`🔌 WebSocket Gateway enabled with CORS\n`);
}
void bootstrap();
