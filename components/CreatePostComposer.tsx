"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Types
type ComposerMode = "quick" | "highlight";
type MediaType = "image" | "video";
type Step = 1 | 2 | 3 | 4 | 5;

interface QuickPostMetadata {
  caption: string;
  postType: "daily_post" | "training_update" | "achievement" | "general";
  visibility: "public" | "followers";
}

interface HighlightMetadata {
  clipType: "match_highlight" | "match_video" | "training_clip";
  caption: string;
  position: string;
  actionType: "goal" | "assist" | "shot" | "save" | "tackle" | "interception" | "dribble" | "key_pass" | "cross" | "buildup" | "training_drill" | "recovery_run" | "other";
  visibility: "public" | "followers";
  
  // Optional fields
  opponent?: string;
  minute?: number;
  competition?: string;
  result?: string;
  footUsed?: "left" | "right" | "both";
  matchDate?: string;
  sessionName?: string;
  location?: string;
  
  // Editing metadata
  trimStart?: number;
  trimEnd?: number;
  coverFrameTime?: number;
  spotlightTime?: number;
  spotlightLabel?: string;
}

interface ComposerState {
  // Mode and navigation
  mode: ComposerMode | null;
  step: Step;
  
  // File management (local-first)
  selectedFile: File | null;
  localPreviewUrl: string;
  mediaType: MediaType;
  
  // Metadata
  quickPost: QuickPostMetadata;
  highlight: HighlightMetadata;
  
  // Publish state
  isPublishing: boolean;
  publishError?: string;
  publishSuccess?: boolean;
}

interface CreatePostComposerProps {
  userId: string;
}

const initialQuickPostState: QuickPostMetadata = {
  caption: "",
  postType: "daily_post",
  visibility: "public"
};

const initialHighlightState: HighlightMetadata = {
  clipType: "match_highlight",
  caption: "",
  position: "",
  actionType: "goal",
  visibility: "public"
};

const postTypeOptions = [
  { value: "daily_post", label: "Daily Post", icon: "📅" },
  { value: "training_update", label: "Training Update", icon: "⚽" },
  { value: "achievement", label: "Achievement", icon: "🏆" },
  { value: "general", label: "General", icon: "💬" },
];

const actionTypeOptions = [
  { value: "goal", label: "Goal", icon: "⚽" },
  { value: "assist", label: "Assist", icon: "🎯" },
  { value: "shot", label: "Shot", icon: "🥅" },
  { value: "save", label: "Save", icon: "🧤" },
  { value: "tackle", label: "Tackle", icon: "🥊" },
  { value: "interception", label: "Interception", icon: "🔄" },
  { value: "dribble", label: "Dribble", icon: "👟" },
  { value: "key_pass", label: "Key Pass", icon: "🎪" },
  { value: "cross", label: "Cross", icon: "✚" },
  { value: "buildup", label: "Build-up Play", icon: "🏗️" },
  { value: "training_drill", label: "Training Drill", icon: "🏋️" },
  { value: "recovery_run", label: "Recovery Run", icon: "🏃" },
  { value: "other", label: "Other", icon: "📝" },
];

const clipTypeOptions = [
  { value: "match_highlight", label: "Match Highlight", icon: "🌟" },
  { value: "match_video", label: "Match Video", icon: "📹" },
  { value: "training_clip", label: "Training Clip", icon: "⚽" },
];

