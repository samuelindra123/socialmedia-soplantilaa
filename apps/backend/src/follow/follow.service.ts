import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { FollowStatus, NotificationType } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { NotificationsGateway } from '../notifications/notifications.gateway';

@Injectable()
export class FollowService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
  ) {}

  async requestFollow(followerId: string, username: string) {
    const targetProfile = await this.prisma.profile.findUnique({
      where: { username },
      include: { user: true },
    });

    if (!targetProfile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const followingId = targetProfile.userId;

    if (followerId === followingId) {
      throw new BadRequestException('Tidak bisa follow diri sendiri');
    }

    let followRecord = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (followRecord && followRecord.status === FollowStatus.ACCEPTED) {
      throw new ConflictException('Sudah saling terhubung');
    }

    if (!followRecord) {
      followRecord = await this.prisma.follow.create({
        data: {
          followerId,
          followingId,
          status: FollowStatus.PENDING,
        },
      });
    } else if (followRecord.status === FollowStatus.PENDING) {
      return {
        message: 'Permintaan follow sedang menunggu persetujuan',
        status: followRecord.status,
      };
    } else {
      followRecord = await this.prisma.follow.update({
        where: { id: followRecord.id },
        data: { status: FollowStatus.PENDING },
      });
    }

    const notification = await this.prisma.notification.create({
      data: {
        userId: followingId,
        actorId: followerId,
        type: NotificationType.FOLLOW_REQUEST,
        title: 'Permintaan mengikuti',
        message: 'ingin mengikuti Anda',
        actionUrl: '/notifications?tab=follow',
      },
      include: {
        actor: {
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
        },
      },
    });

    // Send both general notification and follow request event
    this.notificationsGateway.sendNotificationToUser(followingId, notification);
    this.notificationsGateway.sendFollowRequest(followingId, {
      type: 'follow_request',
      fromUserId: followerId,
      notification,
    });

    return {
      message: 'Permintaan follow dikirim',
      status: followRecord.status,
    };
  }

  async acceptFollowRequest(userId: string, followRequestId: string) {
    const result = await this.prisma.$transaction(async (tx) => {
      const request = await tx.follow.findUnique({
        where: { id: followRequestId },
      });

      if (!request) {
        throw new NotFoundException('Permintaan follow tidak ditemukan');
      }

      if (request.followingId !== userId) {
        throw new ForbiddenException(
          'Tidak memiliki akses untuk permintaan ini',
        );
      }

      if (request.status !== FollowStatus.PENDING) {
        throw new ConflictException('Permintaan follow tidak lagi tersedia');
      }

      const updatedRequest = await tx.follow.update({
        where: { id: followRequestId },
        data: { status: FollowStatus.ACCEPTED },
      });

      const reverseRelation = await tx.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: userId,
            followingId: request.followerId,
          },
        },
      });

      if (!reverseRelation) {
        await tx.follow.create({
          data: {
            followerId: userId,
            followingId: request.followerId,
            status: FollowStatus.ACCEPTED,
          },
        });
      } else if (reverseRelation.status !== FollowStatus.ACCEPTED) {
        await tx.follow.update({
          where: { id: reverseRelation.id },
          data: { status: FollowStatus.ACCEPTED },
        });
      }

      return updatedRequest;
    });

    const notification = await this.prisma.notification.create({
      data: {
        userId: result.followerId,
        actorId: result.followingId,
        type: NotificationType.FOLLOW_ACCEPTED,
        title: 'Permintaan follow diterima',
        message: 'kini terhubung dengan Anda',
        actionUrl: `/profile/${await this.getUsername(result.followingId)}`,
      },
      include: {
        actor: {
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
        },
      },
    });

    this.notificationsGateway.sendNotificationToUser(
      result.followerId,
      notification,
    );

    // Send follow accepted event
    this.notificationsGateway.sendFollowAccepted(result.followerId, {
      type: 'follow_accepted',
      byUserId: result.followingId,
      notification,
    });

    return {
      message: 'Permintaan follow diterima',
      mutual: true,
    };
  }

  async rejectFollowRequest(userId: string, followRequestId: string) {
    const request = await this.prisma.follow.findUnique({
      where: { id: followRequestId },
    });

    if (!request) {
      throw new NotFoundException('Permintaan follow tidak ditemukan');
    }

    if (request.followingId !== userId) {
      throw new ForbiddenException('Tidak memiliki akses untuk permintaan ini');
    }

    if (request.status !== FollowStatus.PENDING) {
      throw new ConflictException('Permintaan follow tidak lagi tersedia');
    }

    await this.prisma.follow.update({
      where: { id: followRequestId },
      data: { status: FollowStatus.REJECTED },
    });

    // Send follow rejected event to the requester
    this.notificationsGateway.sendFollowRejected(request.followerId, {
      type: 'follow_rejected',
      byUserId: userId,
    });

    return {
      message: 'Permintaan follow ditolak',
    };
  }

  async followUser(followerId: string, username: string) {
    return this.requestFollow(followerId, username);
  }

  async unfollowUser(followerId: string, username: string) {
    const targetProfile = await this.prisma.profile.findUnique({
      where: { username },
    });

    if (!targetProfile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const followingId = targetProfile.userId;

    const follow = await this.prisma.follow.findUnique({
      where: {
        followerId_followingId: { followerId, followingId },
      },
    });

    if (!follow) {
      throw new NotFoundException('Tidak ada relasi follow untuk dibatalkan');
    }

    await this.prisma.follow.delete({ where: { id: follow.id } });

    return {
      message: 'Berhasil berhenti mengikuti',
    };
  }

  async getFollowers(username: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });

    if (!profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const [followers, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followingId: profile.userId, status: FollowStatus.ACCEPTED },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          follower: {
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
          },
        },
      }),
      this.prisma.follow.count({
        where: { followingId: profile.userId, status: FollowStatus.ACCEPTED },
      }),
    ]);

    return {
      data: followers.map((f) => ({
        user: {
          id: f.follower.id,
          username: f.follower.profile?.username,
          namaLengkap: f.follower.namaLengkap,
          profileImageUrl: f.follower.profile?.profileImageUrl,
        },
        followedAt: f.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async getFollowing(username: string, page: number = 1, limit: number = 20) {
    const skip = (page - 1) * limit;

    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });

    if (!profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const [following, total] = await Promise.all([
      this.prisma.follow.findMany({
        where: { followerId: profile.userId, status: FollowStatus.ACCEPTED },
        skip,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          following: {
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
          },
        },
      }),
      this.prisma.follow.count({
        where: { followerId: profile.userId, status: FollowStatus.ACCEPTED },
      }),
    ]);

    return {
      data: following.map((f) => ({
        user: {
          id: f.following.id,
          username: f.following.profile?.username,
          namaLengkap: f.following.namaLengkap,
          profileImageUrl: f.following.profile?.profileImageUrl,
        },
        followedAt: f.createdAt,
      })),
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async checkFollowStatus(followerId: string, username: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });

    if (!profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const [outgoing, incoming] = await Promise.all([
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId,
            followingId: profile.userId,
          },
        },
      }),
      this.prisma.follow.findUnique({
        where: {
          followerId_followingId: {
            followerId: profile.userId,
            followingId: followerId,
          },
        },
      }),
    ]);

    const isFollowing = outgoing?.status === FollowStatus.ACCEPTED;
    const isPending = outgoing?.status === FollowStatus.PENDING;
    const isMutual = isFollowing && incoming?.status === FollowStatus.ACCEPTED;

    return {
      status: outgoing?.status ?? 'NONE',
      isFollowing,
      isPending,
      isMutual,
      canMessage: isMutual,
    };
  }

  async getFollowStats(username: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { username },
    });

    if (!profile) {
      throw new NotFoundException('User tidak ditemukan');
    }

    const [followersCount, followingCount] = await Promise.all([
      this.prisma.follow.count({
        where: { followingId: profile.userId, status: FollowStatus.ACCEPTED },
      }),
      this.prisma.follow.count({
        where: { followerId: profile.userId, status: FollowStatus.ACCEPTED },
      }),
    ]);

    return {
      followers: followersCount,
      following: followingCount,
    };
  }

  async getMutualFollows(userId: string) {
    // Get users I follow who also follow me back (both ACCEPTED)
    const myFollowing = await this.prisma.follow.findMany({
      where: {
        followerId: userId,
        status: FollowStatus.ACCEPTED,
      },
      select: { followingId: true },
    });

    const followingIds = myFollowing.map((f) => f.followingId);

    const mutualFollows = await this.prisma.follow.findMany({
      where: {
        followerId: { in: followingIds },
        followingId: userId,
        status: FollowStatus.ACCEPTED,
      },
      include: {
        follower: {
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
        },
      },
    });

    return mutualFollows.map((f) => ({
      id: f.follower.id,
      namaLengkap: f.follower.namaLengkap,
      username: f.follower.profile?.username || null,
      profileImageUrl: f.follower.profile?.profileImageUrl || null,
    }));
  }

  private async getUsername(userId: string) {
    const profile = await this.prisma.profile.findUnique({
      where: { userId },
      select: { username: true },
    });

    return profile?.username ?? '';
  }
}
