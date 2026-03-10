"use client";

import { useState, useCallback, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { getPostComments, addComment } from "../../lib/feed/actions";
import type { PostComment } from "../../lib/feed/types";

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
          className="border-t border-white/10 bg-white/5"
        >
          <div className="p-4 space-y-4">
            {/* Header */}
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">
                Comments ({comments.length})
              </h4>
              <button
                onClick={onClose}
                className="text-slate-400 hover:text-white transition-colors"
              >
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-lg bg-red-500/10 border border-red-500/20 p-2 text-xs text-red-400">
                {error}
              </div>
            )}

            {/* Comments List */}
            <div className="space-y-3 max-h-60 overflow-y-auto">
              {isLoading ? (
                <div className="text-center py-4">
                  <svg className="animate-spin h-5 w-5 text-slate-400 mx-auto" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                  </svg>
                </div>
              ) : comments.length === 0 ? (
                <p className="text-sm text-slate-500 text-center py-4">
                  No comments yet. Be the first to comment!
                </p>
              ) : (
                comments.map((comment) => (
                  <div key={comment.id} className="flex gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-xs font-bold text-white flex-shrink-0">
                      {comment.author?.full_name?.charAt(0) || "?"}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-white text-sm">
                          {comment.author?.full_name || "Unknown"}
                        </span>
                        <span className="text-xs text-slate-500">
                          {new Date(comment.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      <p className="text-sm text-slate-300">{comment.content}</p>
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
                  className="flex-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
                  disabled={isSubmitting}
                />
                <button
                  type="submit"
                  disabled={isSubmitting || !newComment.trim()}
                  className="rounded-lg bg-sky-500 px-4 py-2 text-sm font-medium text-white hover:bg-sky-400 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "..." : "Post"}
                </button>
              </form>
            ) : (
              <p className="text-sm text-slate-500 text-center">
                Log in to add a comment
              </p>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
