"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { likePost, unlikePost } from "../../lib/feed/actions";
import { colors, typography, borderRadius, glassPanel, motion as motionConfig } from "../../lib/design/tokens";
import type { Post } from "../../lib/feed/types";
import { CommentsSection } from "./CommentsSection";
import { FeedVideo } from "./FeedVideo";

interface PostCardProps {
  post: Post;
  currentUserId?: string;
  onLikeToggle?: (postId: string, isLiked: boolean) => void;
}

const contentTypeConfig = {
  highlight: { label: "Highlight", color: colors.electricViolet, icon: "⚡" },
  training: { label: "Training", color: colors.success, icon: "🏃" },
  achievement: { label: "Achievement", color: colors.electricViolet, icon: "🏆" },
  match_moment: { label: "Match Moment", color: colors.electricViolet, icon: "⚽" },
  general: { label: "Post", color: colors.muted, icon: "📝" },
};

const verificationBadges = {
  0: { label: "Player", color: colors.muted },
  1: { label: "Verified", color: colors.electricViolet },
  2: { label: "Academy", color: colors.success },
  3: { label: "Pro", color: colors.electricViolet },
  4: { label: "Elite", color: colors.electricViolet },
};

export function PostCard({ post, currentUserId, onLikeToggle }: PostCardProps) {
  const [isLiked, setIsLiked] = useState(post.is_liked_by_user || false);
  const [likesCount, setLikesCount] = useState(post.likes_count);
  const [commentsCount, setCommentsCount] = useState(post.comments_count);
  const [isLoading, setIsLoading] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Intersection Observer for autoplay
  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsInView(entry.isIntersecting);
      },
      { threshold: 0.5 }
    );

    if (cardRef.current) {
      observer.observe(cardRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const contentType = contentTypeConfig[post.content_type];
  const verificationLevel = post.author?.player_profile?.verification_level || 0;
  const verificationBadge = verificationBadges[verificationLevel as keyof typeof verificationBadges];

  const handleLikeToggle = async () => {
    if (!currentUserId || isLoading) return;

    setIsLoading(true);
    const newIsLiked = !isLiked;
    
    // Optimistic update
    setIsLiked(newIsLiked);
    setLikesCount(prev => newIsLiked ? prev + 1 : prev - 1);

    try {
      const result = newIsLiked 
        ? await likePost(post.id)
        : await unlikePost(post.id);

      if (!result.success) {
        // Revert on error
        setIsLiked(!newIsLiked);
        setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
      } else {
        onLikeToggle?.(post.id, newIsLiked);
      }
    } catch {
      // Revert on error
      setIsLiked(!newIsLiked);
      setLikesCount(prev => newIsLiked ? prev - 1 : prev + 1);
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);
    
    if (minutes < 1) return "Just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <motion.article
      ref={cardRef}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="overflow-hidden"
      style={{ 
        ...glassPanel,
        borderRadius: borderRadius.card
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4" style={{ borderBottom: `1px solid ${colors.glass.border}` }}>
        <div className="flex items-center gap-3">
          {/* Avatar */}
          <div 
            className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
            style={{ backgroundColor: colors.electricViolet }}
          >
            {post.author?.full_name?.charAt(0) || "?"}
          </div>
          
          {/* Author Info */}
          <div>
            <div className="flex items-center gap-2">
              <span 
                className="font-semibold text-white"
                style={{ fontFamily: typography.family, fontWeight: typography.semibold, color: colors.white }}
              >
                {post.author?.full_name || "Unknown"}
              </span>
              {verificationLevel > 0 && (
                <span 
                  className="text-xs"
                  style={{ color: verificationBadge.color }}
                >
                  ● {verificationBadge.label}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2 text-xs" style={{ color: colors.muted }}>
              {post.author?.player_profile?.primary_position && (
                <>
                  <span>{post.author.player_profile.primary_position}</span>
                  <span>•</span>
                </>
              )}
              <span>{formatDate(post.created_at)}</span>
            </div>
          </div>
        </div>

        {/* Content Type Badge */}
        <div 
          className="rounded-full px-3 py-1 text-xs font-medium"
          style={{ 
            backgroundColor: `${contentType.color}20`,
            color: contentType.color,
            border: `1px solid ${contentType.color}40`,
            fontFamily: typography.family,
            fontWeight: typography.medium
          }}
        >
          <span className="mr-1">{contentType.icon}</span>
          {contentType.label}
        </div>
      </div>

      {/* Media - Full Bleed */}
      <div className="relative aspect-video" style={{ backgroundColor: colors.deepNavy }}>
        {post.media_type === "video" ? (
          <FeedVideo
            mediaUrl={post.media_url || undefined}
            mediaBucket={post.media_bucket || undefined}
            mediaPath={post.media_path || undefined}
            muxPlaybackId={post.mux_playback_id || undefined}
            trimStart={post.trim_start}
            trimEnd={post.trim_end}
            coverFrameTime={post.cover_frame_time}
            spotlightTime={post.spotlight_time}
            spotlightLabel={post.spotlight_label}
            spotlightX={post.spotlight_x}
            spotlightY={post.spotlight_y}
            spotlightDuration={post.spotlight_duration}
            spotlightStyle={post.spotlight_style}
            spotlightKeyframes={post.spotlight_keyframes}
            autoplay={isInView}
          />
        ) : (
          <img
            src={post.media_url || ''}
            alt={post.caption || "Post image"}
            className="h-full w-full object-cover"
            style={{ borderRadius: 0 }}
          />
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-3">
        {/* Caption */}
        {post.caption && (
          <p 
            style={{ 
              fontFamily: typography.family,
              color: colors.white,
              fontSize: '16px',
              lineHeight: 1.6
            }}
          >
            {post.caption}
          </p>
        )}

        {/* Tags */}
        <div className="flex flex-wrap gap-2">
          {post.position_tag && (
            <div 
              className="rounded-full px-3 py-1 text-xs"
              style={{ 
                ...glassPanel,
                color: colors.white,
                fontFamily: typography.family,
                fontWeight: typography.medium,
                borderRadius: borderRadius.pill
              }}
            >
              ⚽ {post.position_tag}
            </div>
          )}
          {post.club_history_tag && (
            <div 
              className="rounded-full px-3 py-1 text-xs"
              style={{ 
                ...glassPanel,
                color: colors.muted,
                fontFamily: typography.family,
                fontWeight: typography.medium,
                borderRadius: borderRadius.pill
              }}
            >
              🏆 {post.club_history_tag}
            </div>
          )}
          {post.match_tag && (
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-300">
              📅 {post.match_tag}
            </span>
          )}
          {post.training_tag && (
            <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1 text-xs text-slate-300">
              🏃 {post.training_tag}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-3 border-t border-white/10">
          <div className="flex items-center gap-4">
            {/* Like Button */}
            <button
              onClick={handleLikeToggle}
              disabled={!currentUserId || isLoading}
              className={`flex items-center gap-2 text-sm transition-colors ${
                isLiked 
                  ? "text-pink-400" 
                  : "text-slate-400 hover:text-pink-400"
              } ${!currentUserId ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              <svg 
                className="h-5 w-5" 
                fill={isLiked ? "currentColor" : "none"} 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
              <span>{likesCount}</span>
            </button>

            {/* Comments */}
            <button 
              onClick={() => setShowComments(!showComments)}
              className="flex items-center gap-2 text-sm text-slate-400 hover:text-sky-400 transition-colors"
            >
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
              </svg>
              <span>{commentsCount}</span>
            </button>

            {/* Views */}
            <div className="flex items-center gap-2 text-sm text-slate-500">
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              <span>{post.views_count}</span>
            </div>
          </div>

          {/* Share */}
          <button className="text-slate-400 hover:text-white transition-colors">
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
            </svg>
          </button>
        </div>

        {/* Comments Section */}
        <CommentsSection
          postId={post.id}
          currentUserId={currentUserId}
          isOpen={showComments}
          onClose={() => setShowComments(false)}
          commentsCount={commentsCount}
          onCommentAdded={() => setCommentsCount(prev => prev + 1)}
        />
      </div>
    </motion.article>
  );
}
