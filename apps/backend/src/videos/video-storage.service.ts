import { Injectable } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { Upload } from '@aws-sdk/lib-storage';
import { createReadStream } from 'fs';
import { promises as fsPromises } from 'fs';
import { extname } from 'path';
import { randomUUID } from 'crypto';

interface UploadedAsset {
  url: string;
  key: string;
  size: number;
}

@Injectable()
export class VideoStorageService {
  private readonly s3: S3Client;
  private readonly bucket: string;
  private readonly cdnHost?: string;

  constructor() {
    const endpoint = process.env.DO_SPACES_ENDPOINT;
    const key = process.env.DO_SPACES_KEY;
    const secret = process.env.DO_SPACES_SECRET;
    const bucket = process.env.DO_SPACES_BUCKET;

    if (!endpoint || !key || !secret || !bucket) {
      throw new Error('Konfigurasi Spaces belum lengkap. Periksa variabel environment.');
    }

    this.bucket = bucket;
    this.cdnHost = process.env.DO_SPACES_CDN;

    this.s3 = new S3Client({
      endpoint,
      region: process.env.DO_SPACES_REGION || 'us-east-1',
      credentials: { accessKeyId: key, secretAccessKey: secret },
    });
  }

  async uploadOriginalVideo(localPath: string, mimeType: string): Promise<UploadedAsset> {
    return this.uploadAsset(localPath, mimeType, 'videos/originals', '.mp4');
  }

  async uploadProcessedVideo(localPath: string, mimeType: string, quality?: string): Promise<UploadedAsset> {
    const folder = quality ? `videos/processed/${quality}` : 'videos/processed';
    return this.uploadAsset(localPath, mimeType, folder, '.mp4');
  }

  async uploadThumbnail(localPath: string, mimeType: string): Promise<UploadedAsset> {
    return this.uploadAsset(localPath, mimeType, 'videos/thumbnails', extname(localPath) || '.jpg');
  }

  async deleteByUrl(url?: string | null): Promise<void> {
    if (!url) return;
    const key = this.extractKey(url);
    if (!key) return;

    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key })).catch((error: unknown) => {
      const message = error instanceof Error ? error.message : 'Unknown error';
      console.error(`Gagal menghapus file ${key} dari Spaces: ${message}`);
    });
  }

  private async uploadAsset(localPath: string, mimeType: string, folder: string, forcedExt: string): Promise<UploadedAsset> {
    const key = `${folder}/${Date.now()}-${randomUUID()}${forcedExt}`;
    const stream = createReadStream(localPath);
    const { size } = await fsPromises.stat(localPath);

    const upload = new Upload({
      client: this.s3,
      params: {
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ACL: 'public-read',
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
        Metadata: { app: 'soplantila', role: 'video-processing' },
      },
    });

    const result = await upload.done();
    const location = (result as { Location?: string }).Location ?? '';

    return {
      url: this.cdnHost ? `https://${this.cdnHost}/${key}` : location,
      key,
      size,
    };
  }

  private extractKey(url: string): string | null {
    if (!url) return null;
    if (this.cdnHost && url.includes(this.cdnHost)) return url.split(`${this.cdnHost}/`)[1];
    return url.split('.com/')[1] ?? null;
  }
}
