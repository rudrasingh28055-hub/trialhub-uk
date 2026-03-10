"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { MediaUploader } from "../../../components/feed/MediaUploader";
import { SimpleVideoEditor } from './components/SimpleVideoEditor';
import Cropper from "react-easy-crop";
import { Area, Point } from "react-easy-crop";

type MediaType = "image" | "video";
type PostContentType = "highlight" | "training" | "achievement" | "match_moment" | "general";

interface EditPostClientProps {
  userId: string;
}

const contentTypes = [
  { value: "highlight", label: "Highlight", color: "text-violet-400" },
  { value: "training", label: "Training", color: "text-emerald-400" },
  { value: "achievement", label: "Achievement", color: "text-amber-400" },
  { value: "match_moment", label: "Match Moment", color: "text-sky-400" },
  { value: "general", label: "General", color: "text-slate-400" },
];

const filters = [
  { name: "Original", filter: "none", icon: "🎬" },
  { name: "Grayscale", filter: "grayscale(100%)", icon: "⚫" },
  { name: "Sepia", filter: "sepia(100%)", icon: "🟤" },
  { name: "Invert", filter: "invert(100%)", icon: "🔄" },
  { name: "Blur", filter: "blur(2px)", icon: "💫" },
  { name: "Ocean Blue", filter: "hue-rotate(180deg) saturate(1.5) brightness(1.05) contrast(1.08)", icon: "🌊" },
  { name: "Forest", filter: "hue-rotate(90deg) saturate(1.3) brightness(0.95) contrast(1.1)", icon: "🌲" },
  { name: "Sunset", filter: "hue-rotate(-30deg) saturate(1.6) brightness(1.1) contrast(1.15)", icon: "🌇" },
  { name: "Cherry Blossom", filter: "hue-rotate(320deg) saturate(1.4) brightness(1.12) contrast(1.05)", icon: "🌸" },
  { name: "Midnight", filter: "grayscale(80%) contrast(1.3) brightness(0.9) saturate(0.8)", icon: "🌙" },
  { name: "Fire", filter: "hue-rotate(10deg) saturate(2) brightness(1.1) contrast(1.2)", icon: "🔥" },
  { name: "Aurora", filter: "hue-rotate(120deg) saturate(1.8) brightness(1.15) contrast(1.1) blur(0.3px)", icon: "🌌" },
];

const presets = [
  { name: "Portrait", icon: "👤", adjustments: { brightness: 110, contrast: 105, saturation: 120, vibrance: 30 } },
  { name: "Landscape", icon: "🏔️", adjustments: { brightness: 105, contrast: 115, saturation: 130, vibrance: 20 } },
  { name: "Food", icon: "🍕", adjustments: { brightness: 110, contrast: 110, saturation: 140, vibrance: 40 } },
  { name: "Architecture", icon: "🏛️", adjustments: { brightness: 105, contrast: 120, saturation: 90, vibrance: 0 } },
  { name: "Vintage Film", icon: "🎬", adjustments: { brightness: 95, contrast: 110, saturation: 70, vibrance: -20 } },
];

