import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, FollowStatus } from '@prisma/client';
import { SpacesService } from '../spaces/spaces.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { GetFeedDto } from './dto/get-feed.dto';
import {
  extractHashtags,
  extractMentions,
} from '../common/utils/hashtag-parser';
import { countWords, MAX_CONTENT_WORDS } from '../common/utils/word-count';
import { EventsGateway } from '../events/events.gateway';
import {
  CreatePostFromUrlsDto,
  GetPostPresignedUrlsDto,
  POST_MEDIA_LIMITS,
} from './dto/post-media-upload.dto';
import { PostImageDerivativeService } from './post-image-derivative.service';

const CDN_URL = (process.env.DO_SPACES_CDN_URL || '').replace(/\/$/, '');

const normalizedEndpoint = (process.env.DO_SPACES_ENDPOINT || '').replace(
  /\/$/,
  '',
);
const endpointHost = normalizedEndpoint.replace(/^https?:\/\//, '');
const derivedOriginUrl =
  process.env.DO_SPACES_BUCKET && endpointHost
    ? `https://${process.env.DO_SPACES_BUCKET}.${endpointHost}`
    : '';

const ORIGIN_URL = (
  process.env.DO_SPACES_ORIGIN_URL || derivedOriginUrl
).replace(/\/$/, '');

// Helper to convert origin URL to CDN URL for serving
function toCdnUrl(url: string): string {
  if (!url) return url;

  if (!ORIGIN_URL || !CDN_URL || ORIGIN_URL === CDN_URL) {
    return url;
  }

  return url.replace(ORIGIN_URL, CDN_URL);
}

@Injectable()
export class PostsService {
  constructor(
    private prisma: PrismaService,
    private spacesService: SpacesService,
    private eventsGateway: EventsGateway,
    private imageDerivativeService: PostImageDerivativeService,
  ) {}

  async createPost(
    userId: string,
    dto: CreatePostDto,
    files?: Express.Multer.File[],
    preUploadedMediaUrls?: string[],
  ) {
    if (countWords(dto.content) > MAX_CONTENT_WORDS) {
      throw new BadRequestException(
        `Konten maksimal ${MAX_CONTENT_WORDS.toLocaleString('id-ID')} kata`,
      );
    }

    // Extract hashtags & mentions
    const hashtagNames = extractHashtags(dto.content);
    const mentionUsernames = extractMentions(dto.content);

    // Extract links from content (supports both single and double quotes, and loose spacing)
    const linkRegex = /href\s*=\s*["']([^"']*)["']/g;
    const extractedLinks: string[] = [];
    let match: RegExpExecArray | null;
    while ((match = linkRegex.exec(dto.content)) !== null) {
      if (match[1]) extractedLinks.push(match[1]);
    }

    // Normalize tags: can be string or array from multipart/form-data
    const explicitTags: string[] = Array.isArray(dto.tags)
      ? dto.tags
      : dto.tags
        ? [dto.tags as unknown as string]
        : [];

    // Combine explicit tags with extracted hashtags
    if (explicitTags.length > 0) {
      explicitTags.forEach((tag) => {
        const cleanTag = tag.replace(/^#/, '');
        if (!hashtagNames.includes(cleanTag)) {
          hashtagNames.push(cleanTag);
        }
      });
    }

    // Upload media (images or videos) if provided
    const mediaUrls: string[] = [...(preUploadedMediaUrls || [])];
    if ((!preUploadedMediaUrls || preUploadedMediaUrls.length === 0) && files) {
      for (const file of files) {
        const folder = dto.mediaType === 'video' ? 'videos' : 'posts';
        const url = await this.spacesService.uploadFile(file, folder);
        mediaUrls.push(url);
      }
    }

    const processedImages =
      dto.mediaType !== 'video' && mediaUrls.length > 0
        ? await Promise.all(
            mediaUrls.map((url, index) =>
              this.imageDerivativeService.processImageAsset({
                url,
                file: files?.[index],
              }),
            ),
          )
        : [];

    // Create post with transaction
    const post = await this.prisma.$transaction(async (tx) => {
      // Create post
      const newPost = await tx.post.create({
        data: {
          title: dto.title,
          type: dto.type || (mediaUrls.length > 0 ? 'media' : 'text'),
          content: dto.content,
          links: extractedLinks,
          authorId: userId,
          images:
            dto.mediaType !== 'video'
              ? {
                  create: processedImages.map((image) => ({
                    url: image.url,
                    thumbnailUrl: image.thumbnailUrl,
                    blurhash: image.blurhash,
                    width: image.width,
                    height: image.height,
                    thumbnailWidth: image.thumbnailWidth,
                    thumbnailHeight: image.thumbnailHeight,
                  })),
                }
              : undefined,
          videos:
            dto.mediaType === 'video'
              ? {
                  create: mediaUrls.map((url) => ({ url })),
                }
              : undefined,
        },
      });

      // Handle hashtags
      if (hashtagNames.length > 0) {
        for (const tagName of hashtagNames) {
          // Find or create hashtag
          const hashtag = await tx.hashtag.upsert({
            where: { name: tagName },
            update: { postCount: { increment: 1 } },
            create: { name: tagName, postCount: 1 },
          });

          // Link to post
          await tx.postHashtag.create({
            data: {
              postId: newPost.id,
              hashtagId: hashtag.id,
            },
          });
        }
      }

      // Handle mentions
      if (mentionUsernames.length > 0) {
        for (const username of mentionUsernames) {
          const profile = await tx.profile.findUnique({
            where: { username },
            select: { userId: true },
          });

          if (profile) {
            await tx.mention.create({
              data: {
                postId: newPost.id,
                userId: profile.userId,
              },
            });
          }
        }
      }

      return newPost;
    });

    const fullPost = await this.getPostById(post.id);

    // Emit realtime event for new post
    this.eventsGateway.emitNewPost(fullPost);

    return fullPost;
  }

  async getPresignedUrls(dto: GetPostPresignedUrlsDto) {
    if (!dto.files || dto.files.length === 0) {
      throw new BadRequestException('Minimal 1 file harus dipilih');
    }

    if (dto.files.length > 10) {
      throw new BadRequestException('Maksimal 10 file per upload');
    }

    const mediaType = dto.mediaType || 'image';

    for (const file of dto.files) {
      if (!file.contentType) {
        throw new BadRequestException('contentType wajib diisi');
      }

      if (mediaType === 'image' && !file.contentType.startsWith('image/')) {
        throw new BadRequestException('File harus berupa gambar');
      }

      if (mediaType === 'video' && !file.contentType.startsWith('video/')) {
        throw new BadRequestException('File harus berupa video');
      }

      if (
        mediaType === 'image' &&
        file.fileSize &&
        file.fileSize > POST_MEDIA_LIMITS.MAX_POST_IMAGE_BYTES
      ) {
        throw new BadRequestException('Ukuran gambar maksimal 5MB');
      }

      if (
        mediaType === 'video' &&
        file.fileSize &&
        file.fileSize > POST_MEDIA_LIMITS.MAX_POST_VIDEO_BYTES
      ) {
        throw new BadRequestException('Ukuran video maksimal 100MB');
      }
    }

    const folder = mediaType === 'video' ? 'videos' : 'posts';
    const urls = await this.spacesService.getMultiplePresignedUrls(
      folder,
      dto.files.map((f) => ({
        fileName: f.fileName,
        contentType: f.contentType,
      })),
    );

    return { urls };
  }

  async createPostFromUrls(userId: string, dto: CreatePostFromUrlsDto) {
    if (!dto.mediaUrls || dto.mediaUrls.length === 0) {
      throw new BadRequestException('Minimal 1 mediaUrl harus dikirim');
    }

    if (dto.mediaUrls.length > 10) {
      throw new BadRequestException('Maksimal 10 mediaUrl per postingan');
    }

    const mediaType = dto.mediaType || 'image';
    const invalidUrl = dto.mediaUrls.find(
      (url) => !url || (!url.startsWith('http://') && !url.startsWith('https://')),
    );

    if (invalidUrl) {
      throw new BadRequestException('Semua mediaUrl harus URL absolut yang valid');
    }

    return this.createPost(
      userId,
      {
        title: dto.title,
        content: dto.content,
        type: dto.type || mediaType,
        mediaType,
        tags: dto.tags,
      },
      [],
      dto.mediaUrls,
    );
  }

  async uploadPostVideo(
    userId: string,
    postId: string,
    file: Express.Multer.File,
  ) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post tidak ditemukan');
    if (post.authorId !== userId)
      throw new ForbiddenException('Tidak punya akses untuk upload video');

    if (!file) {
      throw new NotFoundException('Tidak ada file video pada request');
    }
    // Beberapa browser mengirim generic mimetype; tetap izinkan selama ada buffer
    if (file.mimetype && !file.mimetype.startsWith('video/')) {
      // Tetap lanjut tetapi log peringatan
      console.warn('Peringatan: mimetype bukan video, tetap diproses');
    }

    const url = await this.spacesService.uploadFile(file, 'videos');
    console.log(
      `[UploadVideo] user=${userId} postId=${postId} size=${file.size} mimetype=${file.mimetype} url=${url}`,
    );
    // Pastikan koneksi dan tulis ter-commit
    const video = await this.prisma.$transaction(async (tx) => {
      const created = await tx.postVideo.create({ data: { postId, url } });
      return created;
    });
    console.log(
      `[UploadVideo] saved PostVideo id=${video.id} postId=${postId}`,
    );
    return video;
  }

  async getFeed(dto: GetFeedDto & { currentUserId?: string }) {
    const { page = 1, limit = 10, userId, mode, q, type } = dto;
    const skip = (page - 1) * limit;

    // Base filter logic
    let whereClause: Prisma.PostWhereInput = {};

    if (userId) {
      // Filter by User ID
      whereClause = { authorId: userId };
    } else if (mode === 'following' && dto.currentUserId) {
      // Filter by Following
      const following = await this.prisma.follow.findMany({
        where: {
          followerId: dto.currentUserId,
          status: FollowStatus.ACCEPTED,
        },
        select: { followingId: true },
      });
      const followingIds = following.map((f) => f.followingId);
      whereClause = { authorId: { in: followingIds } };
    }

    // Search Query
    if (q) {
      whereClause.OR = [
        { content: { contains: q, mode: 'insensitive' } },
        {
          author: {
            OR: [
              { namaLengkap: { contains: q, mode: 'insensitive' } },
              {
                profile: {
                  is: { username: { contains: q, mode: 'insensitive' } },
                },
              },
            ],
          },
        },
      ];
    }

    // Type Filter (Text vs Media)
    if (type === 'text') {
      // Text only: no images AND no videos
      whereClause.AND = [{ images: { none: {} } }, { videos: { none: {} } }];
    } else if (type === 'media') {
      // Media only: has at least one image OR at least one video
      whereClause.OR = [
        ...(whereClause.OR || []),
        { images: { some: {} } },
        { videos: { some: {} } },
      ];
    }

    const fetchFeedOnce = async () =>
      Promise.all([
        this.prisma.post.findMany({
          where: whereClause,
          skip,
          take: limit,
          include: {
            author: {
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
            images: {
              select: {
                id: true,
                url: true,
                thumbnailUrl: true,
                blurhash: true,
                width: true,
                height: true,
                thumbnailWidth: true,
                thumbnailHeight: true,
              },
            },
            videos: {
              select: {
                id: true,
                url: true,
                thumbnail: true,
                duration: true,
                status: true,
                qualityUrls: true,
              },
            },
            hashtags: {
              select: {
                hashtag: {
                  select: {
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: { likes: true, comments: true, bookmarks: true },
            },
            likes: dto.currentUserId
              ? {
                  where: { userId: dto.currentUserId },
                  select: { userId: true },
                }
              : undefined,
            bookmarks: dto.currentUserId
              ? {
                  where: { userId: dto.currentUserId },
                  select: { userId: true },
                }
              : undefined,
          },
          orderBy: { createdAt: 'desc' },
        }),
        this.prisma.post.count({ where: whereClause }),
      ]);

    type FeedPost = Prisma.PostGetPayload<{
      include: {
        author: {
          select: {
            id: true;
            namaLengkap: true;
            profile: { select: { username: true; profileImageUrl: true } };
          };
        };
        images: {
          select: {
            id: true;
            url: true;
            thumbnailUrl: true;
            blurhash: true;
            width: true;
            height: true;
            thumbnailWidth: true;
            thumbnailHeight: true;
          };
        };
        videos: {
          select: {
            id: true;
            url: true;
            thumbnail: true;
            duration: true;
            status: true;
            qualityUrls: true;
          };
        };
        hashtags: { select: { hashtag: { select: { name: true } } } };
        _count: { select: { likes: true; comments: true; bookmarks: true } };
        likes: { select: { userId: true } };
        bookmarks: { select: { userId: true } };
      };
    }>;

    let posts: FeedPost[] = [];
    let total = 0;
    try {
      const res = await fetchFeedOnce();
      posts = res[0] as FeedPost[];
      total = res[1];
    } catch (e) {
      let code: string | undefined;
      const err = e as Record<string, unknown>;
      const causeVal = err['cause'];
      if (
        typeof causeVal === 'object' &&
        causeVal !== null &&
        'code' in (causeVal as Record<string, unknown>) &&
        typeof (causeVal as Record<string, unknown>)['code'] === 'string'
      ) {
        code = (causeVal as Record<string, unknown>)['code'] as string;
      } else if (typeof err['code'] === 'string') {
        code = err['code'];
      }
      if (code === '08006') {
        await new Promise((r) => setTimeout(r, 300));
        const res = await fetchFeedOnce();
        posts = res[0] as FeedPost[];
        total = res[1];
      } else {
        throw e;
      }
    }

    const followingIds = dto.currentUserId
      ? (
          await this.prisma.follow.findMany({
            where: {
              followerId: dto.currentUserId,
              status: FollowStatus.ACCEPTED,
            },
            select: { followingId: true },
          })
        ).map((f) => f.followingId)
      : [];
    const followingSet = new Set(followingIds);

    return {
      data: posts.map((post) => {
        const isLiked = dto.currentUserId
          ? post.likes.some((l) => l.userId === dto.currentUserId)
          : false;
        const isBookmarked = dto.currentUserId
          ? post.bookmarks.some((b) => b.userId === dto.currentUserId)
          : false;
        const isFollowing = dto.currentUserId
          ? followingSet.has(post.authorId)
          : false;
        return {
          id: post.id,
          title: post.title ?? null,
          type: post.type,
          content: post.content,
          links: post.links,
          authorId: post.authorId,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          author: {
            ...post.author,
            profile: post.author.profile
              ? {
                  ...post.author.profile,
                  profileImageUrl: post.author.profile.profileImageUrl
                    ? toCdnUrl(post.author.profile.profileImageUrl)
                    : null,
                }
              : null,
          },
          images: post.images.map((img) => ({
            ...img,
            url: toCdnUrl(img.url),
            thumbnailUrl: img.thumbnailUrl ? toCdnUrl(img.thumbnailUrl) : null,
          })),
          videos: post.videos.map((vid) => ({
            ...vid,
            url: toCdnUrl(vid.url),
            thumbnail: vid.thumbnail ? toCdnUrl(vid.thumbnail) : null,
          })),
          _count: post._count,
          isLiked,
          isBookmarked,
          isFollowing,
          hashtags: post.hashtags.map((h) => h.hashtag.name),
        };
      }),
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  async getPostById(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: {
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
        images: {
          select: {
            id: true,
            url: true,
            thumbnailUrl: true,
            blurhash: true,
            width: true,
            height: true,
            thumbnailWidth: true,
            thumbnailHeight: true,
          },
        },
        videos: {
          select: {
            id: true,
            url: true,
            thumbnail: true,
          },
        },
        hashtags: {
          select: {
            hashtag: {
              select: {
                name: true,
              },
            },
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    const tags = post.hashtags.map((h) => h.hashtag.name);

    // Convert URLs to CDN for faster serving
    return {
      ...post,
      hashtags: tags,
      images: post.images.map((img) => ({
        ...img,
        url: toCdnUrl(img.url),
        thumbnailUrl: img.thumbnailUrl ? toCdnUrl(img.thumbnailUrl) : null,
      })),
      videos: post.videos.map((vid) => ({
        ...vid,
        url: toCdnUrl(vid.url),
        thumbnail: vid.thumbnail ? toCdnUrl(vid.thumbnail) : null,
      })),
      author: {
        ...post.author,
        profile: post.author.profile
          ? {
              ...post.author.profile,
              profileImageUrl: post.author.profile.profileImageUrl
                ? toCdnUrl(post.author.profile.profileImageUrl)
                : null,
            }
          : null,
      },
    };
  }

  async getPostLikes(postId: string) {
    const likes = await this.prisma.like.findMany({
      where: { postId },
      select: {
        user: {
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

    return likes.map((like) => ({
      id: like.user.id,
      username: like.user.profile?.username,
      namaLengkap: like.user.namaLengkap,
      profileImageUrl: like.user.profile?.profileImageUrl,
    }));
  }

  async updatePost(postId: string, userId: string, dto: UpdatePostDto) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        hashtags: {
          include: {
            hashtag: true,
          },
        },
      },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk mengupdate post ini',
      );
    }

    // Transaction to handle updates
    const updatedPost = await this.prisma.$transaction(async (tx) => {
      // Extract links if content is updated
      let extractedLinks: string[] | undefined;
      if (dto.content) {
        const linkRegex = /href\s*=\s*["']([^"']*)["']/g;
        extractedLinks = [];
        let match: RegExpExecArray | null;
        while ((match = linkRegex.exec(dto.content)) !== null) {
          if (match[1]) extractedLinks.push(match[1]);
        }
      }

      // 1. Update basic fields
      const updated = await tx.post.update({
        where: { id: postId },
        data: {
          content: dto.content !== undefined ? dto.content : post.content,
          title: dto.title !== undefined ? dto.title : post.title,
          links: extractedLinks !== undefined ? extractedLinks : post.links,
        },
      });

      // 2. Handle tags update if provided
      if (dto.tags) {
        // Clean tags
        const newTags = dto.tags.map((t) => t.replace(/^#/, ''));

        // Extract hashtags from content if content updated
        const contentHashtags = dto.content ? extractHashtags(dto.content) : [];

        // Merge explicit tags and content hashtags
        const allTags = [...new Set([...newTags, ...contentHashtags])];

        // Get current tags
        const currentTagNames = post.hashtags.map((h) => h.hashtag.name);

        // Determine tags to add and remove
        const tagsToAdd = allTags.filter((t) => !currentTagNames.includes(t));
        const tagsToRemove = currentTagNames.filter(
          (t) => !allTags.includes(t),
        );

        // Remove old tags
        if (tagsToRemove.length > 0) {
          // Find hashtag IDs to remove connection
          const hashtagsToRemove = await tx.hashtag.findMany({
            where: { name: { in: tagsToRemove } },
            select: { id: true, name: true },
          });

          const hashtagIdsToRemove = hashtagsToRemove.map((h) => h.id);

          if (hashtagIdsToRemove.length > 0) {
            await tx.postHashtag.deleteMany({
              where: {
                postId: postId,
                hashtagId: { in: hashtagIdsToRemove },
              },
            });

            // Decrement count
            for (const tag of hashtagsToRemove) {
              await tx.hashtag.update({
                where: { id: tag.id },
                data: { postCount: { decrement: 1 } },
              });
            }
          }
        }

        // Add new tags
        if (tagsToAdd.length > 0) {
          for (const tagName of tagsToAdd) {
            const hashtag = await tx.hashtag.upsert({
              where: { name: tagName },
              update: { postCount: { increment: 1 } },
              create: { name: tagName, postCount: 1 },
            });

            await tx.postHashtag.create({
              data: {
                postId: postId,
                hashtagId: hashtag.id,
              },
            });
          }
        }
      }

      return updated;
    });

    // Return updated post with full details
    return this.getPostById(updatedPost.id);
  }

  async deletePost(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: { images: true },
    });

    if (!post) {
      throw new NotFoundException('Post tidak ditemukan');
    }

    if (post.authorId !== userId) {
      throw new ForbiddenException(
        'Anda tidak memiliki akses untuk menghapus post ini',
      );
    }

    // Delete images from storage
    await Promise.allSettled(
      post.images.map((image) => this.spacesService.deleteFile(image.url)),
    );

    // Delete post (cascade will delete images from DB)
    await this.prisma.post.delete({
      where: { id: postId },
    });

    return { message: 'Post berhasil dihapus' };
  }

  async getUserPosts(userId: string, page: number = 1, limit: number = 10) {
    return this.getFeed({ userId, page, limit });
  }
}
