import {
  Controller,
  Post,
  Body,
  UseGuards,
  Request,
  UseInterceptors,
  UploadedFile,
  Get,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OnboardingService } from './onboarding.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Controller('onboarding')
@UseGuards(JwtAuthGuard)
export class OnboardingController {
  constructor(private onboardingService: OnboardingService) {}

  @Get('status')
  getStatus(@Request() req: { user: { id: string } }) {
    return this.onboardingService.getOnboardingStatus(req.user.id);
  }

  @Post('upload-profile')
  @UseInterceptors(FileInterceptor('file'))
  uploadProfile(
    @Request() req: { user: { id: string } },
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.onboardingService.uploadProfileImage(req.user.id, file);
  }

  @Post('complete')
  completeProfile(
    @Request() req: { user: { id: string } },
    @Body() dto: CompleteProfileDto,
  ) {
    return this.onboardingService.completeProfile(req.user.id, dto);
  }
}
