import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { FollowStatus } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { SpacesService } from '../spaces/spaces.service';
import { UpdateProfileDto } from './dto/update-profile.dto';
import { SearchUsersDto } from './dto/search-users.dto';

@Injectable()
export class UsersService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
  ) {}

  private cleanWebsites(websites: string[] | null | undefined): string[] {
    if (!websites || !Array.isArray(websites)) return [];

    return websites
      .map((w) => {
        if (!w || typeof w !== 'string') return null;

        let cleaned = w.trim();

        // Remove JSON string quotes if present
        if (cleaned.startsWith('"') && cleaned.endsWith('"')) {
          cleaned = cleaned.slice(1, -1).trim();
        }

        return cleaned || null;
      })
      .filter((w): w is string => w !== null && w.length > 0)
      .slice(0, 3);
  }

  async getMyProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        namaLengkap: true,
        isEmailVerified: true,
        createdAt: true,
        googleId: true,
        profile: {
          select: {
            username: true,
            profileImageUrl: true,
            backgroundProfileUrl: true,
            umur: true,
            tanggalLahir: true,
            tempatKelahiran: true,
            bio: true,
            websites: true,
            isOnboardingComplete: true,
          },
        },
      },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Clean websites data
    if (user.profile) {
      user.profile.websites = this.cleanWebsites(user.profile.websites);
    }

    return user;
  }

  async getSuggestions(userId: string, limit: number = 5) {
    // Get IDs of people the user already follows
    const following = await this.prisma.follow.findMany({
      where: { followerId: userId, status: FollowStatus.ACCEPTED },
      select: { followingId: true },
    });

    const followingIds = following.map((f) => f.followingId);

    // Add user's own ID to exclude list
    followingIds.push(userId);

    // Find users not in the following list
    const suggestions = await this.prisma.user.findMany({
      where: {
        id: { notIn: followingIds },
        profile: { isNot: null }, // Only users with profile
      },
      take: limit,
      orderBy: { createdAt: 'desc' }, // Newest users or use a more complex algorithm
      select: {
        id: true,
        namaLengkap: true,
        profile: {
          select: {
            username: true,
            profileImageUrl: true,
          },
        },
      },
    });

    return suggestions.map((user) => ({
      id: user.id,
      username: user.profile?.username,
      namaLengkap: user.namaLengkap,
      profileImageUrl: user.profile?.profileImageUrl,
      isFollowing: false, // By definition
    }));
  }

  async getUserByUsername(username: string, requesterId?: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
      include: {
        user: {
          select: {
            id: true,
            namaLengkap: true,
            createdAt: true,
          },
        },
      },
    });

    if (!profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Public profile view
    return {
      id: profile.user.id,
      username: profile.username,
      namaLengkap: profile.user.namaLengkap,
      profileImageUrl: profile.profileImageUrl,
      backgroundProfileUrl: profile.backgroundProfileUrl,
      umur: profile.umur,
      tempatKelahiran: profile.tempatKelahiran,
      bio: profile.bio,
      websites: this.cleanWebsites(profile.websites),
      memberSince: profile.user.createdAt,
      isOwnProfile: requesterId === profile.user.id,
    };
  }

  async updateProfile(
    userId: string,
    dto: UpdateProfileDto,
    file?: Express.Multer.File,
  ) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Check username uniqueness
    if (dto.username && dto.username !== user.profile?.username) {
      const existingProfile = await this.prisma.profile.findUnique({
        where: { username: dto.username },
      });

      if (existingProfile) {
        throw new BadRequestException('Username sudah digunakan');
      }
    }

    // Upload new profile image if provided
    let profileImageUrl = user.profile?.profileImageUrl;
    if (file) {
      // Delete old image
      if (profileImageUrl) {
        try {
          await this.spacesService.deleteFile(profileImageUrl);
        } catch {
          // Ignore if file doesn't exist
        }
      }
      profileImageUrl = await this.spacesService.uploadFile(file, 'profiles');
    }

    // Calculate age if birthdate changed
    let umur = user.profile?.umur;
    if (dto.tanggalLahir) {
      const birthDate = new Date(dto.tanggalLahir);
      umur = this.calculateAge(birthDate);

      if (umur < 13) {
        throw new BadRequestException('Umur minimal 13 tahun');
      }
    }

    // Update user data
    await this.prisma.user.update({
      where: { id: userId },
      data: {
        namaLengkap: dto.namaLengkap || user.namaLengkap,
      },
      include: { profile: true },
    });

    // Update profile data
    if (user.profile) {
      // Handle websites - ensure it's an array
      let websites = this.cleanWebsites(user.profile.websites);

      if (dto.websites !== undefined) {
        let websitesArray: string[] = [];

        if (Array.isArray(dto.websites)) {
          websitesArray = dto.websites;
        } else if (typeof dto.websites === 'string') {
          // Handle JSON string from FormData
          try {
            const parsed: unknown = JSON.parse(dto.websites);
            websitesArray = Array.isArray(parsed)
              ? parsed.filter(
                  (item): item is string =>
                    typeof item === 'string' && item.trim().length > 0,
                )
              : [dto.websites];
          } catch {
            // If parsing fails, treat as single website
            websitesArray = [dto.websites];
          }
        }

        // Filter out empty strings and limit to max 3
        websites = websitesArray
          .filter((w) => w && typeof w === 'string' && w.trim())
          .slice(0, 3);
      }

      await this.prisma.profile.update({
        where: { userId },
        data: {
          username: dto.username || user.profile.username,
          profileImageUrl,
          umur: umur || user.profile.umur,
          tanggalLahir: dto.tanggalLahir
            ? new Date(dto.tanggalLahir)
            : user.profile.tanggalLahir,
          tempatKelahiran: dto.tempatKelahiran || user.profile.tempatKelahiran,
          bio: dto.bio !== undefined ? dto.bio : user.profile.bio,
          websites,
        },
      });
    }

    return this.getMyProfile(userId);
  }

  async searchUsers(dto: SearchUsersDto) {
    const { q, page = 1, limit = 10 } = dto;
    const skip = (page - 1) * limit;

    const whereClause = q
      ? {
          OR: [
            { username: { contains: q, mode: 'insensitive' as const } },
            {
              user: {
                namaLengkap: { contains: q, mode: 'insensitive' as const },
              },
            },
          ],
        }
      : {};

    const [profiles, total] = await Promise.all([
      this.prisma.profile.findMany({
        where: whereClause,
        skip,
        take: limit,
        select: {
          username: true,
          profileImageUrl: true,
          user: {
            select: {
              id: true,
              namaLengkap: true,
            },
          },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
      this.prisma.profile.count({ where: whereClause }),
    ]);

    return {
      data: profiles.map((profile) => ({
        username: profile.username,
        namaLengkap: profile.user.namaLengkap,
        profileImageUrl: profile.profileImageUrl,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async updateBackgroundProfile(userId: string, file: Express.Multer.File) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user || !user.profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    // Delete old background if exists
    if (user.profile.backgroundProfileUrl) {
      try {
        await this.spacesService.deleteFile(user.profile.backgroundProfileUrl);
      } catch {
        // Ignore if file doesn't exist
      }
    }

    // Upload new background
    const backgroundProfileUrl = await this.spacesService.uploadFile(
      file,
      'profiles/backgrounds',
    );

    // Update profile
    const updatedProfile = await this.prisma.profile.update({
      where: { userId },
      data: { backgroundProfileUrl },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            namaLengkap: true,
            isEmailVerified: true,
            createdAt: true,
          },
        },
      },
    });

    return {
      success: true,
      backgroundProfileUrl: updatedProfile.backgroundProfileUrl,
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
