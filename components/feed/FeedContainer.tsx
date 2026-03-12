"use client";

import { useEffect, useState, useCallback } from "react";
import { motion } from "framer-motion";
import { getFeedPosts, getFollowingFeed } from "../../lib/feed/actions";
import { PostCard } from "./PostCard";
import { CreatePostForm } from "./CreatePostForm";
import { FeedFilterBar } from "./FeedFilter";
import type { Post, FeedFilter } from "../../lib/feed/types";
import { colors, typography, styles, borderRadius } from "../../lib/design/tokens";

interface FeedContainerProps {
  currentUserId?: string;
  userRole?: string;
}

export function FeedContainer({ currentUserId, userRole }: FeedContainerProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  
  const [filter, setFilter] = useState<FeedFilter>({
    sortBy: 'latest',
  });

  const fetchPosts = useCallback(async (pageNum: number, isInitial: boolean = false) => {
    if (isInitial) {
      setIsLoading(true);
    } else {
      setIsLoadingMore(true);
    }
    setError(null);

    try {
      let result;
      
      if (filter.sortBy === 'following' && currentUserId) {
        result = await getFollowingFeed(pageNum);
      } else {
        result = await getFeedPosts(filter, pageNum);
      }

      if (result.error) {
        setError(result.error);
      } else {
        if (isInitial) {
          setPosts(result.posts);
        } else {
          setPosts(prev => [...prev, ...result.posts]);
        }
        setHasMore(result.posts.length === 20);
      }
    } catch (err) {
      setError("Failed to load posts");
    } finally {
      setIsLoading(false);
      setIsLoadingMore(false);
    }
  }, [filter, currentUserId]);

  useEffect(() => {
    setPage(1);
    fetchPosts(1, true);
  }, [filter, fetchPosts]);

  const handleLoadMore = () => {
    const nextPage = page + 1;
    setPage(nextPage);
    fetchPosts(nextPage, false);
  };

  const handlePostCreated = () => {
    // Refresh feed
    setPage(1);
    fetchPosts(1, true);
  };

  const handleLikeToggle = (postId: string, isLiked: boolean) => {
    setPosts(prev => prev.map(post => 
      post.id === postId 
        ? { ...post, is_liked_by_user: isLiked, likes_count: isLiked ? post.likes_count + 1 : post.likes_count - 1 }
        : post
    ));
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Create Post (only for athletes) */}
      {userRole === 'athlete' && (
        <CreatePostForm onPostCreated={handlePostCreated} />
      )}

      {/* Filters */}
      <FeedFilterBar 
        filter={filter} 
        onFilterChange={setFilter}
        currentUserId={currentUserId}
      />

      {/* Posts */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse" style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}`, padding: "24px" }}>
              <div className="flex items-center gap-4 mb-4">
                <div className="h-10 w-10 rounded-full" style={{ backgroundColor: colors.surface }} />
                <div className="space-y-2">
                  <div className="h-4 w-32 rounded" style={{ backgroundColor: colors.surface }} />
                  <div className="h-3 w-20 rounded" style={{ backgroundColor: colors.surface }} />
                </div>
              </div>
              <div className="aspect-video rounded-lg mb-4" style={{ backgroundColor: colors.surface }} />
              <div className="space-y-2">
                <div className="h-4 w-full rounded" style={{ backgroundColor: colors.surface }} />
                <div className="h-4 w-2/3 rounded" style={{ backgroundColor: colors.surface }} />
              </div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center p-8" style={{ ...styles.sheetBorder, backgroundColor: `${colors.danger}10`, border: `1px solid ${colors.danger}30` }}>
          <p style={{ color: colors.danger, marginBottom: "16px" }}>{error}</p>
          <button
            onClick={() => fetchPosts(1, true)}
            className="px-4 py-2 text-sm transition-all"
            style={{ 
              ...styles.pillBorder,
              backgroundColor: `${colors.danger}20`, 
              border: `1px solid ${colors.danger}40`,
              color: colors.danger
            }}
          >
            Try again
          </button>
        </div>
      ) : posts.length === 0 ? (
        <div className="text-center p-12" style={{ ...styles.sheetBorder, backgroundColor: colors.card, border: `1px solid ${colors.surface}` }}>
          <div className="text-4xl mb-4">📭</div>
          <h3 style={{ fontSize: "18px", color: colors.white, marginBottom: "8px", fontFamily: typography.display, fontWeight: "bold", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            No posts yet
          </h3>
          <p style={{ color: colors.muted, marginBottom: "24px" }}>
            {filter.sortBy === 'following' 
              ? "Follow some players to see their posts here"
              : "Be the first to share a highlight or training moment"
            }
          </p>
          {filter.sortBy === 'following' && (
            <button
              onClick={() => setFilter({ sortBy: 'latest' })}
              className="px-4 py-2 text-sm font-semibold transition-all"
              style={{ 
                ...styles.pillBorder,
                backgroundColor: colors.accent, 
                color: colors.white
              }}
            >
              Explore all posts
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {posts.map((post, index) => (
            <motion.div
              key={post.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <PostCard 
                post={post} 
                currentUserId={currentUserId}
                onLikeToggle={handleLikeToggle}
              />
            </motion.div>
          ))}

          {/* Load More */}
          {hasMore && (
            <div className="flex justify-center pt-4">
              <button
                onClick={handleLoadMore}
                disabled={isLoadingMore}
                className="px-6 py-3 text-sm font-medium transition-all disabled:opacity-50"
                style={{ 
                  ...styles.pillBorder,
                  backgroundColor: colors.card, 
                  color: colors.muted,
                  border: `1px solid ${colors.surface}`
                }}
              >
                {isLoadingMore ? (
                  <span className="flex items-center gap-2">
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                    </svg>
                    Loading...
                  </span>
                ) : (
                  "Load more posts"
                )}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
