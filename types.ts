export interface User {
  id: string;
  email: string;
  username: string;
  uid: string;
  avatar?: string;
  createdAt: string;
}

export interface Comment {
  id: string;
  content: string;
  userId: string;
  videoId: string;
  createdAt: string;
  user?: User; // Joined for UI convenience
}

export interface Video {
  id: string;
  title: string;
  description?: string;
  tags: string[];
  videoUrl: string;
  coverUrl: string;
  aspectRatio: number;
  duration: number;
  viewCount: number;
  likeCount: number;
  commentCount: number;
  createdAt: string;
  updatedAt: string;
  uploaderId: string;
  uploader?: User; // Joined for UI convenience
  comments?: Comment[];
  isLiked?: boolean; // UI state helper
  isHydrated?: boolean; // Data has been enriched from backend join
}

export enum SortOption {
  LATEST = 'latest',
  MOST_VIEWED = 'most_viewed',
  MOST_LIKED = 'most_liked',
}

export enum TimeRange {
  ALL = 'all',
  TODAY = 'today',
  WEEK = 'week',
  MONTH = 'month',
}