export function EditPostClient({ userId }: EditPostClientProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  
  // Basic form state
  const [contentType, setContentType] = useState<PostContentType>("highlight");
  const [caption, setCaption] = useState("");
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState<MediaType>("image");
  const [mediaBucket, setMediaBucket] = useState<string>("");
  const [mediaPath, setMediaPath] = useState<string>("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [blobUrl, setBlobUrl] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [positionTag, setPositionTag] = useState("");
  const [clubHistoryTag, setClubHistoryTag] = useState("");
  const [matchTag, setMatchTag] = useState("");
  const [trainingTag, setTrainingTag] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [editorMode, setEditorMode] = useState<"none" | "image" | "video">("none");
  
  // Image editor state
  const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [selectedFilter, setSelectedFilter] = useState("none");
  const [editedImageUrl, setEditedImageUrl] = useState("");
  const [activeTab, setActiveTab] = useState("enhance"); // enhance, filters, adjust, presets
  const [adjustments, setAdjustments] = useState({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    clarity: 0,
    fade: 0,
    grain: 0,
    vignette: 0,
  });
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [rotation, setRotation] = useState(0);
  const [flipH, setFlipH] = useState(false);
  const [flipV, setFlipV] = useState(false);

  // Load saved form data (clear if video URL is old public URL)
  useEffect(() => {
    const savedData = JSON.parse(sessionStorage.getItem('postFormData') || '{}');
    
    // Check if saved video URL is an old public URL and clear it
    if (savedData.mediaUrl && savedData.mediaType === 'video' && 
        savedData.mediaUrl.includes('/storage/v1/object/public/')) {
      console.log('[EditPostClient] Clearing old public video URL from session');
      sessionStorage.removeItem('postFormData');
      return;
    }
    
    if (savedData.contentType) setContentType(savedData.contentType);
    if (savedData.caption) setCaption(savedData.caption);
    if (savedData.mediaUrl) setMediaUrl(savedData.mediaUrl);
    if (savedData.mediaType) setMediaType(savedData.mediaType);
    if (savedData.positionTag) setPositionTag(savedData.positionTag);
    if (savedData.clubHistoryTag) setClubHistoryTag(savedData.clubHistoryTag);
    if (savedData.matchTag) setMatchTag(savedData.matchTag);
    if (savedData.trainingTag) setTrainingTag(savedData.trainingTag);
  }, []);

  // Cleanup blob URL on unmount or when media changes
  useEffect(() => {
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl);
      }
    };
  }, [blobUrl]);

  // Auto-open editor when media is loaded
  useEffect(() => {
    const source = mediaType === "video" ? previewUrl : mediaUrl;

    if (source) {
      if (mediaType === "video") {
        requestAnimationFrame(() => {
          setEditorMode("video");
        });
      } else {
        setEditorMode("image");
      }
    }
  }, [mediaUrl, previewUrl, mediaType]);

  const handleMediaUpload = (
  url: string,
  type: MediaType,
  bucket?: string,
  path?: string,
  file?: File
) => {
  console.log("[EditPostClient] handleMediaUpload received", {
    url,
    type,
    bucket,
    path,
  });

  if (blobUrl) {
    URL.revokeObjectURL(blobUrl);
    setBlobUrl(null);
  }

  setMediaType(type);
  setMediaBucket(bucket || "");
  setMediaPath(path || "");
  setMediaFile(file || null);
  setError(null);

  // Always keep the real uploaded/storage URL in mediaUrl
  setMediaUrl(url || "");

  if (type === "video" && file) {
    const newBlobUrl = URL.createObjectURL(file);
    setBlobUrl(newBlobUrl);
    setPreviewUrl(newBlobUrl);
    console.log("[EditPostClient] Created video preview blob URL:", newBlobUrl);
    
    // Explicitly open video editor
    setEditorMode("video");
  } else {
    setPreviewUrl(url || "");
    
    // Explicitly open image editor
    setEditorMode("image");
  }

  setEditedImageUrl("");
  setSelectedFilter("none");
  setAdjustments({
    brightness: 100,
    contrast: 100,
    saturation: 100,
    vibrance: 0,
    warmth: 0,
    tint: 0,
    clarity: 0,
    fade: 0,
    grain: 0,
    vignette: 0,
  });
  setSelectedPreset(null);
  setRotation(0);
  setFlipH(false);
  setFlipV(false);
};

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!mediaUrl.trim()) {
      setError("Please upload media");
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Use the edited image URL if available, otherwise use original
      const finalMediaUrl = editedImageUrl || mediaUrl;
      
      const response = await fetch('/api/posts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId,
          contentType,
          caption,
          mediaUrl: finalMediaUrl,
          mediaType,
          positionTag,
          clubHistoryTag,
          matchTag,
          trainingTag,
        }),
      });
      
      if (!response.ok) throw new Error('Failed to create post');
      
      setSuccess(true);
      sessionStorage.removeItem('postFormData');
      
      setTimeout(() => {
        router.push('/feed');
      }, 2000);
      
    } catch (err: any) {
      setError(err.message || 'Failed to create post');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate combined filter string
  const getCombinedFilter = () => {
    const filterParts = [];
    
    // Apply base filter first
    if (selectedFilter !== "none") {
      filterParts.push(selectedFilter);
    }
    
    // Apply adjustments in correct order
    if (adjustments.brightness !== 100) filterParts.push(`brightness(${adjustments.brightness}%)`);
    if (adjustments.contrast !== 100) filterParts.push(`contrast(${adjustments.contrast}%)`);
    if (adjustments.saturation !== 100) filterParts.push(`saturate(${adjustments.saturation}%)`);
    if (adjustments.vibrance !== 0) filterParts.push(`saturate(${100 + adjustments.vibrance}%)`);
    if (adjustments.warmth !== 0) filterParts.push(`hue-rotate(${adjustments.warmth * 0.6}deg)`);
    if (adjustments.tint !== 0) filterParts.push(`sepia(${Math.abs(adjustments.tint) * 0.01})`);
    if (adjustments.clarity !== 0) filterParts.push(`contrast(${100 + adjustments.clarity * 0.3}%)`);
    if (adjustments.fade > 0) filterParts.push(`opacity(${100 - adjustments.fade * 0.3}%)`);
    if (adjustments.grain > 0) filterParts.push(`contrast(${100 + adjustments.grain * 0.1}%)`);
    if (adjustments.vignette > 0) filterParts.push(`brightness(${100 - adjustments.vignette * 0.3}%)`);
    
    return filterParts.join(' ');
  };

  // Apply preset
  const applyPreset = (preset: any) => {
    setAdjustments({
      brightness: preset.adjustments.brightness,
      contrast: preset.adjustments.contrast,
      saturation: preset.adjustments.saturation,
      vibrance: preset.adjustments.vibrance,
      warmth: 0,
      tint: 0,
      clarity: 0,
      fade: 0,
      grain: 0,
      vignette: 0,
    });
    setSelectedPreset(preset.name);
  };

  // If no media, show upload form
  if (editorMode === "none") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-white mb-2">Create Post</h1>
            <p className="text-slate-400">Upload media to get started</p>
          </div>

          <div className="rounded-3xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-8">
            <MediaUploader
              onUploadComplete={handleMediaUpload}
              currentUrl={mediaUrl}
              currentType={mediaType}
            />
          </div>
        </div>
      </div>
    );
  }

  // Success state
  if (success) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="rounded-3xl border border-emerald-400/20 bg-emerald-500/10 p-12 text-center"
      >
        <div className="text-6xl mb-4">🎉</div>
        <h2 className="text-2xl font-bold text-white mb-2">Post Published!</h2>
        <p className="text-emerald-300">Your post is now live on the feed.</p>
        <p className="text-sm text-slate-400 mt-4">Redirecting to feed...</p>
      </motion.div>
    );
  }

  // Video Editor
  if (editorMode === "video") {
    return (
      <SimpleVideoEditor
        mediaUrl={previewUrl || mediaUrl}
        mediaBucket={mediaBucket}
        mediaPath={mediaPath}
        onClose={() => setEditorMode("none")}
        onSave={() => setEditorMode("none")}
      />
    );
  }

  // Image Editor View
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => setEditorMode("none")}
          className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-all"
        >
          <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
        <h1 className="text-xl font-bold text-white">Edit Photo</h1>
        <button
          onClick={() => setEditorMode("none")}
          className="px-6 py-2 rounded-xl bg-gradient-to-r from-violet-500 to-purple-500 text-white font-medium hover:from-violet-400 hover:to-purple-400 transition-all shadow-lg shadow-violet-500/25"
        >
          Done
        </button>
      </div>

      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Preview */}
          <div className="lg:col-span-2">
            <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6">
              <div className="relative aspect-square rounded-xl overflow-hidden bg-slate-900">
                <Cropper
                  image={mediaUrl}
                  crop={crop}
                  zoom={zoom}
                  aspect={1}
                  onCropChange={setCrop}
                  onCropComplete={setCroppedAreaPixels}
                  onZoomChange={setZoom}
                  style={{
                    containerStyle: {
                      width: '100%',
                      height: '100%',
                      borderRadius: '0.75rem',
                    },
                    cropAreaStyle: {
                      borderRadius: '0.75rem',
                    },
                  }}
                />
                
                {/* Combined Filter Overlay */}
                <div 
                  className="absolute inset-0 pointer-events-none rounded-xl"
                  style={{ 
                    filter: getCombinedFilter(),
                    mixBlendMode: 'normal'
                  }}
                />
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="space-y-6">
            {/* Tabs */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-1">
              <div className="grid grid-cols-4 gap-1">
                {['enhance', 'filters', 'adjust', 'presets'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-3 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                      activeTab === tab
                        ? 'bg-violet-500 text-white'
                        : 'text-slate-400 hover:text-white hover:bg-white/10'
                    }`}
                  >
                    {tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab Content */}
            <div className="bg-white/5 backdrop-blur-sm rounded-xl border border-white/10 p-6">
              {activeTab === 'enhance' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Quick Enhance</h3>
                  <div className="grid grid-cols-2 gap-3">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className={`p-4 rounded-xl border transition-all ${
                          selectedPreset === preset.name
                            ? 'border-violet-400 bg-violet-400/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="text-2xl mb-2">{preset.icon}</div>
                        <div className="text-sm font-medium text-white">{preset.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'filters' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Filters</h3>
                  <div className="grid grid-cols-3 gap-3 max-h-64 overflow-y-auto">
                    {filters.map((filter) => (
                      <button
                        key={filter.name}
                        onClick={() => setSelectedFilter(filter.filter)}
                        className={`p-3 rounded-xl border transition-all ${
                          selectedFilter === filter.filter
                            ? 'border-violet-400 bg-violet-400/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="text-xl mb-1">{filter.icon}</div>
                        <div className="text-xs font-medium text-white">{filter.name}</div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'adjust' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Adjustments</h3>
                  <div className="space-y-4">
                    {[
                      { key: 'brightness', label: 'Brightness', icon: '☀️' },
                      { key: 'contrast', label: 'Contrast', icon: '◐' },
                      { key: 'saturation', label: 'Saturation', icon: '🎨' },
                      { key: 'vibrance', label: 'Vibrance', icon: '💎' },
                    ].map(({ key, label, icon }) => (
                      <div key={key} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <span>{icon}</span>
                            <label className="text-sm font-medium text-white">{label}</label>
                          </div>
                          <span className="text-sm text-slate-400">
                            {adjustments[key as keyof typeof adjustments]}
                          </span>
                        </div>
                        <input
                          type="range"
                          min="0"
                          max="200"
                          value={adjustments[key as keyof typeof adjustments]}
                          onChange={(e) => setAdjustments(prev => ({ ...prev, [key]: Number(e.target.value) }))}
                          className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {activeTab === 'presets' && (
                <div className="space-y-4">
                  <h3 className="text-lg font-bold text-white">Presets</h3>
                  <div className="space-y-2">
                    {presets.map((preset) => (
                      <button
                        key={preset.name}
                        onClick={() => applyPreset(preset)}
                        className={`w-full p-4 rounded-xl border transition-all text-left ${
                          selectedPreset === preset.name
                            ? 'border-violet-400 bg-violet-400/10'
                            : 'border-white/10 hover:border-white/20 hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{preset.icon}</span>
                          <div>
                            <div className="text-sm font-medium text-white">{preset.name}</div>
                            <div className="text-xs text-slate-400">One-click enhancement</div>
                          </div>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Form Section */}
      <div className="max-w-6xl mx-auto mt-6">
        <form onSubmit={handlePublish} className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-sm p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {contentTypes.map((type) => (
              <button
                key={type.value}
                type="button"
                onClick={() => setContentType(type.value as PostContentType)}
                className={`p-4 rounded-xl border transition-all ${
                  contentType === type.value
                    ? "border-sky-400 bg-sky-400/10 text-white"
                    : "border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white"
                }`}
              >
                <div className="text-center">
                  <div className={`text-2xl mb-2 ${type.color}`}>⚡</div>
                  <div className="text-sm font-medium">{type.label}</div>
                </div>
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <label className="block text-sm font-medium text-white mb-2">Caption</label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition-all"
                rows={3}
              />
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white mb-2">Position Tag</label>
                <input
                  type="text"
                  value={positionTag}
                  onChange={(e) => setPositionTag(e.target.value)}
                  placeholder="e.g., Forward, Midfielder"
                  className="w-full px-4 py-3 rounded-xl bg-white/5 border border-white/10 text-white placeholder-slate-400 focus:border-sky-400 focus:outline-none transition-all"
                />
              </div>
            </div>
          </div>

          {error && (
            <div className="mb-6 p-4 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-4">
            <button
              type="button"
              onClick={() => setEditorMode("none")}
              className="px-6 py-3 rounded-xl border border-white/10 bg-white/5 text-slate-300 hover:bg-white/10 transition-all"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-sky-500 to-blue-500 text-white font-medium hover:from-sky-400 hover:to-blue-400 transition-all shadow-lg shadow-sky-500/25 disabled:opacity-50"
            >
              {isLoading ? "Publishing..." : "Publish Post"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