export function CreatePostComposer({ userId }: CreatePostComposerProps) {
  const router = useRouter();
  
  // Single source of truth state
  const [composer, setComposer] = useState<ComposerState>({
    mode: null,
    step: 1,
    selectedFile: null,
    localPreviewUrl: "",
    mediaType: "image",
    quickPost: initialQuickPostState,
    highlight: initialHighlightState,
    isPublishing: false,
  });

  // Cleanup preview URL on unmount or file change
  useEffect(() => {
    return () => {
      if (composer.localPreviewUrl) {
        URL.revokeObjectURL(composer.localPreviewUrl);
      }
    };
  }, [composer.localPreviewUrl]);

  // Mode selection
  const selectMode = (mode: ComposerMode) => {
    setComposer(prev => ({
      ...prev,
      mode,
      step: 1,
      selectedFile: null,
      localPreviewUrl: "",
      quickPost: initialQuickPostState,
      highlight: initialHighlightState,
      isPublishing: false,
      publishError: undefined,
      publishSuccess: false,
    }));
  };

  // Local file selection (no upload)
  const selectFile = (file: File) => {
    // Cleanup previous preview
    if (composer.localPreviewUrl) {
      URL.revokeObjectURL(composer.localPreviewUrl);
    }

    const mediaType = file.type.startsWith("video") ? "video" : "image";
    const previewUrl = URL.createObjectURL(file);

    setComposer(prev => ({
      ...prev,
      selectedFile: file,
      localPreviewUrl: previewUrl,
      mediaType,
      step: 2, // Move to next step after file selection
    }));
  };

  // Navigation
  const goToStep = (step: Step) => {
    setComposer(prev => ({ ...prev, step }));
  };

  const goBack = () => {
    if (composer.step === 1) {
      // Go back to mode selection
      setComposer(prev => ({
        ...prev,
        mode: null,
        step: 1,
        selectedFile: null,
        localPreviewUrl: "",
      }));
    } else {
      setComposer(prev => ({ ...prev, step: (composer.step - 1) as Step }));
    }
  };

  const closeComposer = () => {
    // Cleanup
    if (composer.localPreviewUrl) {
      URL.revokeObjectURL(composer.localPreviewUrl);
    }
    router.back();
  };

  // Update metadata helpers
  const updateQuickPost = (updates: Partial<QuickPostMetadata>) => {
    setComposer(prev => ({
      ...prev,
      quickPost: { ...prev.quickPost, ...updates }
    }));
  };

  const updateHighlight = (updates: Partial<HighlightMetadata>) => {
    setComposer(prev => ({
      ...prev,
      highlight: { ...prev.highlight, ...updates }
    }));
  };

  // Publish function
  const publishPost = async () => {
    if (!composer.selectedFile || !composer.mode) return;

    setComposer(prev => ({ ...prev, isPublishing: true, publishError: undefined }));

    try {
      const formData = new FormData();
      formData.append("mediaFile", composer.selectedFile);
      formData.append("caption", composer.mode === "quick" ? composer.quickPost.caption : composer.highlight.caption);
      
      // Map composer selections to existing content_type semantics
      let mappedContentType = "";
      if (composer.mode === "quick") {
        // Quick Post mapping
        switch (composer.quickPost.postType) {
          case "daily_post":
            mappedContentType = "general"; // Daily posts use general content type
            break;
          case "training_update":
            mappedContentType = "training"; // Training updates use training content type
            break;
          case "achievement":
            mappedContentType = "achievement"; // Achievements use achievement content type
            break;
          case "general":
            mappedContentType = "general"; // General posts use general content type
            break;
          default:
            mappedContentType = "general";
        }
      } else {
        // Highlight Builder mapping
        switch (composer.highlight.clipType) {
          case "match_highlight":
            mappedContentType = "highlight"; // Match highlights use highlight content type
            break;
          case "match_video":
            mappedContentType = "match_moment"; // Match videos use match_moment content type
            break;
          case "training_clip":
            mappedContentType = "training"; // Training clips use training content type
            break;
          default:
            mappedContentType = "highlight";
        }
      }
      
      formData.append("contentType", mappedContentType);
      formData.append("composerMode", composer.mode);
      formData.append("mediaType", composer.mediaType);
      formData.append("visibility", composer.mode === "quick" ? composer.quickPost.visibility : composer.highlight.visibility);

      // Quick Post specific fields
      if (composer.mode === "quick") {
        formData.append("postType", composer.quickPost.postType);
      }

      // Highlight Builder specific fields
      if (composer.mode === "highlight") {
        formData.append("clipType", composer.highlight.clipType);
        formData.append("position", composer.highlight.position);
        formData.append("actionType", composer.highlight.actionType);
        
        // Optional fields
        if (composer.highlight.opponent) formData.append("opponent", composer.highlight.opponent);
        if (composer.highlight.minute) formData.append("minute", composer.highlight.minute.toString());
        if (composer.highlight.competition) formData.append("competition", composer.highlight.competition);
        if (composer.highlight.result) formData.append("result", composer.highlight.result);
        if (composer.highlight.footUsed) formData.append("footUsed", composer.highlight.footUsed);
        if (composer.highlight.matchDate) formData.append("matchDate", composer.highlight.matchDate);
        if (composer.highlight.sessionName) formData.append("sessionName", composer.highlight.sessionName);
        if (composer.highlight.location) formData.append("location", composer.highlight.location);
        if (composer.highlight.trimStart !== undefined) formData.append("trimStart", composer.highlight.trimStart.toString());
        if (composer.highlight.trimEnd !== undefined) formData.append("trimEnd", composer.highlight.trimEnd.toString());
        if (composer.highlight.coverFrameTime !== undefined) formData.append("coverFrameTime", composer.highlight.coverFrameTime.toString());
        if (composer.highlight.spotlightTime !== undefined) formData.append("spotlightTime", composer.highlight.spotlightTime.toString());
        if (composer.highlight.spotlightLabel) formData.append("spotlightLabel", composer.highlight.spotlightLabel);
      }

      const response = await fetch("/api/posts", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Failed to create post");
      }

      setComposer(prev => ({ ...prev, publishSuccess: true, isPublishing: false }));
      
      // Redirect to feed after successful publish
      setTimeout(() => {
        router.push("/feed");
      }, 2000);

    } catch (error) {
      console.error("Publish error:", error);
      setComposer(prev => ({
        ...prev,
        isPublishing: false,
        publishError: error instanceof Error ? error.message : "Failed to publish post"
      }));
    }
  };

  // Render mode selection screen
  if (!composer.mode) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-white mb-4">Create Post</h1>
            <p className="text-slate-400 text-lg">Choose how you want to share your content</p>
          </div>

          {/* Mode Selection Cards */}
          <div className="grid md:grid-cols-2 gap-6">
            {/* Quick Post Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectMode("quick")}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-8 text-left transition-all hover:border-white/20"
            >
              <div className="relative z-10">
                <div className="text-5xl mb-4">⚡</div>
                <h2 className="text-2xl font-bold text-white mb-3">Quick Post</h2>
                <p className="text-slate-300 mb-4">
                  For daily updates, casual training snaps, and simple posts
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-sm border border-sky-500/30">
                    Fast
                  </span>
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-sm border border-sky-500/30">
                    Simple
                  </span>
                  <span className="px-3 py-1 rounded-full bg-sky-500/20 text-sky-400 text-sm border border-sky-500/30">
                    Daily
                  </span>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-sky-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>

            {/* Highlight Builder Card */}
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => selectMode("highlight")}
              className="group relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-8 text-left transition-all hover:border-white/20"
            >
              <div className="relative z-10">
                <div className="text-5xl mb-4">🎯</div>
                <h2 className="text-2xl font-bold text-white mb-3">Highlight Builder</h2>
                <p className="text-slate-300 mb-4">
                  For football clips, match highlights, and training videos
                </p>
                <div className="flex flex-wrap gap-2">
                  <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm border border-violet-500/30">
                    Professional
                  </span>
                  <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm border border-violet-500/30">
                    Football
                  </span>
                  <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-400 text-sm border border-violet-500/30">
                    Detailed
                  </span>
                </div>
              </div>
              
              {/* Background decoration */}
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.button>
          </div>

          {/* Help text */}
          <div className="mt-12 text-center">
            <p className="text-slate-500 text-sm">
              You can switch between modes at any time during creation
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render composer content based on mode and step
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950">
      <AnimatePresence mode="wait">
        <motion.div
          key={`${composer.mode}-${composer.step}`}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.2 }}
          className="h-full"
        >
          <div className="max-w-4xl mx-auto p-4 md:p-6">
            {/* Header */}
            <div className="flex items-center justify-between mb-8">
              <button
                onClick={goBack}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <h1 className="text-xl font-bold text-white">
                {composer.mode === "quick" ? "Quick Post" : "Highlight Builder"}
              </h1>
              
              <button
                onClick={closeComposer}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicator */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                {Array.from({ length: composer.mode === "quick" ? 3 : 5 }, (_, i) => (
                  <React.Fragment key={i}>
                    <div
                      className={`w-8 h-1 rounded-full transition-all ${
                        i < composer.step - 1
                          ? "bg-white"
                          : i === composer.step - 1
                          ? "bg-white"
                          : "bg-white/20"
                      }`}
                    />
                    {i < (composer.mode === "quick" ? 2 : 4) && (
                      <div className="w-2 h-2 rounded-full bg-white/20" />
                    )}
                  </React.Fragment>
                ))}
              </div>
            </div>

            {/* Content area based on mode and step */}
            <div className="bg-white/5 backdrop-blur-sm rounded-3xl border border-white/10 p-8">
              
              {/* SUCCESS STATE */}
              {composer.publishSuccess && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 className="text-2xl font-bold text-white mb-2">Post Published!</h2>
                  <p className="text-emerald-300">Your post is now live on the feed.</p>
                  <p className="text-sm text-slate-400 mt-4">Redirecting to feed...</p>
                </div>
              )}

              {/* QUICK POST FLOW */}
              {composer.mode === "quick" && !composer.publishSuccess && (
                <>
                  {/* Step 1: Media Selection */}
                  {composer.step === 1 && (
                    <div className="text-center">
                      <div className="text-6xl mb-4">📸</div>
                      <h2 className="text-2xl font-bold text-white mb-4">Select Media</h2>
                      <p className="text-slate-400 mb-8">Choose a photo or video for your quick post</p>
                      
                      <div className="max-w-md mx-auto">
                        <input
                          type="file"
                          accept="image/*,video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) selectFile(file);
                          }}
                          className="hidden"
                          id="quick-file-input"
                        />
                        <label
                          htmlFor="quick-file-input"
                          className="block w-full px-6 py-4 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-medium hover:from-sky-400 hover:to-blue-400 transition-all cursor-pointer text-center"
                        >
                          Choose Media
                        </label>
                      </div>

                      <div className="mt-6">
                        <button 
                          onClick={() => selectMode("highlight")}
                          className="text-slate-400 hover:text-white transition-colors text-sm"
                        >
                          Use Highlight Builder instead →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Details */}
                  {composer.step === 2 && composer.selectedFile && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Post Details</h2>
                      
                      {/* Media Preview */}
                      <div className="mb-6">
                        {composer.mediaType === "video" ? (
                          <video
                            src={composer.localPreviewUrl}
                            className="w-full max-w-md mx-auto rounded-xl"
                            controls
                          />
                        ) : (
                          <img
                            src={composer.localPreviewUrl}
                            alt="Preview"
                            className="w-full max-w-md mx-auto rounded-xl"
                          />
                        )}
                      </div>

                      {/* Caption */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-2">Caption</label>
                        <textarea
                          value={composer.quickPost.caption}
                          onChange={(e) => updateQuickPost({ caption: e.target.value })}
                          placeholder="Write your caption..."
                          className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition-all resize-none"
                          rows={4}
                        />
                      </div>

                      {/* Post Type */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-3">Post Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {postTypeOptions.map((type) => (
                            <button
                              key={type.value}
                              onClick={() => updateQuickPost({ postType: type.value as any })}
                              className={`p-3 rounded-xl border transition-all text-sm ${
                                composer.quickPost.postType === type.value
                                  ? "border-sky-400 bg-sky-400/10 text-white"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <div className="text-2xl mb-1">{type.icon}</div>
                              <div>{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Visibility */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-3">Visibility</label>
                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={() => updateQuickPost({ visibility: "public" })}
                            className={`p-3 rounded-xl border transition-all ${
                              composer.quickPost.visibility === "public"
                                ? "border-sky-400 bg-sky-400/10 text-white"
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="text-xl mb-1">🌍</div>
                            <div className="font-medium">Public</div>
                            <div className="text-xs text-slate-400">Everyone can see</div>
                          </button>
                          <button
                            onClick={() => updateQuickPost({ visibility: "followers" })}
                            className={`p-3 rounded-xl border transition-all ${
                              composer.quickPost.visibility === "followers"
                                ? "border-sky-400 bg-sky-400/10 text-white"
                                : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                            }`}
                          >
                            <div className="text-xl mb-1">👥</div>
                            <div className="font-medium">Followers</div>
                            <div className="text-xs text-slate-400">Followers only</div>
                          </button>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between">
                        <button
                          onClick={goBack}
                          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => goToStep(3)}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-medium hover:from-sky-400 hover:to-blue-400 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Publish */}
                  {composer.step === 3 && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Review & Publish</h2>
                      
                      {/* Preview */}
                      <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                        <div className="mb-4">
                          {composer.mediaType === "video" ? (
                            <video
                              src={composer.localPreviewUrl}
                              className="w-full rounded-lg"
                              controls
                            />
                          ) : (
                            <img
                              src={composer.localPreviewUrl}
                              alt="Preview"
                              className="w-full rounded-lg"
                            />
                          )}
                        </div>
                        <p className="text-white mb-2">{composer.quickPost.caption || "No caption"}</p>
                        <div className="flex gap-2 text-sm text-slate-400">
                          <span className="px-2 py-1 bg-slate-700 rounded">
                            {postTypeOptions.find(t => t.value === composer.quickPost.postType)?.label}
                          </span>
                          <span className="px-2 py-1 bg-slate-700 rounded">
                            {composer.quickPost.visibility === "public" ? "Public" : "Followers"}
                          </span>
                        </div>
                      </div>

                      {/* Error */}
                      {composer.publishError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                          {composer.publishError}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between">
                        <button
                          onClick={goBack}
                          disabled={composer.isPublishing}
                          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={publishPost}
                          disabled={composer.isPublishing || !composer.quickPost.caption}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-medium hover:from-sky-400 hover:to-blue-400 transition-all disabled:opacity-50"
                        >
                          {composer.isPublishing ? "Publishing..." : "Publish Post"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* HIGHLIGHT BUILDER FLOW */}
              {composer.mode === "highlight" && !composer.publishSuccess && (
                <>
                  {/* Step 1: Select Clip */}
                  {composer.step === 1 && (
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎬</div>
                      <h2 className="text-2xl font-bold text-white mb-4">Select Clip</h2>
                      <p className="text-slate-400 mb-8">Upload a video clip for your highlight</p>
                      
                      <div className="max-w-md mx-auto mb-6">
                        <input
                          type="file"
                          accept="video/*"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) selectFile(file);
                          }}
                          className="hidden"
                          id="highlight-file-input"
                        />
                        <label
                          htmlFor="highlight-file-input"
                          className="block w-full px-6 py-4 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all cursor-pointer text-center"
                        >
                          Choose Video
                        </label>
                      </div>

                      {/* Clip Type Selection */}
                      <div className="mb-6">
                        <label className="block text-sm font-medium text-white mb-3">Clip Type</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {clipTypeOptions.map((type) => (
                            <button
                              key={type.value}
                              onClick={() => updateHighlight({ clipType: type.value as any })}
                              className={`p-4 rounded-xl border transition-all ${
                                composer.highlight.clipType === type.value
                                  ? "border-violet-400 bg-violet-400/10 text-white"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <div className="text-2xl mb-2">{type.icon}</div>
                              <div className="font-medium">{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="mt-6">
                        <button 
                          onClick={() => selectMode("quick")}
                          className="text-slate-400 hover:text-white transition-colors text-sm"
                        >
                          Switch to Quick Post →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Edit Clip */}
                  {composer.step === 2 && composer.selectedFile && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Edit Clip</h2>
                      
                      {/* Video Preview */}
                      <div className="mb-6">
                        <video
                          src={composer.localPreviewUrl}
                          className="w-full rounded-xl"
                          controls
                        />
                      </div>

                      {/* Editing Options (Placeholder for now) */}
                      <div className="space-y-4 mb-6">
                        <div className="p-4 bg-slate-800/50 rounded-xl">
                          <h3 className="text-white font-medium mb-2">Trim Video</h3>
                          <div className="h-2 bg-slate-600 rounded-full">
                            <div className="h-2 bg-violet-500 rounded-full w-1/3"></div>
                          </div>
                          <p className="text-slate-400 text-sm mt-2">Trim controls coming soon</p>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-xl">
                          <h3 className="text-white font-medium mb-2">Cover Frame</h3>
                          <p className="text-slate-400 text-sm">Cover frame selection coming soon</p>
                        </div>

                        <div className="p-4 bg-slate-800/50 rounded-xl">
                          <h3 className="text-white font-medium mb-2">Spotlight Marker</h3>
                          <p className="text-slate-400 text-sm">Spotlight marker coming soon</p>
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between">
                        <button
                          onClick={goBack}
                          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => goToStep(3)}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Football Details */}
                  {composer.step === 3 && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Football Details</h2>
                      
                      {/* Required Fields */}
                      <div className="space-y-6 mb-6">
                        {/* Caption */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Caption *</label>
                          <textarea
                            value={composer.highlight.caption}
                            onChange={(e) => updateHighlight({ caption: e.target.value })}
                            placeholder="Describe your highlight..."
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all resize-none"
                            rows={3}
                          />
                        </div>

                        {/* Position */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-2">Position *</label>
                          <input
                            type="text"
                            value={composer.highlight.position}
                            onChange={(e) => updateHighlight({ position: e.target.value })}
                            placeholder="e.g., Forward, Midfielder, Goalkeeper"
                            className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all"
                          />
                        </div>

                        {/* Action Type */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-3">Action Type *</label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                            {actionTypeOptions.map((action) => (
                              <button
                                key={action.value}
                                onClick={() => updateHighlight({ actionType: action.value as any })}
                                className={`p-2 rounded-lg border transition-all text-sm ${
                                  composer.highlight.actionType === action.value
                                    ? "border-violet-400 bg-violet-400/10 text-white"
                                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                                }`}
                              >
                                <div className="text-lg mb-1">{action.icon}</div>
                                <div>{action.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Visibility */}
                        <div>
                          <label className="block text-sm font-medium text-white mb-3">Visibility</label>
                          <div className="grid grid-cols-2 gap-3">
                            <button
                              onClick={() => updateHighlight({ visibility: "public" })}
                              className={`p-3 rounded-xl border transition-all ${
                                composer.highlight.visibility === "public"
                                  ? "border-violet-400 bg-violet-400/10 text-white"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <div className="text-xl mb-1">🌍</div>
                              <div className="font-medium">Public</div>
                              <div className="text-xs text-slate-400">Everyone can see</div>
                            </button>
                            <button
                              onClick={() => updateHighlight({ visibility: "followers" })}
                              className={`p-3 rounded-xl border transition-all ${
                                composer.highlight.visibility === "followers"
                                  ? "border-violet-400 bg-violet-400/10 text-white"
                                  : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                              }`}
                            >
                              <div className="text-xl mb-1">👥</div>
                              <div className="font-medium">Followers</div>
                              <div className="text-xs text-slate-400">Followers only</div>
                            </button>
                          </div>
                        </div>
                      </div>

                      {/* Optional Fields */}
                      <div className="border-t border-white/10 pt-6">
                        <h3 className="text-white font-medium mb-4">Optional Details</h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <input
                            type="text"
                            value={composer.highlight.opponent || ""}
                            onChange={(e) => updateHighlight({ opponent: e.target.value })}
                            placeholder="Opponent"
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all"
                          />
                          <input
                            type="number"
                            value={composer.highlight.minute || ""}
                            onChange={(e) => updateHighlight({ minute: e.target.value ? parseInt(e.target.value) : undefined })}
                            placeholder="Minute"
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all"
                          />
                          <input
                            type="text"
                            value={composer.highlight.competition || ""}
                            onChange={(e) => updateHighlight({ competition: e.target.value })}
                            placeholder="Competition"
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all"
                          />
                          <input
                            type="text"
                            value={composer.highlight.result || ""}
                            onChange={(e) => updateHighlight({ result: e.target.value })}
                            placeholder="Result (e.g., W 2-1)"
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all"
                          />
                          <select
                            value={composer.highlight.footUsed || ""}
                            onChange={(e) => updateHighlight({ footUsed: e.target.value as any })}
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-400 focus:outline-none transition-all"
                          >
                            <option value="">Foot Used</option>
                            <option value="left">Left</option>
                            <option value="right">Right</option>
                            <option value="both">Both</option>
                          </select>
                          <input
                            type="date"
                            value={composer.highlight.matchDate || ""}
                            onChange={(e) => updateHighlight({ matchDate: e.target.value })}
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white focus:border-violet-400 focus:outline-none transition-all"
                          />
                          <input
                            type="text"
                            value={composer.highlight.sessionName || ""}
                            onChange={(e) => updateHighlight({ sessionName: e.target.value })}
                            placeholder="Session Name"
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all"
                          />
                          <input
                            type="text"
                            value={composer.highlight.location || ""}
                            onChange={(e) => updateHighlight({ location: e.target.value })}
                            placeholder="Location"
                            className="px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-violet-400 focus:outline-none transition-all"
                          />
                        </div>
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between mt-6">
                        <button
                          onClick={goBack}
                          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => goToStep(4)}
                          disabled={!composer.highlight.caption || !composer.highlight.position}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all disabled:opacity-50"
                        >
                          Next
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Preview */}
                  {composer.step === 4 && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Preview</h2>
                      
                      {/* Post Preview */}
                      <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                        <div className="mb-4">
                          <video
                            src={composer.localPreviewUrl}
                            className="w-full rounded-lg"
                            controls
                          />
                        </div>
                        <p className="text-white mb-3">{composer.highlight.caption}</p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                            {clipTypeOptions.find(t => t.value === composer.highlight.clipType)?.label}
                          </span>
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                            {composer.highlight.position}
                          </span>
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                            {actionTypeOptions.find(a => a.value === composer.highlight.actionType)?.label}
                          </span>
                          <span className="px-2 py-1 bg-slate-700 rounded">
                            {composer.highlight.visibility === "public" ? "Public" : "Followers"}
                          </span>
                        </div>
                        
                        {/* Optional metadata */}
                        {(composer.highlight.opponent || composer.highlight.minute || composer.highlight.competition) && (
                          <div className="mt-3 pt-3 border-t border-white/10">
                            <div className="flex flex-wrap gap-2 text-xs text-slate-400">
                              {composer.highlight.opponent && (
                                <span>vs {composer.highlight.opponent}</span>
                              )}
                              {composer.highlight.minute && (
                                <span>{composer.highlight.minute}'</span>
                              )}
                              {composer.highlight.competition && (
                                <span>{composer.highlight.competition}</span>
                              )}
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Navigation */}
                      <div className="flex justify-between">
                        <button
                          onClick={goBack}
                          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
                        >
                          Back
                        </button>
                        <button
                          onClick={() => goToStep(5)}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all"
                        >
                          Publish
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Publish */}
                  {composer.step === 5 && (
                    <div>
                      <h2 className="text-2xl font-bold text-white mb-6">Publish Highlight</h2>
                      
                      {/* Final Preview */}
                      <div className="bg-slate-800/50 rounded-xl p-6 mb-6">
                        <div className="mb-4">
                          <video
                            src={composer.localPreviewUrl}
                            className="w-full rounded-lg"
                            controls
                          />
                        </div>
                        <p className="text-white mb-3">{composer.highlight.caption}</p>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                            {clipTypeOptions.find(t => t.value === composer.highlight.clipType)?.label}
                          </span>
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                            {composer.highlight.position}
                          </span>
                          <span className="px-2 py-1 bg-violet-500/20 text-violet-400 rounded">
                            {actionTypeOptions.find(a => a.value === composer.highlight.actionType)?.label}
                          </span>
                          <span className="px-2 py-1 bg-slate-700 rounded">
                            {composer.highlight.visibility === "public" ? "Public" : "Followers"}
                          </span>
                        </div>
                      </div>

                      {/* Error */}
                      {composer.publishError && (
                        <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
                          {composer.publishError}
                        </div>
                      )}

                      {/* Actions */}
                      <div className="flex justify-between">
                        <button
                          onClick={goBack}
                          disabled={composer.isPublishing}
                          className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all disabled:opacity-50"
                        >
                          Back
                        </button>
                        <button
                          onClick={publishPost}
                          disabled={composer.isPublishing}
                          className="px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all disabled:opacity-50"
                        >
                          {composer.isPublishing ? "Publishing..." : "Publish Highlight"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
