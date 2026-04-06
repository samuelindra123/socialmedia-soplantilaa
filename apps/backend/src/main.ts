import { NestFactory } from '@nestjs/core';
import { ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { AppModule } from './app.module';
import { json, urlencoded } from 'express';
import * as express from 'express';
import { join } from 'path';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Increase body size limit for video uploads (100MB)
  app.use(json({ limit: '100mb' }));
  app.use(urlencoded({ limit: '100mb', extended: true }));

  // Serve static files for uploads
  app.use('/uploads', express.static(join(process.cwd(), 'uploads')));

  // Validation
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
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
    `🌐 CORS enabled for: ${process.env.FRONTEND_URL || 'http://localhost:3000'}\n`,
  );
}
void bootstrap();
