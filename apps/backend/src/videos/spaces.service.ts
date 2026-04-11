import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

@Injectable()
export class SpacesService {
  private readonly logger = new Logger(SpacesService.name);
  private readonly client: S3Client;
  private readonly bucket: string;
  private readonly cdnBase: string;

  constructor(private readonly config: ConfigService) {
    const region = this.config.get<string>('DO_SPACES_REGION', 'sgp1');
    this.bucket = this.config.get<string>('DO_SPACES_BUCKET', '');
    this.cdnBase = this.config.get<string>('DO_SPACES_CDN_ENDPOINT', '');

    this.client = new S3Client({
      endpoint: `https://${region}.digitaloceanspaces.com`,
      region,
      credentials: {
        accessKeyId: this.config.get<string>('DO_SPACES_KEY', ''),
        secretAccessKey: this.config.get<string>('DO_SPACES_SECRET', ''),
      },
      forcePathStyle: false,
    });
  }

  private async uploadBuffer(buffer: Buffer, key: string, contentType: string): Promise<string> {
    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: buffer,
          ContentType: contentType,
          ACL: 'public-read',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      const url = `${this.cdnBase}/${key}`;
      this.logger.log(`Uploaded: ${url}`);
      return url;
    } catch (err) {
      this.logger.error(`Upload failed for key ${key}:`, err);
      throw new InternalServerErrorException('Gagal upload ke storage');
    }
  }

  async uploadVideo(file: Express.Multer.File): Promise<string> {
    const ext = (file.originalname.split('.').pop() ?? 'mp4').toLowerCase();
    const key = `videos/${uuidv4()}.${ext}`;
    return this.uploadBuffer(file.buffer, key, file.mimetype);
  }

  async uploadThumbnail(buffer: Buffer, videoId: string): Promise<string> {
    const key = `thumbnails/${videoId}.jpg`;
    return this.uploadBuffer(buffer, key, 'image/jpeg');
  }

  async deleteByUrl(url: string | null | undefined): Promise<void> {
    if (!url) return;
    try {
      const key = url.replace(`${this.cdnBase}/`, '');
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      this.logger.warn(`Gagal hapus file: ${url}`);
    }
  }
}
