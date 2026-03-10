export type PostContentType = 'highlight' | 'training' | 'achievement' | 'match_moment' | 'general';
export type MediaType = 'video' | 'image';

export interface Post {
  id: string;
  author_id: string;
  content_type: PostContentType;
  caption: string | null;
  media_url: string | null; // null for videos (resolved from bucket/path), public URL for images
  thumbnail_url: string | null;
  media_type: MediaType;
  
  // New media storage fields
  media_bucket?: string | null;
  media_path?: string | null;
  media_mime_type?: string | null;
  
  // Football metadata fields
  composer_mode?: 'quick' | 'highlight' | null;
  post_type?: 'daily_post' | 'training_update' | 'achievement' | 'general' | null;
  action_type?: 'goal' | 'assist' | 'shot' | 'save' | 'tackle' | 'interception' | 'dribble' | 'key_pass' | 'cross' | 'buildup' | 'training_drill' | 'recovery_run' | 'other' | null;
  opponent?: string | null;
  minute?: number | null;
  competition?: string | null;
  result?: string | null;
  foot_used?: 'left' | 'right' | 'both' | null;
  match_date?: string | null;
  session_name?: string | null;
  location?: string | null;
  clip_type?: 'match_highlight' | 'match_video' | 'training_clip' | null;
  trim_start?: number | null;
  trim_end?: number | null;
  cover_frame_time?: number | null;
  spotlight_time?: number | null;
  spotlight_label?: string | null;
  visibility?: 'public' | 'followers' | null;
  
  // Legacy fields (preserved for backward compatibility)
  position_tag: string | null;
  club_history_tag: string | null;
  match_tag: string | null;
  training_tag: string | null;
  likes_count: number;
  comments_count: number;
  views_count: number;
  is_published: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  
  // Joined data
  author?: {
    id: string;
    full_name: string | null;
    role: string;
    player_profile?: {
      primary_position: string | null;
      verification_level: number;
    };
  };
  
  // User interaction state
  is_liked_by_user?: boolean;
}

export interface CreatePostInput {
  content_type: PostContentType;
  caption: string;
  media_url: string | null; // Allow null for videos (resolved from bucket/path)
  thumbnail_url?: string;
  media_type: MediaType;
  position_tag?: string;
  club_history_tag?: string;
  match_tag?: string;
  training_tag?: string;
}

export interface PostLike {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
}

export interface PostComment {
  id: string;
  post_id: string;
  author_id: string;
  parent_comment_id: string | null;
  content: string;
  likes_count: number;
  created_at: string;
  updated_at: string;
  
  author?: {
    id: string;
    full_name: string | null;
    role?: string;
    avatar_url?: string;
  };
}

export interface FeedFilter {
  contentType?: PostContentType | 'all';
  position?: string;
  followingOnly?: boolean;
  sortBy: 'latest' | 'popular' | 'following';
}
