"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPostComments, addComment } from "../../lib/feed/actions";
import type { PostComment } from "../../lib/feed/types";
import { colors, typography, styles, borderRadius } from "../../lib/design/tokens";

interface CommentsSectionProps {
  postId: string;
  currentUserId?: string;
  isOpen: boolean;
  onClose: () => void;
  commentsCount: number;
  onCommentAdded?: () => void;
}

export function CommentsSection({ postId, currentUserId, isOpen, onClose, commentsCount, onCommentAdded }: CommentsSectionProps) {
  const [comments, setComments] = useState<PostComment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadComments = useCallback(async () => {
    if (!isOpen) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const result = await getPostComments(postId);
      if (result.error) {
        setError(result.error);
      } else {
        setComments(result.comments);
      }
    } catch {
      setError("Failed to load comments");
    } finally {
      setIsLoading(false);
    }
  }, [postId, isOpen]);

  useEffect(() => {
    if (isOpen) {
      loadComments();
    }
  }, [isOpen, loadComments]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !currentUserId) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await addComment(postId, newComment.trim());
      if (result.success && result.comment) {
        setComments(prev => [...prev, result.comment!]);
        onCommentAdded?.();
        setNewComment("");
      } else {
        setError(result.error || "Failed to add comment");
      }
    } catch {
      setError("An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          style={{ 
            borderTop: `1px solid ${colors.surface}`,
            backgroundColor: colors.card
          }}
        >
          <div style={{ padding: "16px" }} className="space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 
                className="text-sm font-semibold"
                style={{ 
                  ...styles.displayHeader,
                  color: colors.white
                }}
              >
                Comments ({comments.length})
              </h4>
              <button
                onClick={onClose}
                className="transition-colors"
                style={{ color: colors.muted }}
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div 
                className="p-2 text-xs"
                style={{ 
                  ...styles.sheetBorder,
                  backgroundColor: `${colors.danger}10`, 
                  border: `1px solid ${colors.danger}30`,
                  color: colors.danger
                }}
              >
                {error}
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3" style={{ maxHeight: "240px", overflowY: "auto" }}>
              {isLoading ? (
                <div className="text-center py-4">
                  <svg 
                    className="animate-spin h-5 w-5 mx-auto" 
                    style={{ color: colors.muted }} 
                    viewBox="0 0 24 24"
                  >
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : comments.length === 0 ? (
                <p 
                  className="text-sm text-center py-4"
                  style={{ color: colors.muted }}
                >
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div 
                      className="flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white flex-shrink-0"
                      style={{ 
                        ...styles.pillBorder,
                        backgroundColor: colors.accent
                      }}
                    >
                      {comment.author?.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span 
                          className="font-medium text-sm"
                          style={{ 
                            ...styles.displayHeader,
                            color: colors.white
                          }}
                        >
                          {comment.author?.full_name || "Unknown"}
                        </span>
                        <span 
                          className="text-xs"
                          style={{ color: colors.muted }}
                        >
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p 
                        className="text-sm"
                        style={{ 
                          fontFamily: typography.body,
                          color: colors.white
                        }}
                      >
                        {comment.content}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Add Comment */}
            {currentUserId ? (
              <form onSubmit={handleSubmit} className="flex gap-3">
                <input
                  type="text"
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  placeholder="Add a comment..."
                  className="flex-1 px-3 py-2 text-sm outline-none transition-all"
                  style={{ 
                    ...styles.buttonBorder,
                    backgroundColor: colors.input, 
                    border: `1px solid ${colors.surface}`, 
                    color: colors.white,
                    fontFamily: typography.body
                  }}
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="px-4 py-2 text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  style={{ 
                    ...styles.buttonBorder,
                    backgroundColor: colors.accent, 
                    color: colors.white,
                    fontFamily: typography.display,
                    fontWeight: "bold",
                    textTransform: "uppercase",
                    letterSpacing: "0.05em"
                  }}
                >
                  {isSubmitting ? "..." : "POST"}
                </button>
              </form>
            ) : (
              <p 
                className="text-sm text-center"
                style={{ color: colors.muted }}
              >
                Log in to add a comment
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
