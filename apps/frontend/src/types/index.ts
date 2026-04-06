// User Types
export interface User {
  id: string;
  email: string;
  namaLengkap: string;
  isEmailVerified: boolean;
  createdAt: string;
  googleId?: string | null;
  profile?: Profile;
}

export interface Profile {
  username: string;
  profileImageUrl: string | null;
  backgroundProfileUrl?: string | null;
  bio?: string | null;
  websites?: string[];
  umur: number;
  tanggalLahir: string;
  tempatKelahiran: string;
  isOnboardingComplete: boolean;
}

// Auth Types
export interface SessionSummary {
  id: string;
  deviceName?: string | null;
  ipAddress?: string | null;
  lastSeen: string;
  createdAt: string;
}

export interface LoginSession extends SessionSummary {
  token: string;
}

export interface LoginResponse {
  accessToken: string;
  user: User;
  session: LoginSession;
}

export interface RegisterData {
  namaLengkap: string;
  email: string;
  password: string;
}

// Post Types
export interface Post {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  author: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
  images: PostImage[];
  videos?: PostVideo[]; // Added videos
  _count: {
    likes: number;
    comments: number;
    bookmarks: number;
  };
  isLiked?: boolean;
  isBookmarked?: boolean;
  title?: string; // Added title
  type?: 'text' | 'media' | 'image' | 'video'; // Added type with image and video
  hashtags?: string[]; // Added hashtags
  links?: string[]; // Added links
  isFollowing?: boolean; // Added isFollowing
}

export interface PostImage {
  id: string;
  url: string;
  thumbnailUrl?: string | null;
  blurhash?: string | null;
  width?: number | null;
  height?: number | null;
  thumbnailWidth?: number | null;
  thumbnailHeight?: number | null;
  createdAt: string;
}

export interface PostVideo {
  id: string;
  url: string; // Deprecated - use originalUrl or processedUrl
  originalUrl: string; // ⚡ For instant playback
  processedUrl: string; // Current best quality URL
  thumbnailUrl: string | null;
  status: 'READY' | 'PROCESSING' | 'COMPLETED' | 'FAILED';
  qualityUrls: {
    '144p'?: string;
    '240p'?: string;
    '360p'?: string;
    '480p'?: string;
    '720p'?: string;
  } | null;
  duration?: number;
  width?: number;
  height?: number;
  createdAt: string;
}

// Video Types
export enum VideoStatus {
  READY = 'READY',
  PROCESSING = 'PROCESSING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

// Comment Types
export interface Comment {
  id: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  userId?: string;
  user: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
  replies?: Comment[];
  _count?: {
    likes?: number;
    replies?: number;
  };
  isLiked?: boolean;
}

// Notification Types
export interface Notification {
  id: string;
  type: 'LIKE' | 'COMMENT' | 'FOLLOW' | 'MENTION' | 'FOLLOW_REQUEST' | 'FOLLOW_ACCEPTED' | 'MESSAGE';
  title: string;
  message: string;
  actionUrl: string | null;
  isRead: boolean;
  createdAt: string;
  actor?: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
}

export interface FollowRequest {
  id: string;
  requestedAt: string;
  follower: {
    id: string;
    namaLengkap: string;
    username?: string | null;
    profileImageUrl?: string | null;
  };
}

export type MessageNotification = Notification;

// Blog Types
export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: 'ProductAndVision' | 'Engineering' | 'Design' | 'Culture';
  readTimeMinutes: number;
  publishedAt: string | null;
  authorName: string;
  authorRole: string;
  tags: string[];
  status: 'DRAFT' | 'SCHEDULED' | 'PUBLISHED';
  body: string | null;
  createdAt: string;
  updatedAt: string;
}

// Story Types
export interface Story {
  id: string;
  mediaUrl: string;
  mediaType: 'IMAGE' | 'VIDEO';
  caption: string | null;
  expiresAt: string;
  createdAt: string;
  user: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
  _count: {
    views: number;
  };
}

// Message Types
export interface Conversation {
  id: string;
  isGroup: boolean;
  name: string | null;
  participants: {
    user: {
      id: string;
      namaLengkap: string;
      profile?: {
        username: string;
        profileImageUrl: string | null;
      };
    };
  }[];
  lastMessage?: Message;
  lastMessageAt: string | null;
}

export interface Message {
  id: string;
  content: string;
  mediaUrl: string | null;
  messageType: 'TEXT' | 'IMAGE' | 'VIDEO' | 'FILE';
  isEdited: boolean;
  isDeleted: boolean;
  createdAt: string;
  sender: {
    id: string;
    namaLengkap: string;
    profile?: {
      username: string;
      profileImageUrl: string | null;
    };
  };
}

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}
