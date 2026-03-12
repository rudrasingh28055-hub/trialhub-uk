"use client";

import { useState, useRef } from "react";
import { motion } from "framer-motion";
import { createPost } from "../../lib/feed/actions";
import type { PostContentType, MediaType } from "../../lib/feed/types";
import { colors, typography, styles, borderRadius } from "../../lib/design/tokens";

interface CreatePostFormProps {
  onPostCreated?: () => void;
}

const contentTypes: { value: PostContentType; label: string; icon: string }[] = [
  { value: "highlight", label: "Highlight", icon: "⚡" },
  { value: "training", label: "Training", icon: "🏃" },
  { value: "achievement", label: "Achievement", icon: "🏆" },
  { value: "match_moment", label: "Match Moment", icon: "⚽" },
  { value: "general", label: "General", icon: "📝" },
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

export function CreatePostForm({ onPostCreated }: CreatePostFormProps) {
  const [isOpen, setIsOpen] = useState(false);
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

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaUrl.trim()) {
      setError("Please provide a media URL");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
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

      if (result.success) {
        // Reset form
        setCaption("");
        setMediaUrl("");
        setContentType("highlight");
        setPositionTag("");
        setClubHistoryTag("");
        setMatchTag("");
        setTrainingTag("");
        setIsOpen(false);
        onPostCreated?.();
      } else {
        setError(result.error || "Failed to create post");
      }
    } catch (err) {
      setError("An error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) {
    return (
      <motion.button
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        onClick={() => setIsOpen(true)}
        className="w-full p-6 text-center transition-all"
        style={{ 
          ...styles.sheetBorder,
          backgroundColor: colors.card, 
          border: `1px dashed ${colors.surface}`
        }}
      >
        <div className="text-3xl mb-2">📸</div>
        <p 
          className="font-medium"
          style={{ 
            color: colors.white,
            fontFamily: typography.display,
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}
        >
          Share your moment
        </p>
        <p 
          className="text-sm mt-1"
          style={{ color: colors.muted }}
        >
          Post highlights, training clips, or achievements
        </p>
      </motion.button>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, height: 0 }}
      animate={{ opacity: 1, height: "auto" }}
      style={{ 
        ...styles.sheetBorder,
        backgroundColor: colors.card, 
        border: `1px solid ${colors.surface}`,
        padding: "24px"
      }}
    >
      <div className="flex items-center justify-between mb-6">
        <h3 
          className="text-lg font-semibold"
          style={{ 
            color: colors.white,
            fontFamily: typography.display,
            fontWeight: "bold",
            textTransform: "uppercase",
            letterSpacing: "0.05em"
          }}
        >
          Create Post
        </h3>
        <button
          onClick={() => setIsOpen(false)}
          className="transition-colors"
          style={{ color: colors.muted }}
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Content Type */}
        <div className="grid grid-cols-5 gap-2">
          {contentTypes.map((type) => (
            <button
              key={type.value}
              type="button"
              onClick={() => setContentType(type.value)}
              className="rounded-xl border p-3 text-center transition-all"
              style={{
                ...styles.buttonBorder,
                backgroundColor: contentType === type.value ? `${colors.accent}10` : colors.surface,
                border: contentType === type.value ? `1px solid ${colors.accent}40` : `1px solid ${colors.input}`,
                color: contentType === type.value ? colors.accent : colors.muted
              }}
            >
              <div className="text-xl mb-1">{type.icon}</div>
              <span className="text-xs">{type.label}</span>
            </button>
          ))}
        </div>

        {/* Media URL */}
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: colors.white }}
          >
            Media URL (Video or Image)
          </label>
          <input
            type="url"
            value={mediaUrl}
            onChange={(e) => setMediaUrl(e.target.value)}
            placeholder="https://..."
            className="w-full px-4 py-3 text-sm outline-none transition-all"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: colors.input, 
              border: `1px solid ${colors.surface}`, 
              color: colors.white,
              fontFamily: typography.body
            }}
            required
          />
          <div className="flex gap-4 mt-2">
            <label className="flex items-center gap-2 text-sm" style={{ color: colors.muted }}>
              <input
                type="radio"
                checked={mediaType === "video"}
                onChange={() => setMediaType("video")}
                style={{ accentColor: colors.accent }}
              />
              Video
            </label>
            <label className="flex items-center gap-2 text-sm" style={{ color: colors.muted }}>
              <input
                type="radio"
                checked={mediaType === "image"}
                onChange={() => setMediaType("image")}
                style={{ accentColor: colors.accent }}
              />
              Image
            </label>
          </div>
        </div>

        {/* Caption */}
        <div>
          <label 
            className="block text-sm font-medium mb-2"
            style={{ color: colors.white }}
          >
            Caption
          </label>
          <textarea
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            placeholder="Describe your moment..."
            rows={3}
            className="w-full px-4 py-3 text-sm outline-none transition-all resize-none"
            style={{ 
              ...styles.buttonBorder,
              backgroundColor: colors.input, 
              border: `1px solid ${colors.surface}`, 
              color: colors.white,
              fontFamily: typography.body
            }}
          />
        </div>

        {/* Tags */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label 
              className="block text-xs font-medium mb-2"
              style={{ color: colors.white }}
            >
              Position
            </label>
            <select
              value={positionTag}
              onChange={(e) => setPositionTag(e.target.value)}
              className="w-full px-3 py-2 text-sm outline-none transition-all"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
            >
              <option value="">Select position</option>
              {positions.map((pos) => (
                <option key={pos} value={pos}>{pos}</option>
              ))}
            </select>
          </div>

          <div>
            <label 
              className="block text-xs font-medium mb-2"
              style={{ color: colors.white }}
            >
              Club
            </label>
            <input
              type="text"
              value={clubHistoryTag}
              onChange={(e) => setClubHistoryTag(e.target.value)}
              placeholder="Current/previous club"
              className="w-full px-3 py-2 text-sm outline-none transition-all"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
            />
          </div>

          <div>
            <label 
              className="block text-xs font-medium mb-2"
              style={{ color: colors.white }}
            >
              Match/Event
            </label>
            <input
              type="text"
              value={matchTag}
              onChange={(e) => setMatchTag(e.target.value)}
              placeholder="Match name or event"
              className="w-full px-3 py-2 text-sm outline-none transition-all"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
            />
          </div>

          <div>
            <label 
              className="block text-xs font-medium mb-2"
              style={{ color: colors.white }}
            >
              Training Type
            </label>
            <input
              type="text"
              value={trainingTag}
              onChange={(e) => setTrainingTag(e.target.value)}
              placeholder="e.g., Finishing, Speed"
              className="w-full px-3 py-2 text-sm outline-none transition-all"
              style={{ 
                ...styles.buttonBorder,
                backgroundColor: colors.input, 
                border: `1px solid ${colors.surface}`, 
                color: colors.white,
                fontFamily: typography.body
              }}
            />
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="p-3 text-sm" style={{ ...styles.sheetBorder, backgroundColor: `${colors.danger}10`, border: `1px solid ${colors.danger}30`, color: colors.danger }}>
            {error}
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-3 pt-4" style={{ borderTop: `1px solid ${colors.surface}` }}>
          <button
            type="button"
            onClick={() => setIsOpen(false)}
            className="px-4 py-2 text-sm font-medium transition-colors"
            style={{ color: colors.muted }}
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={isLoading}
            className="px-6 py-2 text-sm font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
            {isLoading ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                POSTING...
              </>
            ) : (
              "POST"
            )}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
