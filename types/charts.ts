export type LineItem = {
  date: string;
  total_likes: number;
  total_views: number;
  new_videos: number;
};

export type PieItem = { type: string; value: number };

export type SummaryStats = {
  totalViews: number;
  totalLikes: number;
  totalComments: number;
  totalVideos: number;
  publicVideos: number;
  avgDuration: number;
};

export type TopVideoItem = {
  id: string;
  title: string;
  views: number;
  likes: number;
  comments: number;
  createdAt: string;
};
