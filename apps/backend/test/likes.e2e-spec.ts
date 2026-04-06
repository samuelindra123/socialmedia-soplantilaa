import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import * as request from 'supertest';
import { JwtService } from '@nestjs/jwt';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

/* eslint-disable @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access */

describe('Likes E2E', () => {
  let app: INestApplication;
  let prisma: PrismaService;
  let userToken: string;
  let userId: string;
  let postId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();
    app = moduleRef.createNestApplication();
    await app.init();
    prisma = app.get(PrismaService);

    await prisma.$transaction(async (tx) => {
      await tx.like.deleteMany({});
      await tx.comment.deleteMany({});
      await tx.follow.deleteMany({});
      await tx.notification.deleteMany({});
      await tx.postImage.deleteMany({});
      await tx.postVideo.deleteMany({});
      await tx.postHashtag.deleteMany({});
      await tx.post.deleteMany({});
      await tx.profile.deleteMany({});
      await tx.user.deleteMany({});
    });

    const user = await prisma.user.create({
      data: {
        email: 'test@example.com',
        namaLengkap: 'Tester',
        password: '$2b$10$123456789012345678901uWwZ0pVnqv',
        isEmailVerified: true,
      },
    });
    userId = user.id;

    const jwtService = app.get(JwtService);
    userToken = await jwtService.signAsync({ sub: userId });

    const post = await prisma.post.create({
      data: { content: 'Hello', authorId: userId, type: 'text', links: [] },
    });
    postId = post.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('should like a post once and persist', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`/likes/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    const like = await prisma.like.findUnique({
      where: { userId_postId: { userId, postId } },
    });
    expect(like).toBeTruthy();
  });

  it('should be idempotent on like (second call does not duplicate)', async () => {
    const server = app.getHttpServer();
    await request(server)
      .post(`/likes/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(201);

    const count = await prisma.like.count({ where: { userId, postId } });
    expect(count).toBe(1);
  });

  it('feed should mark isLiked true for current user', async () => {
    const server = app.getHttpServer();
    const res = await request(server)
      .get(`/posts/feed`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const feed = res.body?.data ?? [];
    const target = feed.find((p: any) => p.id === postId);
    expect(target?.isLiked).toBe(true);
    expect(target?._count?.likes).toBeGreaterThanOrEqual(1);
  });

  it('should unlike and reflect in feed', async () => {
    const server = app.getHttpServer();
    await request(server)
      .delete(`/likes/posts/${postId}`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const res = await request(server)
      .get(`/posts/feed`)
      .set('Authorization', `Bearer ${userToken}`)
      .expect(200);

    const feed = res.body?.data ?? [];
    const target = feed.find((p: any) => p.id === postId);
    expect(target?.isLiked).toBe(false);
  });
});
