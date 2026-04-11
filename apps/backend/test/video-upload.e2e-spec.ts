import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import * as fs from 'fs';
import * as path from 'path';
import { execSync } from 'child_process';

describe('Video Upload (e2e)', () => {
  let app: INestApplication<App>;
  let authToken: string;
  let testVideoIds: string[] = [];

  // Helper: Create test video file
  const createTestVideo = (filename: string, durationSec = 5, width = 640, height = 480): string => {
    const filepath = path.join(__dirname, filename);
    // Generate test video using ffmpeg
    execSync(
      `ffmpeg -f lavfi -i testsrc=duration=${durationSec}:size=${width}x${height}:rate=30 ` +
      `-f lavfi -i sine=frequency=1000:duration=${durationSec} ` +
      `-c:v libx264 -preset ultrafast -c:a aac -y ${filepath}`,
      { stdio: 'ignore' }
    );
    return filepath;
  };

  // Helper: Create corrupt video file
  const createCorruptVideo = (filename: string, sizeMB = 5): string => {
    const filepath = path.join(__dirname, filename);
    const buffer = Buffer.alloc(sizeMB * 1024 * 1024, 'corrupt');
    fs.writeFileSync(filepath, buffer);
    return filepath;
  };

  // Helper: Create large file
  const createLargeFile = (filename: string, sizeMB: number): string => {
    const filepath = path.join(__dirname, filename);
    const buffer = Buffer.alloc(sizeMB * 1024 * 1024, 0);
    fs.writeFileSync(filepath, buffer);
    return filepath;
  };

  // Helper: Wait for video to be ready
  const waitForVideoReady = async (videoId: string, maxWaitMs = 15 * 60 * 1000): Promise<any> => {
    const startTime = Date.now();
    while (Date.now() - startTime < maxWaitMs) {
      const response = await request(app.getHttpServer())
        .get(`/videos/${videoId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      if (response.body.status === 'ready') {
        return response.body;
      }
      if (response.body.status === 'failed') {
        throw new Error('Video processing failed');
      }

      await new Promise(resolve => setTimeout(resolve, 3000));
    }
    throw new Error('Timeout waiting for video to be ready');
  };

  // Helper: Check temp files
  const checkTempFiles = (): string[] => {
    const tmpDir = '/tmp';
    const files = fs.readdirSync(tmpDir);
    return files.filter(f => 
      f.startsWith('upload-') || 
      f.startsWith('compressed-') || 
      f.startsWith('thumb-')
    );
  };

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    await app.init();

    // Get auth token (adjust based on your auth implementation)
    // For now, we'll use a mock token or create a test user
    const signupResponse = await request(app.getHttpServer())
      .post('/auth/signup')
      .send({
        email: `test-video-${Date.now()}@example.com`,
        password: 'Test123456!',
        username: `testuser${Date.now()}`,
      });

    authToken = signupResponse.body.accessToken || signupResponse.body.token;
  });

  afterAll(async () => {
    // Cleanup test files
    const testFiles = fs.readdirSync(__dirname).filter(f => f.startsWith('test-video-'));
    testFiles.forEach(f => {
      try {
        fs.unlinkSync(path.join(__dirname, f));
      } catch (e) {}
    });

    await app.close();
  });

  // 🟢 EASY — Validasi Dasar

  describe('🟢 EASY — Validasi Dasar', () => {
    it('Test 1: Upload video valid', async () => {
      const startTime = Date.now();
      const videoPath = createTestVideo('test-video-1.mp4', 5);

      const response = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', videoPath)
        .field('title', 'Test Video 1');

      const duration = Date.now() - startTime;

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty('id');
      expect(response.body.status).toBe('processing');
      expect(duration).toBeLessThan(2000);

      testVideoIds.push(response.body.id);

      // Cleanup
      fs.unlinkSync(videoPath);
    }, 10000);

    it('Test 2: Polling status processing', async () => {
      const videoId = testVideoIds[0];

      const response = await request(app.getHttpServer())
        .get(`/videos/${videoId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.status).toBe('processing');
      expect(response.body.progress).toBeGreaterThanOrEqual(0);
    });

    it('Test 3: List video kosong', async () => {
      // Create new user to test empty list
      const newUserResponse = await request(app.getHttpServer())
        .post('/auth/signup')
        .send({
          email: `test-empty-${Date.now()}@example.com`,
          password: 'Test123456!',
          username: `testempty${Date.now()}`,
        });

      const newToken = newUserResponse.body.accessToken || newUserResponse.body.token;

      const response = await request(app.getHttpServer())
        .get('/videos')
        .set('Authorization', `Bearer ${newToken}`);

      expect(response.status).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      expect(response.body.length).toBe(0);
    });

    it('Test 4: Queue stats berjalan', async () => {
      const response = await request(app.getHttpServer())
        .get('/videos/queue/stats');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('waiting');
      expect(response.body).toHaveProperty('active');
      expect(response.body).toHaveProperty('completed');
      expect(response.body).toHaveProperty('failed');
      expect(typeof response.body.waiting).toBe('number');
      expect(typeof response.body.active).toBe('number');
    });
  });

  // 🟡 MEDIUM — Validasi Error & Edge Case

  describe('🟡 MEDIUM — Validasi Error & Edge Case', () => {
    it('Test 5: Upload file > 100MB', async () => {
      const largePath = createLargeFile('test-video-large.mp4', 101);

      const response = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', largePath);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('100MB');
      expect(response.body.message).toContain('101');

      // Check no temp files
      const tempFiles = checkTempFiles();
      expect(tempFiles.length).toBe(0);

      fs.unlinkSync(largePath);
    });

    it('Test 6: Upload format tidak valid', async () => {
      const aviPath = path.join(__dirname, 'test-video.avi');
      fs.writeFileSync(aviPath, Buffer.alloc(1024, 0));

      const response = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', aviPath);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('mp4');
      expect(response.body.message).toContain('mov');
      expect(response.body.message).toContain('webm');

      fs.unlinkSync(aviPath);
    });

    it('Test 7: Upload file bukan video', async () => {
      const jpgPath = path.join(__dirname, 'test-image.jpg');
      fs.writeFileSync(jpgPath, Buffer.alloc(1024, 0));

      const response = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', jpgPath);

      expect(response.status).toBe(400);
      expect(response.body.message).toContain('Invalid format');

      fs.unlinkSync(jpgPath);
    });

    it('Test 8: Get status video tidak ada', async () => {
      const fakeId = '00000000-0000-0000-0000-000000000000';

      const response = await request(app.getHttpServer())
        .get(`/videos/${fakeId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });

    it('Test 9: Upload tanpa file', async () => {
      const response = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .field('title', 'No video');

      expect(response.status).toBe(400);
      expect(response.status).not.toBe(500);
    });

    it('Test 10: Upload tanpa auth token', async () => {
      const videoPath = createTestVideo('test-video-noauth.mp4', 3);

      const response = await request(app.getHttpServer())
        .post('/videos/upload')
        .attach('video', videoPath);

      expect(response.status).toBe(401);

      fs.unlinkSync(videoPath);
    });
  });

  // 🟠 HARD — Fungsionalitas Inti

  describe('🟠 HARD — Fungsionalitas Inti', () => {
    let readyVideoId: string;
    let readyVideoData: any;

    it('Test 11: Video berhasil diproses penuh', async () => {
      const videoPath = createTestVideo('test-video-full.mp4', 10, 1920, 1080);
      const stats = fs.statSync(videoPath);
      const originalSize = stats.size;

      const uploadResponse = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', videoPath)
        .field('title', 'Full Processing Test');

      expect(uploadResponse.status).toBe(201);
      readyVideoId = uploadResponse.body.id;

      // Wait for processing
      readyVideoData = await waitForVideoReady(readyVideoId);

      expect(readyVideoData.status).toBe('ready');
      expect(readyVideoData.progress).toBe(100);
      expect(readyVideoData.videoUrl).toBeTruthy();
      expect(readyVideoData.thumbnailUrl).toBeTruthy();
      expect(readyVideoData.duration).toBeGreaterThan(0);
      expect(readyVideoData.width).toBeGreaterThan(0);
      expect(readyVideoData.height).toBeGreaterThan(0);
      expect(readyVideoData.originalSize).toBeGreaterThan(0);
      expect(readyVideoData.compressedSize).toBeGreaterThan(0);
      expect(readyVideoData.compressedSize).toBeLessThan(readyVideoData.originalSize);

      fs.unlinkSync(videoPath);
    }, 15 * 60 * 1000); // 15 min timeout

    it('Test 12: Verifikasi kompresi terjadi', () => {
      const compressionRatio = (1 - readyVideoData.compressedSize / readyVideoData.originalSize) * 100;
      
      console.log(`Compression ratio: ${compressionRatio.toFixed(2)}%`);
      expect(compressionRatio).toBeGreaterThanOrEqual(20);
    });

    it('Test 13: Verifikasi faststart (moov atom)', async () => {
      // Download video
      const videoUrl = readyVideoData.videoUrl;
      const videoPath = path.join(__dirname, 'downloaded-video.mp4');
      
      execSync(`curl -o ${videoPath} "${videoUrl}"`, { stdio: 'ignore' });

      // Check with ffprobe
      const probeOutput = execSync(
        `ffprobe -v quiet -print_format json -show_format ${videoPath}`
      ).toString();
      
      const probeData = JSON.parse(probeOutput);
      expect(parseFloat(probeData.format.start_time)).toBeLessThanOrEqual(0.1);

      fs.unlinkSync(videoPath);
    });

    it('Test 14: Verifikasi thumbnail', async () => {
      const thumbnailUrl = readyVideoData.thumbnailUrl;
      const thumbPath = path.join(__dirname, 'downloaded-thumb.jpg');
      
      execSync(`curl -o ${thumbPath} "${thumbnailUrl}"`, { stdio: 'ignore' });

      const stats = fs.statSync(thumbPath);
      expect(stats.size).toBeGreaterThan(0);

      // Check dimensions
      const probeOutput = execSync(
        `ffprobe -v quiet -print_format json -show_streams ${thumbPath}`
      ).toString();
      
      const probeData = JSON.parse(probeOutput);
      const videoStream = probeData.streams[0];
      expect(videoStream.width).toBe(640);
      expect(videoStream.height).toBe(360);

      fs.unlinkSync(thumbPath);
    });

    it('Test 15: Video muncul di list setelah ready', async () => {
      const response = await request(app.getHttpServer())
        .get('/videos')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const video = response.body.find((v: any) => v.id === readyVideoId);
      expect(video).toBeTruthy();
      expect(video.videoUrl).toBeTruthy();
      expect(video.thumbnailUrl).toBeTruthy();
    });

    it('Test 16: Temp files terhapus', () => {
      const tempFiles = checkTempFiles();
      expect(tempFiles.length).toBe(0);
    });
  });

  // 🔴 EXTREME — Stress Test & Failure Recovery

  describe('🔴 EXTREME — Stress Test & Failure Recovery', () => {
    it('Test 17: Upload 5 video bersamaan', async () => {
      const uploads = Array.from({ length: 5 }, (_, i) => {
        const videoPath = createTestVideo(`test-video-parallel-${i}.mp4`, 5);
        return request(app.getHttpServer())
          .post('/videos/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('video', videoPath)
          .field('title', `Parallel Video ${i}`);
      });

      const startTime = Date.now();
      const responses = await Promise.all(uploads);
      const duration = Date.now() - startTime;

      expect(duration).toBeLessThan(3000);
      responses.forEach(res => {
        expect(res.status).toBe(201);
        expect(res.body.id).toBeTruthy();
        testVideoIds.push(res.body.id);
      });

      // Check queue stats
      const statsResponse = await request(app.getHttpServer())
        .get('/videos/queue/stats');

      const totalJobs = statsResponse.body.waiting + statsResponse.body.active;
      expect(totalJobs).toBeGreaterThanOrEqual(5);
      expect(statsResponse.body.active).toBeLessThanOrEqual(3);

      // Cleanup
      for (let i = 0; i < 5; i++) {
        const videoPath = path.join(__dirname, `test-video-parallel-${i}.mp4`);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
    }, 30000);

    it('Test 18: Upload 10 video bersamaan', async () => {
      const uploads = Array.from({ length: 10 }, (_, i) => {
        const videoPath = createTestVideo(`test-video-stress-${i}.mp4`, 3);
        return request(app.getHttpServer())
          .post('/videos/upload')
          .set('Authorization', `Bearer ${authToken}`)
          .attach('video', videoPath)
          .field('title', `Stress Video ${i}`);
      });

      const responses = await Promise.all(uploads);

      responses.forEach(res => {
        expect(res.status).not.toBe(500);
        if (res.status === 201) {
          testVideoIds.push(res.body.id);
        }
      });

      // Cleanup
      for (let i = 0; i < 10; i++) {
        const videoPath = path.join(__dirname, `test-video-stress-${i}.mp4`);
        if (fs.existsSync(videoPath)) fs.unlinkSync(videoPath);
      }
    }, 60000);

    it('Test 19: Upload video corrupt/rusak', async () => {
      const corruptPath = createCorruptVideo('test-video-corrupt.mp4', 5);

      const uploadResponse = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', corruptPath)
        .field('title', 'Corrupt Video');

      expect(uploadResponse.status).toBe(201);
      const videoId = uploadResponse.body.id;

      // Wait for failure (max 5 min)
      await new Promise(resolve => setTimeout(resolve, 5 * 60 * 1000));

      const statusResponse = await request(app.getHttpServer())
        .get(`/videos/${videoId}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(statusResponse.body.status).toBe('failed');

      // Check temp files cleaned
      const tempFiles = checkTempFiles();
      expect(tempFiles.length).toBe(0);

      fs.unlinkSync(corruptPath);
    }, 6 * 60 * 1000);

    it('Test 20: Upload video sangat besar (tepat 99MB)', async () => {
      const videoPath = createTestVideo('test-video-99mb.mp4', 60, 1920, 1080);
      
      // Adjust file size to exactly 99MB
      const targetSize = 99 * 1024 * 1024;
      const currentSize = fs.statSync(videoPath).size;
      if (currentSize < targetSize) {
        const padding = Buffer.alloc(targetSize - currentSize, 0);
        fs.appendFileSync(videoPath, padding);
      }

      const response = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', videoPath)
        .field('title', '99MB Video');

      expect(response.status).toBe(201);
      testVideoIds.push(response.body.id);

      fs.unlinkSync(videoPath);
    }, 30000);

    it('Test 21: Upload video resolusi sangat tinggi (4K)', async () => {
      const videoPath = createTestVideo('test-video-4k.mp4', 5, 3840, 2160);

      const uploadResponse = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', videoPath)
        .field('title', '4K Video');

      expect(uploadResponse.status).toBe(201);
      const videoId = uploadResponse.body.id;

      const readyData = await waitForVideoReady(videoId);

      expect(readyData.width).toBe(1280);
      expect(readyData.height).toBe(720);

      fs.unlinkSync(videoPath);
    }, 15 * 60 * 1000);

    it('Test 22: Server restart saat job di queue', async () => {
      const videoPath = createTestVideo('test-video-restart.mp4', 10);

      const uploadResponse = await request(app.getHttpServer())
        .post('/videos/upload')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('video', videoPath)
        .field('title', 'Restart Test Video');

      expect(uploadResponse.status).toBe(201);
      const videoId = uploadResponse.body.id;

      // Wait for job to start
      await new Promise(resolve => setTimeout(resolve, 5000));

      console.log('⚠️  Manual action required: Restart the server now (Ctrl+C then npm run start:dev)');
      console.log('⚠️  Wait for server to restart, then press Enter to continue test...');
      
      // In automated test, we skip this
      // In manual test, user should restart server here

      fs.unlinkSync(videoPath);
    }, 30000);
  });
});
