"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { createPost } from "../../../lib/feed/actions";
import { MediaUploader } from "../../../components/feed/MediaUploader";
import type { PostContentType, MediaType } from "../../../lib/feed/types";

interface CreatePostClientProps {
  userId: string;
}

const contentTypes: { value: PostContentType; label: string; icon: string; description: string }[] = [
  { value: "highlight", label: "Highlight", icon: "⚡", description: "Best moments from matches" },
  { value: "training", label: "Training", icon: "🏃", description: "Training sessions and drills" },
  { value: "achievement", label: "Achievement", icon: "🏆", description: "Awards, milestones, accomplishments" },
  { value: "match_moment", label: "Match Moment", icon: "⚽", description: "Goals, assists, key plays" },
  { value: "general", label: "General", icon: "📝", description: "Updates, thoughts, announcements" },
];

const positions = [
  "Goalkeeper",
  "Centre-Back",
  "Left-Back",
  "Right-Back",
  "Defensive Midfielder",
  "Central Midfielder",
  "Attacking Midfielder",
  "Left Winger",
  "Right Winger",
  "Striker",
  "Forward",
];

export function CreatePostClient({ userId }: CreatePostClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [contentType, setContentType] = useState<PostContentType>("highlight");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("video");
  const [positionTag, setPositionTag] = useState("");
  const [clubHistoryTag, setClubHistoryTag] = useState("");
  const [matchTag, setMatchTag] = useState("");
  const [trainingTag, setTrainingTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  const handlePreview = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaUrl.trim()) {
      setError("Please upload or provide a media URL");
      return;
    }
    
    // Store current form data in sessionStorage for edit page
    const formData = {
      contentType,
      caption,
      mediaUrl,
      mediaType,
      positionTag,
      clubHistoryTag,
      matchTag,
      trainingTag,
    };
    sessionStorage.setItem('postFormData', JSON.stringify(formData));
    
    router.push('/post/edit');
  };

  const handlePublish = async () => {
    console.log("[CreatePost] Publishing post");
    
    setIsLoading(true);
    setError(null);

    try {
      console.log("[CreatePost] Calling createPost with:", {
        content_type: contentType,
        caption: caption.trim(),
        media_url: mediaUrl.trim(),
        media_type: mediaType,
      });
      
      const result = await createPost({
        content_type: contentType,
        caption: caption.trim(),
        media_url: mediaUrl.trim(),
        media_type: mediaType,
        position_tag: positionTag || undefined,
        club_history_tag: clubHistoryTag || undefined,
        match_tag: matchTag || undefined,
        training_tag: trainingTag || undefined,
      });

      console.log("[CreatePost] Result:", result);

      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          router.push("/feed");
        }, 2000);
      } else {
        setError(result.error || "Failed to create post");
      }
    } catch (err) {
      console.error("[CreatePost] Error:", err);
      setError("An error occurred while creating the post");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-12 text-center"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Post Created!</h2>
        <p className="text-emerald-300">Your post is now live on the feed.</p>
        <p className="text-sm text-slate-400 mt-4">Redirecting to feed...</p>
      </motion.div>
    );
  }

  // Preview Screen
  if (showPreview) {
    const contentTypeConfig = {
      highlight: { label: "Highlight", color: "text-violet-400 bg-violet-500/10 border-violet-500/20", icon: "⚡" },
      training: { label: "Training", color: "text-emerald-400 bg-emerald-500/10 border-emerald-500/20", icon: "🏃" },
      achievement: { label: "Achievement", color: "text-amber-400 bg-amber-500/10 border-amber-500/20", icon: "🏆" },
      match_moment: { label: "Match Moment", color: "text-sky-400 bg-sky-500/10 border-sky-500/20", icon: "⚽" },
      general: { label: "General", color: "text-slate-400 bg-slate-500/10 border-slate-500/20", icon: "📝" },
    };
    const selectedContentType = contentTypeConfig[contentType];

    return (
      <div className="space-y-4">
        {/* Preview Header */}
        <div className="flex items-center justify-between mb-2">
          <button
            onClick={() => setShowPreview(false)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-all"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
            <span className="font-medium">Edit</span>
          </button>
          <h2 className="text-xl font-bold text-white">Preview</h2>
          <div className="w-20" />
        </div>

        {/* Post Preview Card */}
        <motion.article
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm overflow-hidden shadow-2xl"
        >
          {/* Post Header */}
          <div className="flex items-center justify-between p-4 border-b border-white/10">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-sky-500 to-indigo-500 text-sm font-bold text-white">
                {userId?.charAt(0)?.toUpperCase() || "U"}
              </div>
              <div>
                <div className="font-semibold text-white">You</div>
                <div className="text-xs text-slate-400">Just now</div>
              </div>
            </div>
            <span className={`rounded-full border px-3 py-1 text-xs font-medium ${selectedContentType.color}`}>
              <span className="mr-1">{selectedContentType.icon}</span>
              {selectedContentType.label}
            </span>
          </div>

          {/* Media */}
          <div className="relative aspect-video bg-slate-900">
            {mediaType === "video" ? (
              <video src={mediaUrl} controls className="h-full w-full object-cover" />
            ) : (
              <img src={mediaUrl} alt="Preview" className="h-full w-full object-cover" />
            )}
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Caption */}
            {caption ? (
              <p className="text-slate-200 leading-relaxed">{caption}</p>
            ) : (
              <p className="text-slate-500 italic text-sm">No caption added</p>
            )}
            
            {/* Tags */}
            {(positionTag || clubHistoryTag || matchTag || trainingTag) && (
              <div className="flex flex-wrap gap-2 pt-2">
                {positionTag && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-slate-300 font-medium">
                    ⚽ {positionTag}
                  </span>
                )}
                {clubHistoryTag && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-slate-300 font-medium">
                    🏆 {clubHistoryTag}
                  </span>
                )}
                {matchTag && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-slate-300 font-medium">
                    ⚽ {matchTag}
                  </span>
                )}
                {trainingTag && (
                  <span className="rounded-full bg-white/5 border border-white/10 px-3 py-1.5 text-xs text-slate-300 font-medium">
                    🏃 {trainingTag}
                  </span>
                )}
              </div>
            )}

            {/* Action Bar Preview */}
            <div className="flex items-center gap-6 pt-3 border-t border-white/10">
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                </svg>
                <span>0</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-400">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                </svg>
                <span>0</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-500">
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                <span>0</span>
              </div>
            </div>
          </div>
        </motion.article>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400"
          >
            {error}
          </motion.div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-3 pt-2">
          <button
            onClick={() => setShowPreview(false)}
            className="flex-1 rounded-full border border-white/20 px-6 py-4 text-base font-semibold text-white hover:bg-white/5 transition-all"
          >
            Edit Post
          </button>
          <button
            onClick={handlePublish}
            disabled={isLoading}
            className="flex-[2] rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-4 text-base font-semibold text-white hover:from-sky-400 hover:to-indigo-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-sky-500/20"
          >
            {isLoading ? (
              <>
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                Publishing...
              </>
            ) : (
              <>
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Publish Post
              </>
            )}
          </button>
        </div>
      </div>
    );
  }

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      onSubmit={handlePreview}
      className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-8 space-y-8"
    >
      {/* Content Type Selection */}
      <div>
        <label className="block text-sm font-semibold text-white mb-4">
          What are you sharing?
        </label>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {contentTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setContentType(type.value)}
              className={`rounded-2xl border p-4 text-center transition-all ${
                contentType === type.value
                  ? "border-sky-400 bg-sky-500/20 text-sky-300 ring-2 ring-sky-400/30"
                  : "border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-slate-300"
              }`}
            >
              <div className="text-3xl mb-2">{type.icon}</div>
              <div className="font-medium text-sm">{type.label}</div>
              <div className="text-xs text-slate-500 mt-1 hidden md:block">{type.description}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Media Section with Upload */}
      <div className="space-y-4">
        <label className="block text-sm font-semibold text-white">
          Media
        </label>
        
        <MediaUploader
          onUploadComplete={(url, type) => {
            setMediaUrl(url);
            setMediaType(type);
          }}
          currentUrl={mediaUrl}
          currentType={mediaType}
        />

        {/* URL Input as fallback */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-white/10"></div>
          </div>
          <div className="relative flex justify-center">
            <span className="bg-slate-900 px-2 text-xs text-slate-400">or paste URL</span>
          </div>
        </div>

        <div className="flex gap-4 mb-2">
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="radio"
              checked={mediaType === "video"}
              onChange={() => setMediaType("video")}
              className="accent-sky-500 h-4 w-4"
            />
            <span>Video</span>
          </label>
          <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
            <input
              type="radio"
              checked={mediaType === "image"}
              onChange={() => setMediaType("image")}
              className="accent-sky-500 h-4 w-4"
            />
            <span>Image</span>
          </label>
        </div>

        <input
          type="url"
          value={mediaUrl}
          onChange={(e) => setMediaUrl(e.target.value)}
          placeholder={mediaType === "video" ? "https://youtube.com/watch?v=..." : "https://..."}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20"
        />
      </div>

      {/* Caption */}
      <div>
        <label className="block text-sm font-semibold text-white mb-3">
          Caption
        </label>
        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Tell your story... What happened? How did it feel? What did you learn?"
          rows={4}
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none focus:ring-2 focus:ring-sky-400/20 resize-none"
        />
        <p className="text-xs text-slate-500 mt-2">
          Tip: Great posts include context - match score, opponent, significance of the moment
        </p>
      </div>

      {/* Tags Section */}
      <div>
        <label className="block text-sm font-semibold text-white mb-4">
          Tags (Optional)
        </label>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-slate-400 mb-2">Position</label>
            <select
              value={positionTag}
              onChange={(e) => setPositionTag(e.target.value)}
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white focus:border-sky-400 focus:outline-none"
            >
              <option value="">Select your position</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Club/Team</label>
            <input
              type="text"
              value={clubHistoryTag}
              onChange={(e) => setClubHistoryTag(e.target.value)}
              placeholder="e.g., Manchester United U18"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Match/Event</label>
            <input
              type="text"
              value={matchTag}
              onChange={(e) => setMatchTag(e.target.value)}
              placeholder="e.g., vs Liverpool, Cup Final"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs text-slate-400 mb-2">Training Focus</label>
            <input
              type="text"
              value={trainingTag}
              onChange={(e) => setTrainingTag(e.target.value)}
              placeholder="e.g., Finishing, Speed Work"
              className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-white placeholder-slate-500 focus:border-sky-400 focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="rounded-xl bg-red-500/10 border border-red-500/20 p-4 text-sm text-red-400">
          {error}
        </div>
      )}

      {/* Actions */}
      <div className="flex justify-end gap-4 pt-6 border-t border-white/10">
        <button
          type="button"
          onClick={() => router.push("/feed")}
          className="rounded-full px-6 py-3 text-sm font-medium text-slate-400 hover:text-white transition-colors"
        >
          Cancel
        </button>
        <button
          type="submit"
          className="rounded-full bg-gradient-to-r from-sky-500 to-indigo-500 px-8 py-3 text-sm font-semibold text-white hover:from-sky-400 hover:to-indigo-400 transition-all flex items-center gap-2"
        >
          {isLoading ? (
            <>
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Posting...
            </>
          ) : (
            <>
              <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
              Next
            </>
          )}
        </button>
      </div>
    </motion.form>
  );
}
