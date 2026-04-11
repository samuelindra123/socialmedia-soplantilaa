import { Injectable, BadRequestException, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';

const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];

@Injectable()
export class SpacesService {
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

  /** Build public CDN URL for a given key. */
  getFileViewUrl(key: string): string {
    return `${this.cdnBase}/${key}`;
  }

  /** Extract key from a stored CDN URL. */
  extractFileId(fileUrl: string): string | null {
    if (!fileUrl || !this.cdnBase) return null;
    return fileUrl.startsWith(this.cdnBase) ? fileUrl.replace(`${this.cdnBase}/`, '') : null;
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'profiles'): Promise<string> {
    if (!file) throw new BadRequestException('File tidak boleh kosong');

    const isVideo = folder === 'videos' || (folder === 'stories' && file.mimetype.startsWith('video/'));

    if (folder === 'stories') {
      const valid = ALLOWED_IMAGE_TYPES.includes(file.mimetype) || file.mimetype.startsWith('video/');
      if (!valid) throw new BadRequestException('File harus berupa gambar atau video');
      if (file.mimetype.startsWith('video/') && file.size > 100 * 1024 * 1024)
        throw new BadRequestException('Ukuran video maksimal 100MB');
      if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) && file.size > 10 * 1024 * 1024)
        throw new BadRequestException('Ukuran gambar maksimal 10MB');
    } else if (isVideo) {
      if (!file.mimetype.startsWith('video/')) throw new BadRequestException('File harus berupa video');
      if (file.size > 200 * 1024 * 1024) throw new BadRequestException('Ukuran video maksimal 200MB');
    } else {
      if (!ALLOWED_IMAGE_TYPES.includes(file.mimetype))
        throw new BadRequestException('File harus berupa gambar (jpg, png, webp)');
      if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Ukuran file maksimal 5MB');
    }

    const ext = file.originalname.split('.').pop() ?? 'bin';
    const key = `${folder}/${uuidv4()}.${ext}`;

    try {
      await this.client.send(
        new PutObjectCommand({
          Bucket: this.bucket,
          Key: key,
          Body: file.buffer,
          ContentType: file.mimetype,
          ACL: 'public-read',
          CacheControl: 'public, max-age=31536000, immutable',
        }),
      );
      return this.getFileViewUrl(key);
    } catch (err: any) {
      throw new InternalServerErrorException(`Upload gagal: ${err?.message ?? 'unknown error'}`);
    }
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = this.extractFileId(fileUrl);
    if (!key) return;
    try {
      await this.client.send(new DeleteObjectCommand({ Bucket: this.bucket, Key: key }));
    } catch {
      // Ignore not-found errors during delete
    }
  }
}
