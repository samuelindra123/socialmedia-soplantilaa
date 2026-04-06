import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { CompleteProfileDto } from './dto/complete-profile.dto';

@Injectable()
export class OnboardingService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  async uploadProfileImage(userId: string, file: Express.Multer.File) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new BadRequestException('User tidak ditemukan');
    }

    // Delete old image if exists
    if (user.profile?.profileImageUrl) {
      try {
        await this.spacesService.deleteFile(user.profile.profileImageUrl);
      } catch {
        // Ignore error if file doesn't exist
      }
    }

    // Upload new image
    const imageUrl = await this.spacesService.uploadFile(file, 'profiles');

    // Update or create profile with image URL
    if (user.profile) {
      await this.prisma.profile.update({
        where: { userId },
        data: { profileImageUrl: imageUrl },
      });
    } else {
      // Create temporary profile with just image
      await this.prisma.profile.create({
        data: {
          userId,
          profileImageUrl: imageUrl,
          username: `temp_${Date.now()}`, // Temporary, will be updated
          umur: 0, // Temporary
          tanggalLahir: new Date(), // Temporary
          tempatKelahiran: '', // Temporary
        },
      });
    }

    return { imageUrl };
  }

  async completeProfile(userId: string, dto: CompleteProfileDto) {
    // Check username availability
    const existingProfile = await this.prisma.profile.findUnique({
      where: { username: dto.username },
    });

    if (existingProfile && existingProfile.userId !== userId) {
      throw new BadRequestException('Username sudah digunakan');
    }

    // Calculate age
    const birthDate = new Date(dto.tanggalLahir);
    const age = this.calculateAge(birthDate);

    if (age < 13) {
      throw new ForbiddenException('Umur minimal 13 tahun');
    }

    // Get current profile
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    // Update or create profile
    const updatedProfile = await this.prisma.profile.upsert({
      where: { userId },
      update: {
        username: dto.username,
        umur: age,
        tanggalLahir: birthDate,
        tempatKelahiran: dto.tempatKelahiran,
        isOnboardingComplete: true,
      },
      create: {
        userId,
        username: dto.username,
        umur: age,
        tanggalLahir: birthDate,
        tempatKelahiran: dto.tempatKelahiran,
        profileImageUrl: profile?.profileImageUrl || null,
        isOnboardingComplete: true,
      },
    });

    return {
      message: 'Onboarding selesai! Selamat datang di platform kami',
      profile: updatedProfile,
    };
  }

  async getOnboardingStatus(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
    });

    return {
      hasProfile: !!profile,
      isComplete: profile?.isOnboardingComplete || false,
      profileImageUrl: profile?.profileImageUrl || null,
    };
  }

  private calculateAge(birthDate: Date): number {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();

    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }

    return age;
  }
}
