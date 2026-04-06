import { Injectable, BadRequestException } from '@nestjs/common';
import * as AWS from 'aws-sdk';

export interface PresignedUrlResponse {
  uploadUrl: string;
  fileUrl: string;
  key: string;
}

@Injectable()
export class SpacesService {
  private readonly s3: AWS.S3;
  private readonly bucketName: string;
  private readonly cdnUrl: string;

  constructor() {
    if (!process.env.DO_SPACES_ENDPOINT) {
      throw new Error('DO_SPACES_ENDPOINT is not defined');
    }
    if (!process.env.DO_SPACES_KEY) {
      throw new Error('DO_SPACES_KEY is not defined');
    }
    if (!process.env.DO_SPACES_SECRET) {
      throw new Error('DO_SPACES_SECRET is not defined');
    }
    if (!process.env.DO_SPACES_BUCKET) {
      throw new Error('DO_SPACES_BUCKET is not defined');
    }

    this.bucketName = process.env.DO_SPACES_BUCKET;
    // CDN URL for serving files
    this.cdnUrl =
      process.env.DO_SPACES_CDN_URL ||
      `https://${this.bucketName}.${process.env.DO_SPACES_ENDPOINT?.replace('https://', '')}`;

    const spacesEndpoint = new AWS.Endpoint(process.env.DO_SPACES_ENDPOINT);
    this.s3 = new AWS.S3({
      endpoint: spacesEndpoint.href,
      credentials: new AWS.Credentials({
        accessKeyId: process.env.DO_SPACES_KEY,
        secretAccessKey: process.env.DO_SPACES_SECRET,
      }),
      s3ForcePathStyle: false,
      signatureVersion: 'v4',
    });
  }

  async uploadFile(
    file: Express.Multer.File,
    folder: string = 'profiles',
  ): Promise<string> {
    if (!file) {
      throw new BadRequestException('File tidak boleh kosong');
    }

    // Determine if this is a video upload based on folder OR mimetype for stories
    const isVideoUpload =
      folder === 'videos' ||
      (folder === 'stories' && file.mimetype.startsWith('video/'));

    // For stories folder, allow both images and videos
    const isStoriesFolder = folder === 'stories';

    // Validate file type based on folder
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/gif',
    ];
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/mpeg',
      'video/ogg',
      'video/3gpp',
      'video/x-matroska',
    ];

    if (isStoriesFolder) {
      // For stories, allow both images and videos
      const isValidImage = allowedImageTypes.includes(file.mimetype);
      const isValidVideo =
        allowedVideoTypes.includes(file.mimetype) ||
        file.mimetype.startsWith('video/');

      if (!isValidImage && !isValidVideo) {
        throw new BadRequestException(
          'File harus berupa gambar (jpg, png, webp, gif) atau video (mp4, webm, mov)',
        );
      }

      // Max 100MB for story videos, 10MB for images
      if (isValidVideo && file.size > 100 * 1024 * 1024) {
        throw new BadRequestException('Ukuran video maksimal 100MB');
      }
      if (isValidImage && file.size > 10 * 1024 * 1024) {
        throw new BadRequestException('Ukuran gambar maksimal 10MB');
      }
    } else if (isVideoUpload) {
      // For video uploads, allow video types
      if (!file.mimetype.startsWith('video/')) {
        throw new BadRequestException(
          'File harus berupa video (mp4, webm, mov, avi, dll)',
        );
      }
      // Max 100MB for videos
      if (file.size > 100 * 1024 * 1024) {
        throw new BadRequestException('Ukuran video maksimal 100MB');
      }
    } else {
      // For other image uploads, only allow image types
      if (!allowedImageTypes.includes(file.mimetype)) {
        throw new BadRequestException(
          'File harus berupa gambar (jpg, png, webp)',
        );
      }
      // Max 5MB for images
      if (file.size > 5 * 1024 * 1024) {
        throw new BadRequestException('Ukuran file maksimal 5MB');
      }
    }

    const fileName = `${folder}/${Date.now()}-${file.originalname}`;

    const params = {
      Bucket: this.bucketName,
      Key: fileName,
      Body: file.buffer,
      ACL: 'public-read',
      ContentType: file.mimetype,
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async deleteFile(fileUrl: string): Promise<void> {
    const key = fileUrl.split('.com/')[1];

    const params = {
      Bucket: this.bucketName,
      Key: key,
    };

    await this.s3.deleteObject(params).promise();
  }

  /**
   * Generate presigned URL for direct upload from frontend
   * This allows faster uploads by bypassing the backend
   */
  async getPresignedUploadUrl(
    folder: string,
    fileName: string,
    contentType: string,
  ): Promise<PresignedUrlResponse> {
    // Validate content type
    const allowedImageTypes = [
      'image/jpeg',
      'image/png',
      'image/jpg',
      'image/webp',
      'image/gif',
    ];
    const allowedVideoTypes = [
      'video/mp4',
      'video/webm',
      'video/quicktime',
      'video/x-msvideo',
      'video/mpeg',
      'video/ogg',
      'video/3gpp',
      'video/x-matroska',
    ];

    const isValidImage = allowedImageTypes.includes(contentType);
    const isValidVideo =
      allowedVideoTypes.includes(contentType) ||
      contentType.startsWith('video/');

    if (!isValidImage && !isValidVideo) {
      throw new BadRequestException(
        'File harus berupa gambar (jpg, png, webp, gif) atau video (mp4, webm, mov)',
      );
    }

    // Generate unique key
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${Date.now()}-${sanitizedFileName}`;

    const params = {
      Bucket: this.bucketName,
      Key: key,
      ContentType: contentType,
      ACL: 'public-read',
      Expires: 300, // URL expires in 5 minutes
    };

    const uploadUrl = await this.s3.getSignedUrlPromise('putObject', params);
    const fileUrl = `${this.cdnUrl}/${key}`;

    return {
      uploadUrl,
      fileUrl,
      key,
    };
  }

  /**
   * Generate multiple presigned URLs for batch upload
   */
  async getMultiplePresignedUrls(
    folder: string,
    files: Array<{ fileName: string; contentType: string }>,
  ): Promise<PresignedUrlResponse[]> {
    const results: PresignedUrlResponse[] = [];

    for (const file of files) {
      const result = await this.getPresignedUploadUrl(
        folder,
        file.fileName,
        file.contentType,
      );
      results.push(result);
    }

    return results;
  }
}
