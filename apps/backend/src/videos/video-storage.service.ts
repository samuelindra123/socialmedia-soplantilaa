import { Injectable } from '@nestjs/common';
import * as AWS from 'aws-sdk';
import { createReadStream } from 'fs';
import { promises as fsPromises } from 'fs';
import { extname } from 'path';
import { randomUUID } from 'crypto';

interface UploadedAsset {
  url: string;
  key: string;
  size: number;
}

/**
 * Service khusus untuk interaksi DigitalOcean Spaces dengan pendekatan streaming.
 */
@Injectable()
export class VideoStorageService {
  private readonly s3: AWS.S3;
  private readonly bucket: string;
  private readonly cdnHost?: string;

  constructor() {
    const endpoint = process.env.DO_SPACES_ENDPOINT;
    const key = process.env.DO_SPACES_KEY;
    const secret = process.env.DO_SPACES_SECRET;
    const bucket = process.env.DO_SPACES_BUCKET;

    if (!endpoint || !key || !secret || !bucket) {
      throw new Error(
        'Konfigurasi Spaces belum lengkap. Periksa variabel environment.',
      );
    }

    this.bucket = bucket;
    this.cdnHost = process.env.DO_SPACES_CDN;

    this.s3 = new AWS.S3({
      endpoint: new AWS.Endpoint(endpoint).href,
      credentials: new AWS.Credentials({
        accessKeyId: key,
        secretAccessKey: secret,
      }),
    });
  }

  /**
   * Upload original video (uncompressed) untuk immediate playback.
   */
  async uploadOriginalVideo(
    localPath: string,
    mimeType: string,
  ): Promise<UploadedAsset> {
    return this.uploadAsset(localPath, mimeType, 'videos/originals', '.mp4');
  }

  /**
   * Mengunggah video hasil kompresi dengan streaming untuk efisiensi memori.
   * Supports quality naming for multi-quality adaptive streaming
   */
  async uploadProcessedVideo(
    localPath: string,
    mimeType: string,
    quality?: string, // e.g., "144p", "720p", "1080p"
  ): Promise<UploadedAsset> {
    const folder = quality
      ? `videos/processed/${quality}` // Organized by quality
      : 'videos/processed';
    return this.uploadAsset(localPath, mimeType, folder, '.mp4');
  }

  /**
   * Mengunggah thumbnail JPEG hasil snapshot FFmpeg.
   */
  async uploadThumbnail(
    localPath: string,
    mimeType: string,
  ): Promise<UploadedAsset> {
    return this.uploadAsset(
      localPath,
      mimeType,
      'videos/thumbnails',
      extname(localPath) || '.jpg',
    );
  }

  /**
   * Menghapus aset berdasarkan URL CDN agar storage tetap bersih.
   */
  async deleteByUrl(url?: string | null): Promise<void> {
    if (!url) return;
    const key = this.extractKey(url);
    if (!key) return;

    await this.s3
      .deleteObject({ Bucket: this.bucket, Key: key })
      .promise()
      .catch((error: unknown) => {
        const message =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(`Gagal menghapus file ${key} dari Spaces: ${message}`);
      });
  }

  private async uploadAsset(
    localPath: string,
    mimeType: string,
    folder: string,
    forcedExt: string,
  ): Promise<UploadedAsset> {
    const key = `${folder}/${Date.now()}-${randomUUID()}${forcedExt}`;
    const stream = createReadStream(localPath);
    const { size } = await fsPromises.stat(localPath);

    const result = await this.s3
      .upload({
        Bucket: this.bucket,
        Key: key,
        Body: stream,
        ACL: 'public-read',
        ContentType: mimeType,
        CacheControl: 'public, max-age=31536000',
        Metadata: { app: 'renunganku', role: 'video-processing' },
      })
      .promise();

    return {
      url: this.cdnHost ? `https://${this.cdnHost}/${key}` : result.Location,
      key,
      size,
    };
  }

  private extractKey(url: string): string | null {
    if (!url) return null;
    if (this.cdnHost && url.includes(this.cdnHost)) {
      return url.split(`${this.cdnHost}/`)[1];
    }
    const segments = url.split('.com/');
    return segments[1] ?? null;
  }
}
