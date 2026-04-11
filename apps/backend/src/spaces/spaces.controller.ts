import { Controller, Get, Query, BadRequestException } from '@nestjs/common';
import { SpacesService } from './spaces.service';

@Controller('spaces')
export class SpacesController {
  constructor(private readonly spacesService: SpacesService) {}

  /**
   * Resolve a fileId to its public Appwrite view URL.
   * GET /spaces/url?fileId=abc123
   * Used by clients that only stored the fileId (not the full URL).
   */
  @Get('url')
  getFileUrl(@Query('fileId') fileId: string) {
    if (!fileId) throw new BadRequestException('fileId is required');
    return { url: this.spacesService.getFileViewUrl(fileId) };
  }
}
