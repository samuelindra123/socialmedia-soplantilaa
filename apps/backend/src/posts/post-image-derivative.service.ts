import { Injectable, Logger } from '@nestjs/common';
import sharp from 'sharp';
import { encode } from 'blurhash';
import { SpacesService } from '../spaces/spaces.service';

export interface ProcessedPostImageAsset {
  url: string;
  thumbnailUrl: string | null;
  blurhash: string | null;
  width: number | null;
  height: number | null;
  thumbnailWidth: number | null;
  thumbnailHeight: number | null;
}

@Injectable()
export class PostImageDerivativeService {
  private readonly logger = new Logger(PostImageDerivativeService.name);

  constructor(private readonly spacesService: SpacesService) {}

  async processImageAsset(input: {
    url: string;
    file?: Express.Multer.File;
  }): Promise<ProcessedPostImageAsset> {
    try {
      const sourceBuffer = await this.resolveSourceBuffer(
        input.url,
        input.file,
      );

      const sourceMeta = await sharp(sourceBuffer, { failOn: 'none' })
        .rotate()
        .metadata();

      const thumbnailBuffer = await sharp(sourceBuffer, { failOn: 'none' })
        .rotate()
        .resize({
          width: 640,
          height: 640,
          fit: 'inside',
          withoutEnlargement: true,
        })
        .webp({ quality: 70 })
        .toBuffer();

      const thumbMeta = await sharp(thumbnailBuffer).metadata();
      const blurhash = await this.generateBlurhash(sourceBuffer);
      const thumbnailUrl = await this.uploadThumbnail(
        thumbnailBuffer,
        input.url,
      );

      return {
        url: input.url,
        thumbnailUrl,
        blurhash,
        width: sourceMeta.width ?? null,
        height: sourceMeta.height ?? null,
        thumbnailWidth: thumbMeta.width ?? null,
        thumbnailHeight: thumbMeta.height ?? null,
      };
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      this.logger.warn(
        `Failed to generate derivatives for ${input.url}: ${message}`,
      );

      return {
        url: input.url,
        thumbnailUrl: null,
        blurhash: null,
        width: null,
        height: null,
        thumbnailWidth: null,
        thumbnailHeight: null,
      };
    }
  }

  private async resolveSourceBuffer(
    url: string,
    file?: Express.Multer.File,
  ): Promise<Buffer> {
    if (file?.buffer && file.buffer.length > 0) {
      return file.buffer;
    }

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(
        `Download source image failed with status ${response.status}`,
      );
    }

    const arrayBuffer = await response.arrayBuffer();
    return Buffer.from(arrayBuffer);
  }

  private async generateBlurhash(sourceBuffer: Buffer) {
    const raw = await sharp(sourceBuffer, { failOn: 'none' })
      .rotate()
      .resize({
        width: 32,
        height: 32,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });

    if (raw.info.width <= 0 || raw.info.height <= 0) {
      return null;
    }

    return encode(
      new Uint8ClampedArray(raw.data),
      raw.info.width,
      raw.info.height,
      4,
      3,
    );
  }

  private async uploadThumbnail(buffer: Buffer, sourceUrl: string) {
    const safeName =
      sourceUrl
        .split('/')
        .pop()
        ?.replace(/[^a-zA-Z0-9.-]/g, '_')
        .replace(/\.[^.]+$/, '') || 'image';

    const file = {
      buffer,
      originalname: `${safeName}-thumb.webp`,
      mimetype: 'image/webp',
      size: buffer.length,
      fieldname: 'thumbnail',
      encoding: '7bit',
      destination: '',
      filename: '',
      path: '',
      stream: undefined,
    } as unknown as Express.Multer.File;

    return this.spacesService.uploadFile(file, 'posts/thumbnails');
  }
}
