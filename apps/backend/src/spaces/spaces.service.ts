import { Injectable, BadRequestException } from '@nestjs/common';
import { S3Client, PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class SpacesService {
  private readonly s3: S3Client;
  private readonly bucketName: string;
  private readonly cdnUrl: string;

  constructor() {
    if (!process.env.DO_SPACES_ENDPOINT) throw new Error('DO_SPACES_ENDPOINT is not defined');
    if (!process.env.DO_SPACES_KEY) throw new Error('DO_SPACES_KEY is not defined');
    if (!process.env.DO_SPACES_SECRET) throw new Error('DO_SPACES_SECRET is not defined');
    if (!process.env.DO_SPACES_BUCKET) throw new Error('DO_SPACES_BUCKET is not defined');

    this.bucketName = process.env.DO_SPACES_BUCKET;
    this.cdnUrl =
      process.env.DO_SPACES_CDN_URL ||
      `https://${this.bucketName}.${process.env.DO_SPACES_ENDPOINT.replace('https://', '')}`;

    this.s3 = new S3Client({
      endpoint: process.env.DO_SPACES_ENDPOINT,
      region: process.env.DO_SPACES_REGION || 'us-east-1',
      credentials: {
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      },
      forcePathStyle: false,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string = 'profiles'): Promise<string> {
    if (!file) throw new BadRequestException('File tidak boleh kosong');

    const isVideoUpload = folder === 'videos' || (folder === 'stories' && file.mimetype.startsWith('video/'));
    const isStoriesFolder = folder === 'stories';

    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    const allowedVideoTypes = ['video/mp4', 'video/webm', 'video/quicktime', 'video/x-msvideo', 'video/mpeg', 'video/ogg', 'video/3gpp', 'video/x-matroska'];

    if (isStoriesFolder) {
      const isValidImage = allowedImageTypes.includes(file.mimetype);
      const isValidVideo = allowedVideoTypes.includes(file.mimetype) || file.mimetype.startsWith('video/');
      if (!isValidImage && !isValidVideo) throw new BadRequestException('File harus berupa gambar atau video');
      if (isValidVideo && file.size > 100 * 1024 * 1024) throw new BadRequestException('Ukuran video maksimal 100MB');
      if (isValidImage && file.size > 10 * 1024 * 1024) throw new BadRequestException('Ukuran gambar maksimal 10MB');
    } else if (isVideoUpload) {
      if (!file.mimetype.startsWith('video/')) throw new BadRequestException('File harus berupa video');
      if (file.size > 100 * 1024 * 1024) throw new BadRequestException('Ukuran video maksimal 100MB');
    } else {
      if (!allowedImageTypes.includes(file.mimetype)) throw new BadRequestException('File harus berupa gambar (jpg, png, webp)');
      if (file.size > 5 * 1024 * 1024) throw new BadRequestException('Ukuran file maksimal 5MB');
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    await this.s3.send(new PutObjectCommand({
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    }));

    return `${this.cdnUrl}/${fileName}`;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.split('.com/')[1];
    await this.s3.send(new DeleteObjectCommand({ Bucket: this.bucketName, Key: key }));
  }

  async getPresignedUploadUrl(folder: string, fileName: string, contentType: string): Promise<PresignedUrlResponse> {
    const allowedImageTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/webp', 'image/gif'];
    const isValidImage = allowedImageTypes.includes(contentType);
    const isValidVideo = contentType.startsWith('video/');
    if (!isValidImage && !isValidVideo) throw new BadRequestException('File harus berupa gambar atau video');

    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

    const command = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
    });

    const uploadUrl = await getSignedUrl(this.s3, command, { expiresIn: 300 });
    return { uploadUrl, fileUrl: `${this.cdnUrl}/${key}`, key };
  }

  async getMultiplePresignedUrls(
    folder: string,
    files: Array<{ fileName: string; contentType: string }>,
  ): Promise<PresignedUrlResponse[]> {
    return Promise.all(files.map((f) => this.getPresignedUploadUrl(folder, f.fileName, f.contentType)));
  }
}
