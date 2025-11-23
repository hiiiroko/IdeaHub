import { User, Video } from '../types';

export const CURRENT_USER: User = {
  id: 'user-1',
  email: 'alex@company.com',
  username: 'Alex Chen',
  uid: '884201',
  avatar: 'https://picsum.photos/seed/user1/200/200',
  createdAt: new Date().toISOString(),
};

const USERS: User[] = [
  CURRENT_USER,
  {
    id: 'user-2',
    email: 'sarah@company.com',
    username: 'Sarah Wu',
    uid: '884202',
    avatar: 'https://picsum.photos/seed/user2/200/200',
    createdAt: new Date(Date.now() - 10000000).toISOString(),
  },
  {
    id: 'user-3',
    email: 'mike@company.com',
    username: 'Mike Ross',
    uid: '884203',
    avatar: 'https://picsum.photos/seed/user3/200/200',
    createdAt: new Date(Date.now() - 20000000).toISOString(),
  },
];

// 用于生成随机视频的辅助函数
const generateVideos = (count: number): Video[] => {
  return Array.from({ length: count }).map((_, i) => {
    const uploader = USERS[i % USERS.length];
    const isPortrait = Math.random() > 0.5;
    // 随机宽高比在 0.56（9:16）到 1.77（16:9）之间
    const aspectRatio = isPortrait ? 0.5625 : 1.77; 
    
    return {
      id: `vid-${i}`,
      title: `Creative Concept #${i + 1}: ${isPortrait ? 'Vertical Ad' : 'Cinematic Cut'}`,
      description: 'This is a draft for the upcoming Q4 campaign. Please review the pacing and color grading.',
      tags: ['Creative', 'Ad', isPortrait ? 'Social' : 'TVC', '3D'],
      videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4', // 占位视频
      coverUrl: `https://picsum.photos/seed/vid${i}/${isPortrait ? 400 : 800}/${isPortrait ? 711 : 450}`,
      aspectRatio: aspectRatio,
      duration: Math.floor(Math.random() * 60) + 10,
      viewCount: Math.floor(Math.random() * 1000),
      likeCount: Math.floor(Math.random() * 100),
      commentCount: Math.floor(Math.random() * 20),
      createdAt: new Date(Date.now() - Math.random() * 1000000000).toISOString(),
      updatedAt: new Date().toISOString(),
      uploaderId: uploader.id,
      uploader: uploader,
      comments: [],
      isLiked: false,
    };
  });
};

export const MOCK_VIDEOS = generateVideos(24);