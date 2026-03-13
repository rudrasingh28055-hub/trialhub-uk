"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import MuxPlayer from '@mux/mux-player-react'
import MuxVideoUploader from '@/components/MuxVideoUploader'
import { motion, AnimatePresence } from "framer-motion";
import { colors, typography, borderRadius, glassPanel, gradient, pitchGrid, motion as motionConfig } from "@/lib/design/tokens";
import { createClient } from "@/lib/supabase/client";

// Styles object for legacy compatibility
const styles: Record<string, React.CSSProperties> = {
  input: {
    width: "100%",
    padding: "12px 16px",
    borderRadius: "12px",
    border: "1px solid",
    color: colors.white,
    backgroundColor: colors.input
  },
  label: {
    display: "block",
    fontSize: "14px",
    fontWeight: "500",
    marginBottom: "8px",
    color: colors.white
  },
  card: {
    borderRadius: "16px",
    padding: "16px",
    border: `1px solid ${colors.glass.border}`,
    backgroundColor: colors.glass.background
  },
  button: {
    padding: "8px 16px",
    borderRadius: "9999px",
    fontSize: "14px",
    fontWeight: "500"
  },
  displayHeader: {
    fontWeight: "700",
    fontSize: "20px"
  },
  buttonBorder: {
    border: `1px solid ${colors.glass.border}`
  }
};

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
  opponent?: string;
  minute?: number;
  competition?: string;
  result?: string;
  footUsed?: "left" | "right" | "both";
  matchDate?: string;
  sessionName?: string;
  location?: string;
  trimStart?: number;
  trimEnd?: number;
  coverFrameTime?: number;
  spotlightTime?: number;
  spotlightLabel?: string;
  duration?: number;
  currentTime?: number;
  spotlight?: SpotlightConfig;
  mediaUrl?: string;
  previewUrl?: string;
  file?: File;
  spotlightStart?: number;
  spotlightEnd?: number;
  muxPlaybackId?: string;
  muxAssetId?: string;
  coverFrameUrl?: string;
}

type SpotlightStyle = "soft_white" | "dark_focus" | "ring_glow";

type SpotlightKeyframe = {
  id: "start" | "mid" | "end";
  progress: 0 | 0.5 | 1;
  x: number;
  y: number;
};

type SpotlightConfig = {
  enabled: boolean;
  style: SpotlightStyle;
  startTime: number;
  durationSeconds: 1 | 2 | 3;
  label?: string;
  keyframes: SpotlightKeyframe[];
};

interface ComposerState {
  mode: ComposerMode | null;
  step: Step;
  placingKeyframe?: "start" | "mid" | "end";
  selectedFile: File | null;
  localPreviewUrl: string;
  mediaType: MediaType;
  quickPost: QuickPostMetadata;
  highlight: HighlightMetadata;
  activeEditTab: "trim" | "cover" | "spotlight";
  isPublishing: boolean;
  publishError?: string;
  publishSuccess?: boolean;
  showEditSheet: boolean;
//  showMetadataAccordion: boolean;
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
  caption: "",
  clipType: "match_highlight",
  position: "",
  actionType: "other",
  spotlight: undefined,
  visibility: "public",
  trimStart: 0,
  trimEnd: 0,
  coverFrameTime: 0,
  spotlightTime: 0,
  spotlightLabel: "",
  duration: 0,
  currentTime: 0
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

const positions = [
  "Goalkeeper", "Centre-Back", "Full-Back", "Wing-Back", "Defensive Midfielder",
  "Central Midfielder", "Attacking Midfielder", "Winger", "Forward", "Striker"
];

// Spotlight helpers
function interpolateSpotlightPosition(spotlight: SpotlightConfig, currentTime: number) {
  if (!spotlight.keyframes.length) return { x: 50, y: 50 };
  const elapsed = currentTime - spotlight.startTime;
  const progress = Math.max(0, Math.min(1, elapsed / spotlight.durationSeconds));

  let from = spotlight.keyframes[0];
  let to = spotlight.keyframes[0];
  for (let i = 0; i < spotlight.keyframes.length - 1; i++) {
    if (progress >= spotlight.keyframes[i].progress && progress <= spotlight.keyframes[i + 1].progress) {
      from = spotlight.keyframes[i];
      to = spotlight.keyframes[i + 1];
      break;
    }
  }
  if (progress <= from.progress) return { x: from.x, y: from.y };
  if (progress >= to.progress) return { x: to.x, y: to.y };
  const t = (progress - from.progress) / (to.progress - from.progress);
  return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
}

function isSpotlightVisible(spotlight: SpotlightConfig, currentTime: number) {
  const elapsed = currentTime - spotlight.startTime;
  return elapsed >= 0 && elapsed <= spotlight.durationSeconds;
}

// Reusable Video Preview
interface HighlightVideoPreviewProps {
  localPreviewUrl: string;
  videoRef: React.RefObject<HTMLVideoElement | null>;
  spotlight: SpotlightConfig | undefined;
  currentTime: number;
  placingKeyframe?: "start" | "mid" | "end";
  showControls?: boolean;
  enableSpotlightPlacement?: boolean;
  onLoadedMetadata: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onDurationChange: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onTimeUpdate: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onSeeked: (e: React.SyntheticEvent<HTMLVideoElement>) => void;
  onVideoAreaClick: (e: React.MouseEvent<HTMLDivElement>) => void;
}

function HighlightVideoPreview({
  localPreviewUrl,
  videoRef,
  spotlight,
  currentTime,
  placingKeyframe,
  showControls = true,
  enableSpotlightPlacement = false,
  onLoadedMetadata,
  onDurationChange,
  onTimeUpdate,
  onSeeked,
  onVideoAreaClick,
}: HighlightVideoPreviewProps) {
  const canShowSpotlight = !!spotlight && isSpotlightVisible(spotlight, currentTime);
  const spotlightPos = spotlight && canShowSpotlight
    ? interpolateSpotlightPosition(spotlight, currentTime)
    : null;

  const showNativeControls = showControls && !placingKeyframe;

  if (!localPreviewUrl) {
    return (
      <div style={{ 
        width: '100%', 
        height: '300px', 
        borderRadius: '12px', 
        backgroundColor: '#000',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        color: 'rgba(255,255,255,0.3)'
      }}>
        <span>No preview available</span>
      </div>
    )
  }

  return (
    <div className="mb-6 relative overflow-hidden" style={{ width: '100%', height: '300px', overflow: 'hidden', borderRadius: '12px', backgroundColor: colors.black }}>
      <video
        ref={videoRef}
        key={localPreviewUrl || 'no-preview'}
        src={localPreviewUrl}
        controls={showNativeControls}
        playsInline
        style={{
          width: '100%',
          height: '300px',
          objectFit: 'cover',
          borderRadius: '16px',
          backgroundColor: '#000'
        }}
        onLoadedMetadata={onLoadedMetadata}
        onDurationChange={onDurationChange}
        onTimeUpdate={onTimeUpdate}
        onSeeked={onSeeked}
      />

      {/* Spotlight overlay */}
      {canShowSpotlight && spotlightPos && spotlight && (
        <div className="absolute inset-0 pointer-events-none z-20">
          {spotlight.style === "soft_white" && (
            <>
              <div
                className="absolute w-32 h-32 rounded-full opacity-30"
                style={{
                  left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`,
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 30%, transparent 70%)",
                  filter: "blur(8px)",
                }}
              />
              <div
                className="absolute w-20 h-20 rounded-full"
                style={{
                  left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`,
                  transform: "translate(-50%, -50%)",
                  background: "radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, transparent 80%)",
                }}
              />
            </>
          )}
          {spotlight.style === "dark_focus" && (
            <>
              <div
                className="absolute inset-0"
                style={{ background: `radial-gradient(circle at ${spotlightPos.x}% ${spotlightPos.y}%, transparent 15%, rgba(0,0,0,0.7) 50%)` }}
              />
              <div
                className="absolute w-24 h-24 rounded-full border-2 border-white/30"
                style={{
                  left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`,
                  transform: "translate(-50%, -50%)",
                  boxShadow: "0 0 20px rgba(255,255,255,0.2)",
                }}
              />
            </>
          )}
          {spotlight.style === "ring_glow" && (
            <>
              <div
                className="absolute w-16 h-16 rounded-full"
                style={{
                  left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`,
                  transform: "translate(-50%, -50%)",
                  border: "3px solid rgba(139, 92, 246, 0.8)",
                  boxShadow: "0 0 30px rgba(139, 92, 246, 0.6), inset 0 0 20px rgba(139, 92, 246, 0.3)",
                }}
              />
              <div
                className="absolute w-24 h-24 rounded-full"
                style={{
                  left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`,
                  transform: "translate(-50%, -50%)",
                  border: "1px solid rgba(139, 92, 246, 0.4)",
                  boxShadow: "0 0 40px rgba(139, 92, 246, 0.3)",
                }}
              />
            </>
          )}
          {spotlight.label && (
            <div
              className="absolute bg-violet-500/90 text-white text-xs px-2 py-1 rounded-full backdrop-blur-sm"
              style={{
                left: `${spotlightPos.x}%`,
                top: `${spotlightPos.y + 8}%`,
                transform: "translateX(-50%)",
              }}
            >
              {spotlight.label}
            </div>
          )}
        </div>
      )}

      {/* Keyframe markers */}
      {spotlight && spotlight.keyframes.map((kf) => {
        const label = kf.id === "start" ? "S" : kf.id === "mid" ? "M" : "E";
        return (
          <div
            key={kf.id}
            className="absolute z-25 pointer-events-none"
            style={{ left: `${kf.x}%`, top: `${kf.y}%`, transform: "translate(-50%, -50%)" }}
          >
            <div className="w-6 h-6 rounded-full bg-violet-500 border-2 border-white flex items-center justify-center text-white text-[9px] font-bold shadow-lg">
              {label}
            </div>
          </div>
        );
      })}

      {/* Spotlight placement overlay */}
      {enableSpotlightPlacement && (
        <div
          className="absolute inset-0 z-30"
          style={{ cursor: placingKeyframe ? "crosshair" : "default" }}
          onClick={onVideoAreaClick}
        >
          {placingKeyframe && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 bg-violet-600/90 backdrop-blur-sm text-white text-xs px-3 py-1.5 rounded-full border border-violet-400/50 shadow-lg pointer-events-none">
              Click to place <strong>{placingKeyframe}</strong> point
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// Apple Photos-style Trim Control
interface TrimControlProps {
  duration: number;
  trimStart: number;
  trimEnd: number;
  onTrimStartChange: (value: number) => void;
  onTrimEndChange: (value: number) => void;
  currentTime: number;
  onCurrentTimeChange: (value: number) => void;
}

function TrimControl({ duration, trimStart, trimEnd, onTrimStartChange, onTrimEndChange, currentTime, onCurrentTimeChange }: TrimControlProps) {
  const [isDraggingStart, setIsDraggingStart] = useState(false);
  const [isDraggingEnd, setIsDraggingEnd] = useState(false);
  const [isDraggingPlayhead, setIsDraggingPlayhead] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleMouseDown = (e: React.MouseEvent, type: 'start' | 'end' | 'playhead') => {
    e.preventDefault();
    if (type === 'start') setIsDraggingStart(true);
    if (type === 'end') setIsDraggingEnd(true);
    if (type === 'playhead') setIsDraggingPlayhead(true);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const value = percentage * duration;

      if (isDraggingStart) {
        onTrimStartChange(Math.min(value, trimEnd - 1));
      }
      if (isDraggingEnd) {
        onTrimEndChange(Math.max(value, trimStart + 1));
      }
      if (isDraggingPlayhead) {
        onCurrentTimeChange(value);
      }
    };

    const handleMouseUp = () => {
      setIsDraggingStart(false);
      setIsDraggingEnd(false);
      setIsDraggingPlayhead(false);
    };

    if (isDraggingStart || isDraggingEnd || isDraggingPlayhead) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isDraggingStart, isDraggingEnd, isDraggingPlayhead, duration, trimStart, trimEnd]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startPercentage = duration > 0 ? (trimStart / duration) * 100 : 0;
  const endPercentage = duration > 0 ? (trimEnd / duration) * 100 : 100;
  const currentTimePercentage = duration > 0 ? (currentTime / duration) * 100 : 0;

  return (
    <div className="space-y-4">
      {/* Filmstrip */}
      <div 
        ref={containerRef}
        className="relative h-16 bg-black rounded-lg overflow-hidden"
        style={{ border: `1px solid ${colors.surface}` }}
      >
        {/* Filmstrip frames placeholder */}
        <div className="absolute inset-0 flex">
          {Array.from({ length: 20 }, (_, i) => (
            <div key={i} className="flex-1 border-r border-gray-800" />
          ))}
        </div>
        
        {/* Yellow highlight for trimmed portion */}
        <div
          className="absolute top-0 bottom-0 bg-yellow-400 opacity-30"
          style={{
            left: `${startPercentage}%`,
            right: `${100 - endPercentage}%`,
          }}
        />

        {/* Start handle */}
        <div
          className="absolute top-0 bottom-0 w-4 bg-yellow-400 cursor-ew-resize"
          style={{ left: `${startPercentage}%`, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleMouseDown(e, 'start')}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-8 bg-yellow-400" />
        </div>

        {/* End handle */}
        <div
          className="absolute top-0 bottom-0 w-4 bg-yellow-400 cursor-ew-resize"
          style={{ left: `${endPercentage}%`, transform: 'translateX(-50%)' }}
          onMouseDown={(e) => handleMouseDown(e, 'end')}
        >
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-8 bg-yellow-400" />
        </div>

        {/* Current time indicator */}
        <div
          className="absolute top-0 bottom-0 w-0.5 bg-red-500 cursor-ew-resize"
          style={{ left: `${currentTimePercentage}%` }}
          onMouseDown={(e) => handleMouseDown(e, 'playhead')}
        >
          <div className="absolute top-0 w-3 h-3 bg-red-500 -translate-x-1/2" />
        </div>
      </div>

      {/* Time displays */}
      <div className="flex justify-between text-sm font-mono" style={{ color: colors.white }}>
        <div>{formatTime(trimStart)}</div>
        <div style={{ color: colors.accent }}>{formatTime(trimEnd - trimStart)}</div>
        <div>{formatTime(trimEnd)}</div>
      </div>
    </div>
  );
}

// Main Composer
export function CreatePostComposer({ userId }: CreatePostComposerProps) {
  const router = useRouter();
  const supabase = createClient();

  const [composer, setComposer] = useState<ComposerState>({
    mode: null,
    step: 1,
    selectedFile: null,
    localPreviewUrl: "",
    mediaType: "image",
    quickPost: initialQuickPostState,
    highlight: initialHighlightState,
    activeEditTab: "trim",
    isPublishing: false,
    showEditSheet: false,
//    showMetadataAccordion: false,
  });

  // AI Analysis state
  const [aiAnalysing, setAiAnalysing] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<{
    startTime: number
    endTime: number
    description: string
  } | null>(null)
  const [aiStep, setAiStep] = useState('')
  const [aiError, setAiError] = useState('')

  // Pre-fill position from user's player profile
  useEffect(() => {
    async function prefillPosition() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) return
        const { data: prof } = await supabase
          .from("profiles")
          .select("id")
          .eq("user_id", user.id)
          .maybeSingle()
        if (!prof) return
        const { data: pp } = await supabase
          .from("player_profiles")
          .select("primary_position")
          .eq("profile_id", prof.id)
          .maybeSingle()
        if (pp?.primary_position) {
          setComposer(prev => ({
            ...prev,
            highlight: { ...prev.highlight, position: pp.primary_position! }
          }))
        }
      } catch {}
    }
    prefillPosition()
  }, [])
  const [hasClickedAI, setHasClickedAI] = useState(false)
  const [aiApplied, setAiApplied] = useState(false)

  useEffect(() => {
    return () => {
      if (composer.localPreviewUrl) URL.revokeObjectURL(composer.localPreviewUrl);
    };
  }, [composer.localPreviewUrl]);

  // Update video duration when video loads
  useEffect(() => {
    const video = videoRef.current;
    if (video) {
      const handleLoadedMetadata = () => {
        videoDurationRef.current = video.duration;
      };
      
      video.addEventListener('loadedmetadata', handleLoadedMetadata);
      
      return () => {
        video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      };
    }
  }, [composer.localPreviewUrl]);

  const videoRef = useRef<HTMLVideoElement>(null);
const videoDurationRef = useRef<number>(47); // Default fallback duration

  const selectMode = (mode: ComposerMode) => {
    setComposer(prev => {
      if (prev.mode !== mode) {
        return { ...prev, mode, step: 1, selectedFile: null, localPreviewUrl: "", quickPost: initialQuickPostState, highlight: initialHighlightState, isPublishing: false, publishError: undefined, publishSuccess: false, showEditSheet: false };
      }
      return { ...prev, mode };
    });
  };

  const selectFile = (file: File) => {
    if (composer.localPreviewUrl) URL.revokeObjectURL(composer.localPreviewUrl);
    const mediaType = file.type.startsWith("video") ? "video" : "image";
    const objectUrl = URL.createObjectURL(file);
    setComposer(prev => ({ 
      ...prev, 
      selectedFile: file, 
      localPreviewUrl: objectUrl, 
      mediaType, 
      step: 2,
      highlight: {
        ...prev.highlight,
        previewUrl: objectUrl,
        file: file
      }
    }));
  };

  const goToStep = (step: Step) => setComposer(prev => ({ ...prev, step }));

  const goBack = () => {
    if (composer.step === 1) {
      setComposer(prev => ({ ...prev, mode: null, step: 1, selectedFile: null, localPreviewUrl: "" }));
    } else {
      setComposer(prev => ({ ...prev, step: (composer.step - 1) as Step }));
    }
  };

  const closeComposer = () => {
    if (composer.localPreviewUrl) URL.revokeObjectURL(composer.localPreviewUrl);
    router.back();
  };

  const updateQuickPost = (updates: Partial<QuickPostMetadata>) =>
    setComposer(prev => ({ ...prev, quickPost: { ...prev.quickPost, ...updates } }));

  const updateHighlight = (updates: Partial<HighlightMetadata>) =>
    setComposer(prev => ({ ...prev, highlight: { ...prev.highlight, ...updates } }));

  const updateEditTab = (tab: "trim" | "cover" | "spotlight") =>
    setComposer(prev => ({ ...prev, activeEditTab: tab }));

  // AI Analysis function
  const analyseWithAI = async () => {
    setHasClickedAI(true)
    setAiAnalysing(true)
    setAiStep('Checking video...')
    
    // Ensure the Mux asset has MP4 support enabled (required for TwelveLabs)
    if (composer.highlight.muxAssetId) {
      setAiStep('Preparing video for AI...')
      await fetch('/api/mux/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'ensure-mp4', assetId: composer.highlight.muxAssetId })
      })

      // Poll until static renditions are ready (max ~2 min)
      let mp4Ready = false
      for (let i = 0; i < 24; i++) {
        await new Promise(r => setTimeout(r, 5000))
        const r = await fetch('/api/mux/upload', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'mp4-status', assetId: composer.highlight.muxAssetId })
        })
        const { mp4Status } = await r.json()
        if (mp4Status === 'ready') { mp4Ready = true; break }
      }

      if (!mp4Ready) {
        setAiError('Video MP4 not ready. Please try again in a moment.')
        setAiAnalysing(false)
        setAiStep('')
        return
      }
    }

    // Get video URL for Twelve Labs (capped-1080p MP4)
    let videoUrl = ''
    if (composer.highlight.muxPlaybackId) {
      videoUrl = `https://stream.mux.com/${composer.highlight.muxPlaybackId}/capped-1080p.mp4`
    } else if (composer.localPreviewUrl) {
      videoUrl = composer.localPreviewUrl
    }

    if (!videoUrl) {
      setAiError('No video URL available for AI analysis')
      setAiAnalysing(false)
      setAiStep('')
      return
    }

    try {
      setAiStep('AI is watching your clip...')
      const indexRes = await fetch('/api/twelvelabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'index', videoUrl })
      })
      const { taskId, error, status } = await indexRes.json()
      console.log('Index result:', { taskId, error, status })

      if (error || !taskId) {
        console.warn('Index failed:', error, 'status:', status)
        setAiError(`AI indexing failed (${status || 'unknown'}). Add spotlight manually.`)
        setAiAnalysing(false)
        setAiStep('')
        return
      }

      let videoId = null
      let attempts = 0
      while (!videoId && attempts < 20) {
        await new Promise(r => setTimeout(r, 3000))
        const statusRes = await fetch('/api/twelvelabs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'status', videoId: taskId })
        })
        const status = await statusRes.json()
        console.log('Task status:', status.status)
        if (status.status === 'ready') {
          videoId = status.videoId
        }
        attempts++
      }

      if (!videoId) {
        console.warn('Indexing timed out')
        setAiError('AI analysis timed out. Add spotlight manually.')
        setAiAnalysing(false)
        setAiStep('')
        return
      }

      setAiStep('Finding your best moment...')

      const analyzeRes = await fetch('/api/twelvelabs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'analyze', videoId })
      })
      const result = await analyzeRes.json()
      
      if (result.found) {
        setAiSuggestion({
          startTime: result.startTime,
          endTime: result.endTime,
          description: result.description
        })
      } else {
        setAiError('AI could not detect a clear highlight. Add spotlight manually.')
      }
      setAiStep('')
      setAiAnalysing(false)
    } catch (error) {
      console.error('AI analysis error:', error)
      setAiSuggestion(null)
      setAiStep('')
      setAiAnalysing(false)
      setAiError('AI analysis unavailable for this video. Add spotlight manually below.')
    }
  }

  // Trim helpers
  const updateTrimStart = (time: number) => updateHighlight({ trimStart: time });
  const updateTrimEnd = (time: number) => updateHighlight({ trimEnd: time });
  const updateCurrentTime = (time: number) => updateHighlight({ currentTime: time });

  const resolvedDuration = composer.highlight.duration || 0;
  const resolvedTrimStart = composer.highlight.trimStart || 0;
  const resolvedTrimEnd = composer.highlight.trimEnd || resolvedDuration;

  // Spotlight management
  const setSpotlightStartPoint = (x: number, y: number) => {
    const s = composer.highlight.spotlight;
    updateHighlight({
      spotlight: {
        enabled: true, style: s?.style || "soft_white",
        startTime: composer.highlight.currentTime || 0,
        durationSeconds: s?.durationSeconds || 2,
        keyframes: [{ id: "start", progress: 0, x, y }, ...(s?.keyframes?.slice(1) || [])],
        label: s?.label,
      }
    });
  };

  const setSpotlightMidPoint = (x: number, y: number) => {
    const s = composer.highlight.spotlight;
    const kf = s?.keyframes || [];
    updateHighlight({
      spotlight: {
        enabled: true, style: s?.style || "soft_white",
        startTime: s?.startTime || composer.highlight.currentTime || 0,
        durationSeconds: s?.durationSeconds || 2,
        keyframes: [
          kf[0] || { id: "start", progress: 0, x: 50, y: 50 },
          { id: "mid", progress: 0.5, x, y },
          kf[2] || { id: "end", progress: 1, x: 50, y: 50 },
        ],
        label: s?.label,
      }
    });
  };

  const setSpotlightEndPoint = (x: number, y: number) => {
    const s = composer.highlight.spotlight;
    const kf = s?.keyframes || [];
    updateHighlight({
      spotlight: {
        enabled: true, style: s?.style || "soft_white",
        startTime: s?.startTime || composer.highlight.currentTime || 0,
        durationSeconds: s?.durationSeconds || 2,
        keyframes: [
          kf[0] || { id: "start", progress: 0, x: 50, y: 50 },
          kf[1] || { id: "mid", progress: 0.5, x: 50, y: 50 },
          { id: "end", progress: 1, x, y },
        ],
        label: s?.label,
      }
    });
  };

  const updateSpotlightStyle = (style: SpotlightStyle) => {
    const s = composer.highlight.spotlight;
    if (s) updateHighlight({ spotlight: { ...s, style } });
  };

  const updateSpotlightDuration = (durationSeconds: 1 | 2 | 3) => {
    const s = composer.highlight.spotlight;
    if (s) updateHighlight({ spotlight: { ...s, durationSeconds } });
  };

  const updateSpotlightLabel = (label: string) => {
    const s = composer.highlight.spotlight;
    if (s) updateHighlight({ spotlight: { ...s, label: label || undefined } });
  };

  const clearSpotlight = () => updateHighlight({ spotlight: undefined });

  const setCoverFrame = () => updateHighlight({ coverFrameTime: composer.highlight.currentTime });

  // Video event handlers
  const handleVideoLoadedMetadata = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    const video = e.currentTarget;
    const duration = video.duration;
    if (!Number.isFinite(duration) || duration <= 0) return;
    updateHighlight({ duration });
  };

  const handleVideoTimeUpdate = (e: React.SyntheticEvent<HTMLVideoElement>) => {
    updateHighlight({ currentTime: e.currentTarget.currentTime });
  };

  const handleVideoAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!composer.placingKeyframe) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    if (composer.placingKeyframe === "start") setSpotlightStartPoint(x, y);
    if (composer.placingKeyframe === "mid") setSpotlightMidPoint(x, y);
    if (composer.placingKeyframe === "end") setSpotlightEndPoint(x, y);
    // Reopen edit sheet after placement so user can place next keyframe
    setComposer(prev => ({ ...prev, placingKeyframe: undefined, showEditSheet: true }));
  };

  // Publish
  const publishPost = async () => {
    if (!composer.selectedFile || !composer.mode) return;

    if (composer.mode === "highlight") {
      if (!composer.highlight.caption.trim()) { setComposer(prev => ({ ...prev, publishError: "Caption is required" })); return; }
      if (!composer.highlight.position.trim()) { setComposer(prev => ({ ...prev, publishError: "Position is required" })); return; }
      if (!composer.highlight.actionType) { setComposer(prev => ({ ...prev, publishError: "Action type is required" })); return; }
    }

    setComposer(prev => ({ ...prev, isPublishing: true, publishError: undefined }));

    try {
      const formData = new FormData();
      formData.append("mediaFile", composer.selectedFile);
      formData.append("caption", composer.mode === "quick" ? composer.quickPost.caption : composer.highlight.caption);

      let mappedContentType = "";
      if (composer.mode === "quick") {
        const map: Record<string, string> = { daily_post: "general", training_update: "training", achievement: "achievement", general: "general" };
        mappedContentType = map[composer.quickPost.postType] || "general";
      } else {
        const map: Record<string, string> = { match_highlight: "highlight", match_video: "match_moment", training_clip: "training" };
        mappedContentType = map[composer.highlight.clipType] || "highlight";
      }

      formData.append("contentType", mappedContentType);
      formData.append("composerMode", composer.mode);
      formData.append("mediaType", composer.mediaType);
      formData.append("visibility", composer.mode === "quick" ? composer.quickPost.visibility : composer.highlight.visibility);

      if (composer.mode === "quick") {
        formData.append("postType", composer.quickPost.postType);
      } else {
        formData.append("clipType", composer.highlight.clipType);
        formData.append("position", composer.highlight.position);
        formData.append("actionType", composer.highlight.actionType);
        if (composer.highlight.opponent) formData.append("opponent", composer.highlight.opponent);
        if (composer.highlight.minute) formData.append("minute", composer.highlight.minute.toString());
        if (composer.highlight.competition) formData.append("competition", composer.highlight.competition);
        if (composer.highlight.result) formData.append("result", composer.highlight.result);
        if (composer.highlight.footUsed) formData.append("footUsed", composer.highlight.footUsed);
        if (composer.highlight.matchDate) formData.append("matchDate", composer.highlight.matchDate);
        if (composer.highlight.sessionName) formData.append("sessionName", composer.highlight.sessionName);
        if (composer.highlight.location) formData.append("location", composer.highlight.location);
        if (composer.highlight.trimStart !== undefined && composer.highlight.trimStart > 0) formData.append("trimStart", composer.highlight.trimStart.toString());
        if (composer.highlight.trimEnd !== undefined && composer.highlight.trimEnd < (composer.highlight.duration || 0)) formData.append("trimEnd", composer.highlight.trimEnd.toString());
        if (composer.highlight.coverFrameTime && composer.highlight.coverFrameTime > 0) formData.append("coverFrameTime", composer.highlight.coverFrameTime.toString());
        if (composer.highlight.spotlight) {
          const sp = composer.highlight.spotlight;
          formData.append("spotlightStyle", sp.style);
          formData.append("spotlightKeyframes", JSON.stringify(sp.keyframes));
          formData.append("spotlightTime", sp.startTime.toString());
          formData.append("spotlightLabel", sp.label || "");
          formData.append("spotlightDuration", sp.durationSeconds.toString());
          formData.append("spotlightX", sp.keyframes[0]?.x.toString() || "50");
          formData.append("spotlightY", sp.keyframes[0]?.y.toString() || "50");
        }
        // Add Mux metadata if available
        if (composer.highlight.muxPlaybackId) {
          formData.append("muxPlaybackId", composer.highlight.muxPlaybackId);
        }
        if (composer.highlight.muxAssetId) {
          formData.append("muxAssetId", composer.highlight.muxAssetId);
        }
      }

      const response = await fetch("/api/posts", { method: "POST", body: formData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || "Failed to create post");

      setComposer(prev => ({ ...prev, publishSuccess: true, isPublishing: false }));
      setTimeout(() => router.push("/feed"), 2000);
    } catch (error) {
      console.error("Publish error:", error);
      setComposer(prev => ({ ...prev, isPublishing: false, publishError: error instanceof Error ? error.message : "Failed to publish post" }));
    }
  };

  // Mode selection screen
  if (!composer.mode) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: colors.black }}>
        <div className="max-w-xl mx-auto w-full px-4">
          <div className="text-center mb-12">
            <h1 style={{ ...styles.displayHeader, fontSize: "48px", color: colors.white, marginBottom: "16px" }}>
              CREATE POST
            </h1>
            <p style={{ color: colors.muted, fontSize: "18px" }}>Choose how you want to share your content</p>
          </div>
          <div className="grid md:grid-cols-2 gap-6">
            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => selectMode("quick")} className="group relative overflow-hidden p-8 text-left transition-all" style={{ backgroundColor: colors.card, border: `1px solid ${colors.surface}`, borderRadius: `${borderRadius.sheet}px` }}>
              <div className="relative z-10">
                <div className="text-5xl mb-4">⚡</div>
                <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "12px" }}>
                  QUICK POST
                </h2>
                <p style={{ color: colors.muted, marginBottom: "16px" }}>For daily updates, casual training snaps, and simple posts</p>
                <div className="flex flex-wrap gap-2">
                  {["Fast", "Simple", "Daily"].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-sm border" style={{ backgroundColor: `${colors.accent}20`, color: colors.accent, borderColor: `${colors.accent}40` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>

            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} onClick={() => selectMode("highlight")} className="group relative overflow-hidden p-8 text-left transition-all" style={{ backgroundColor: colors.card, border: `1px solid ${colors.surface}`, borderRadius: `${borderRadius.sheet}px` }}>
              <div className="relative z-10">
                <div className="text-5xl mb-4">🎯</div>
                <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "12px" }}>
                  HIGHLIGHT BUILDER
                </h2>
                <p style={{ color: colors.muted, marginBottom: "16px" }}>For football clips, match highlights, and training videos</p>
                <div className="flex flex-wrap gap-2">
                  {["Professional", "Football", "Detailed"].map(tag => (
                    <span key={tag} className="px-3 py-1 rounded-full text-sm border" style={{ backgroundColor: `${colors.accent}20`, color: colors.accent, borderColor: `${colors.accent}40` }}>
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.button>
          </div>
        </div>
      </div>
    );
  }

  // Step indicator - minimal dots
  const stepDots = Array.from({ length: 5 }, (_, i) => i + 1 as Step);

  return (
    <div className="min-h-screen bg-[#0B0B0F]">
      <div className="max-w-xl mx-auto px-4 pb-24">
        <AnimatePresence mode="wait">
          <motion.div
            key={`${composer.mode}-${composer.step}`}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
            className="h-full"
          >
            {/* Header */}
            <div 
              className="flex items-center justify-between mb-8"
              style={{ ...glassPanel, padding: "16px", borderRadius: borderRadius.card }}
            >
              <button 
                onClick={goBack} 
                className="p-2 transition-all rounded-lg" 
                style={{ 
                  color: colors.muted,
                  backgroundColor: `${colors.glass.background}`,
                  border: `1px solid ${colors.glass.border}`
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <h1 style={{ 
                fontFamily: typography.family,
                fontWeight: typography.black,
                fontSize: "20px",
                color: colors.white,
                letterSpacing: "0.05em"
              }}>
                {composer.mode === "quick" ? "QUICK POST" : "HIGHLIGHT BUILDER"}
              </h1>
              <button 
                onClick={closeComposer} 
                className="p-2 transition-all rounded-lg" 
                style={{ 
                  color: colors.muted,
                  backgroundColor: `${colors.glass.background}`,
                  border: `1px solid ${colors.glass.border}`
                }}
              >
                <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            {/* Step indicator - minimal dots */}
            <div className="flex items-center justify-center mb-8">
              <div className="flex items-center space-x-2">
                {stepDots.map(step => (
                  <div
                    key={step}
                    className={`w-2 h-2 rounded-full transition-all ${composer.step >= step ? "bg-white" : "bg-gray-600"}`}
                  />
                ))}
              </div>
            </div>

            {/* Content */}
            <div style={{ backgroundColor: colors.card, borderRadius: `${borderRadius.sheet}px` }} className="p-8">

              {/* SUCCESS */}
              {composer.publishSuccess && (
                <div className="text-center py-12">
                  <div className="text-6xl mb-4">🎉</div>
                  <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "8px" }}>
                    POST PUBLISHED!
                  </h2>
                  <p style={{ color: colors.success }}>Your post is now live on the feed.</p>
                  <p style={{ color: colors.muted, fontSize: "14px", marginTop: "16px" }}>Redirecting to feed...</p>
                </div>
              )}

              {/* ── QUICK POST FLOW ── */}
              {composer.mode === "quick" && !composer.publishSuccess && (
                <>
                  {composer.step === 1 && (
                    <div className="text-center">
                      <div className="text-6xl mb-4">📸</div>
                      <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "16px" }}>
                        SELECT MEDIA
                      </h2>
                      <p style={{ color: colors.muted, marginBottom: "32px" }}>Choose a photo or video for your quick post</p>
                      <div className="max-w-md mx-auto">
                        <input type="file" accept="image/*,video/*" onChange={(e) => { const f = e.target.files?.[0]; if (f) selectFile(f); }} className="hidden" id="quick-file-input" />
                        <label htmlFor="quick-file-input" className="block w-full px-6 py-4 text-center font-medium cursor-pointer transition-all" style={{ ...styles.displayHeader, backgroundColor: colors.accent, color: colors.white, borderRadius: `${borderRadius.button}px` }}>
                          CHOOSE MEDIA
                        </label>
                      </div>
                      <div className="mt-6">
                        <button onClick={() => selectMode("highlight")} className="transition-colors text-sm" style={{ color: colors.muted }}>
                          Use Highlight Builder instead →
                        </button>
                      </div>
                    </div>
                  )}

                  {composer.step === 2 && composer.selectedFile && (
                    <div>
                      <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "24px" }}>
                        POST DETAILS
                      </h2>
                      <div className="mb-6">
                        {composer.mediaType === "video"
                          ? <div style={{
                              width: '100%',
                              height: '300px',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <video
                                src={composer.localPreviewUrl}
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                                controls
                              />
                            </div>
                          : <div style={{
                              width: '100%',
                              height: '300px',
                              borderRadius: '16px',
                              overflow: 'hidden',
                              position: 'relative'
                            }}>
                              <img 
                                src={composer.localPreviewUrl} 
                                alt="Preview" 
                                style={{
                                  width: '100%',
                                  height: '100%',
                                  objectFit: 'cover'
                                }}
                              />
                            </div>}
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>Caption</label>
                        <textarea 
                          value={composer.quickPost.caption} 
                          onChange={(e) => updateQuickPost({ caption: e.target.value })} 
                          placeholder="Write your caption..." 
                          className="w-full px-4 py-3 resize-none transition-all"
                          style={{ 
                            backgroundColor: colors.input, 
                            border: `1px solid ${colors.surface}`, 
                            color: colors.white, 
                            borderRadius: `${borderRadius.button}px`,
                            fontFamily: typography.body
                          }} 
                          rows={4} 
                        />
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-3" style={{ color: colors.white }}>Post Type</label>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {postTypeOptions.map(type => (
                            <button 
                              key={type.value} 
                              onClick={() => updateQuickPost({ postType: type.value as any })} 
                              className={`p-3 border transition-all text-sm ${
                                composer.quickPost.postType === type.value 
                                  ? "" 
                                  : ""
                              }`}
                              style={{ 
                                backgroundColor: composer.quickPost.postType === type.value ? colors.accent : colors.surface,
                                borderColor: composer.quickPost.postType === type.value ? colors.accent : colors.input,
                                color: colors.white,
                                borderRadius: `${borderRadius.button}px`
                              }}
                            >
                              <div className="text-2xl mb-1">{type.icon}</div>
                              <div>{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-3" style={{ color: colors.white }}>Visibility</label>
                        <div className="grid grid-cols-2 gap-3">
                          {[{ v: "public", icon: "🌍", label: "Public", sub: "Everyone can see" }, { v: "followers", icon: "👥", label: "Followers", sub: "Followers only" }].map(opt => (
                            <button 
                              key={opt.v} 
                              onClick={() => updateQuickPost({ visibility: opt.v as any })} 
                              className={`p-3 border transition-all ${
                                composer.quickPost.visibility === opt.v 
                                  ? "" 
                                  : ""
                              }`}
                              style={{ 
                                backgroundColor: composer.quickPost.visibility === opt.v ? colors.accent : colors.surface,
                                borderColor: composer.quickPost.visibility === opt.v ? colors.accent : colors.input,
                                color: colors.white,
                                borderRadius: `${borderRadius.button}px`
                              }}
                            >
                              <div className="text-xl mb-1">{opt.icon}</div>
                              <div className="font-medium">{opt.label}</div>
                              <div className="text-xs" style={{ color: colors.muted }}>{opt.sub}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <button onClick={goBack} className="px-6 py-3 transition-all" style={{ backgroundColor: colors.surface, color: colors.white, border: `1px solid ${colors.input}`, borderRadius: `${borderRadius.button}px` }}>
                          Back
                        </button>
                        <button onClick={() => goToStep(3)} className="px-6 py-3 font-medium transition-all" style={{ ...styles.displayHeader, backgroundColor: colors.accent, color: colors.white, borderRadius: `${borderRadius.button}px` }}>
                          Next: Review
                        </button>
                      </div>
                    </div>
                  )}

                  {composer.step === 3 && (
                    <div>
                      <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "24px" }}>
                        REVIEW & PUBLISH
                      </h2>
                      <div style={{ backgroundColor: colors.surface, borderRadius: `${borderRadius.sheet}px` }} className="p-6 mb-6">
                        <div className="mb-4">
                          {composer.mediaType === "video"
                            ? <div style={{
                                width: '100%',
                                height: '300px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <video
                                  src={composer.localPreviewUrl}
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                  controls
                                />
                              </div>
                            : <div style={{
                                width: '100%',
                                height: '300px',
                                borderRadius: '16px',
                                overflow: 'hidden',
                                position: 'relative'
                              }}>
                                <img 
                                  src={composer.localPreviewUrl} 
                                  alt="Preview" 
                                  style={{
                                    width: '100%',
                                    height: '100%',
                                    objectFit: 'cover'
                                  }}
                                />
                              </div>}
                        </div>
                        <p style={{ color: colors.white, marginBottom: "8px" }}>{composer.quickPost.caption || "No caption"}</p>
                        <div className="flex gap-2 text-sm">
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: colors.input, color: colors.muted }}>
                            {postTypeOptions.find(t => t.value === composer.quickPost.postType)?.label}
                          </span>
                          <span className="px-2 py-1 rounded" style={{ backgroundColor: colors.input, color: colors.muted }}>
                            {composer.quickPost.visibility === "public" ? "Public" : "Followers"}
                          </span>
                        </div>
                      </div>
                      {composer.publishError && (
                        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: `${colors.danger}20`, border: `1px solid ${colors.danger}40`, color: colors.danger }}>
                          {composer.publishError}
                        </div>
                      )}
                      <div className="flex justify-between">
                        <button onClick={goBack} disabled={composer.isPublishing} className="px-6 py-3 transition-all disabled:opacity-50" style={{ backgroundColor: colors.surface, color: colors.white, border: `1px solid ${colors.input}`, borderRadius: `${borderRadius.button}px` }}>
                          Back
                        </button>
                        <button 
                          onClick={publishPost} 
                          disabled={composer.isPublishing || !composer.quickPost.caption} 
                          className="w-full px-6 py-3 font-medium transition-all disabled:opacity-50"
                          style={{ 
                            ...styles.displayHeader, 
                            backgroundColor: colors.black, 
                            color: colors.white, 
                            borderRadius: `${borderRadius.button}px`,
                            border: `1px solid ${colors.white}`
                          }}
                          onMouseEnter={(e) => {
                            if (!composer.isPublishing && composer.quickPost.caption) {
                              e.currentTarget.style.backgroundColor = colors.accent;
                              e.currentTarget.style.color = colors.white;
                              e.currentTarget.style.borderColor = colors.accent;
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = colors.black;
                            e.currentTarget.style.color = colors.white;
                            e.currentTarget.style.borderColor = colors.white;
                          }}
                        >
                          {composer.isPublishing ? "Publishing..." : "PUBLISH"}
                        </button>
                      </div>
                    </div>
                  )}
                </>
              )}

              {/* ── HIGHLIGHT BUILDER FLOW ── */}
              {composer.mode === "highlight" && !composer.publishSuccess && (
                <>
                  {/* Step 1: Select Clip */}
                  {composer.step === 1 && (
                    <div className="text-center">
                      <div className="text-6xl mb-4">🎬</div>
                      <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "16px" }}>
                        SELECT CLIP
                      </h2>
                      <p style={{ color: colors.muted, marginBottom: "32px" }}>Upload a video clip for your highlight</p>
                      <div className="max-w-md mx-auto mb-6">
                        <MuxVideoUploader
                          onUploadComplete={(data) => {
                            setComposer(prev => ({
                              ...prev,
                              selectedFile: null, // Clear old file reference
                              localPreviewUrl: '', // Clear old preview
                              mediaType: 'video',
                              step: 2,
                              highlight: {
                                ...prev.highlight,
                                mediaUrl: data.playbackUrl,
                                muxPlaybackId: data.playbackId,
                                muxAssetId: data.assetId,
                                coverFrameUrl: data.thumbnailUrl,
                                previewUrl: data.playbackUrl
                              }
                            }))
                          }}
                          onProgress={(p) => console.log('Upload progress:', p)}
                        />
                      </div>
                      <div className="mb-6">
                        <label className="block text-sm font-medium mb-3" style={{ color: colors.white }}>Clip Type</label>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                          {clipTypeOptions.map(type => (
                            <button 
                              key={type.value} 
                              onClick={() => updateHighlight({ clipType: type.value as any })} 
                              className={`p-4 border transition-all ${
                                composer.highlight.clipType === type.value 
                                  ? "" 
                                  : ""
                              }`}
                              style={{ 
                                backgroundColor: composer.highlight.clipType === type.value ? colors.accent : colors.surface,
                                borderColor: composer.highlight.clipType === type.value ? colors.accent : colors.input,
                                color: colors.white,
                                borderRadius: `${borderRadius.button}px`
                              }}
                            >
                              <div className="text-2xl mb-2">{type.icon}</div>
                              <div className="font-medium">{type.label}</div>
                            </button>
                          ))}
                        </div>
                      </div>
                      <div className="mt-6">
                        <button onClick={() => selectMode("quick")} className="transition-colors text-sm" style={{ color: colors.muted }}>
                          Switch to Quick Post →
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 2: Edit Clip */}
                  {composer.step === 2 && (composer.selectedFile || composer.highlight.muxPlaybackId) && (
                    <div>
                      <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "24px" }}>
                        EDIT CLIP
                      </h2>

                      {/* Video Preview */}
                      <div className="mb-4">
                        {composer.highlight.muxPlaybackId ? (
  <div style={{ position: 'relative', width: '100%', borderRadius: '16px' }}>
    {/* Video + spotlight — this div handles keyframe placement clicks */}
    <div
      style={{ position: 'relative', width: '100%', borderRadius: '16px', overflow: 'hidden', cursor: composer.placingKeyframe ? 'crosshair' : 'default' }}
      onClick={handleVideoAreaClick}
    >
      {composer.placingKeyframe && (
        <div style={{
          position: 'absolute', top: 10, left: '50%', transform: 'translateX(-50%)',
          background: 'rgba(124,58,237,0.9)', color: 'white', fontSize: 12,
          padding: '4px 12px', borderRadius: 999, zIndex: 30, pointerEvents: 'none',
          whiteSpace: 'nowrap'
        }}>
          Click to place <strong>{composer.placingKeyframe}</strong> point
        </div>
      )}
      <MuxPlayer
        playbackId={composer.highlight.muxPlaybackId}
        style={{ width: '100%', height: '300px', borderRadius: '16px' }}
        autoPlay={false}
        muted={false}
        onDurationChange={(evt: any) => {
          const duration = evt?.detail?.duration ?? evt?.target?.duration ?? 0
          if (duration > 0) { videoDurationRef.current = duration; updateHighlight({ duration }) }
        }}
        onLoadedMetadata={(evt: any) => {
          const duration = evt?.target?.duration ?? evt?.detail?.duration ?? 0
          if (duration > 0) { videoDurationRef.current = duration; updateHighlight({ duration }) }
        }}
        onTimeUpdate={(evt: any) => {
          const time = evt?.target?.currentTime ?? evt?.detail?.currentTime ?? 0
          if (time > 0) updateHighlight({ currentTime: time })
        }}
      />
      {/* Spotlight overlay */}
      {(() => {
        const spotlight = composer.highlight.spotlight
        const currentTime = composer.highlight.currentTime || 0
        const canShow = !!spotlight && isSpotlightVisible(spotlight, currentTime)
        const spotlightPos = canShow ? interpolateSpotlightPosition(spotlight!, currentTime) : null
        if (!canShow || !spotlightPos || !spotlight) return null
        return (
          <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none', zIndex: 20 }}>
            {spotlight.style === 'soft_white' && (<>
              <div style={{ position: 'absolute', width: 128, height: 128, borderRadius: '50%', opacity: 0.3, left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,rgba(255,255,255,0.8) 0%,rgba(255,255,255,0.4) 30%,transparent 70%)', filter: 'blur(8px)' }} />
              <div style={{ position: 'absolute', width: 80, height: 80, borderRadius: '50%', left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`, transform: 'translate(-50%,-50%)', background: 'radial-gradient(circle,rgba(255,255,255,0.6) 0%,rgba(255,255,255,0.2) 40%,transparent 80%)' }} />
            </>)}
            {spotlight.style === 'dark_focus' && (<>
              <div style={{ position: 'absolute', inset: 0, background: `radial-gradient(circle at ${spotlightPos.x}% ${spotlightPos.y}%,transparent 15%,rgba(0,0,0,0.7) 50%)` }} />
              <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`, transform: 'translate(-50%,-50%)', border: '2px solid rgba(255,255,255,0.3)', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }} />
            </>)}
            {spotlight.style === 'ring_glow' && (<>
              <div style={{ position: 'absolute', width: 64, height: 64, borderRadius: '50%', left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`, transform: 'translate(-50%,-50%)', border: '3px solid rgba(139,92,246,0.8)', boxShadow: '0 0 30px rgba(139,92,246,0.6),inset 0 0 20px rgba(139,92,246,0.3)' }} />
              <div style={{ position: 'absolute', width: 96, height: 96, borderRadius: '50%', left: `${spotlightPos.x}%`, top: `${spotlightPos.y}%`, transform: 'translate(-50%,-50%)', border: '1px solid rgba(139,92,246,0.4)', boxShadow: '0 0 40px rgba(139,92,246,0.3)' }} />
            </>)}
            {spotlight.label && (
              <div style={{ position: 'absolute', background: 'rgba(139,92,246,0.9)', color: 'white', fontSize: 12, padding: '2px 8px', borderRadius: 999, left: `${spotlightPos.x}%`, top: `${spotlightPos.y + 8}%`, transform: 'translateX(-50%)' }}>
                {spotlight.label}
              </div>
            )}
          </div>
        )
      })()}
    </div>

    {/* AI overlay — sibling to the video div so it's never blocked by MuxPlayer's shadow DOM */}
    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, zIndex: 30, background: 'linear-gradient(transparent,rgba(0,0,0,0.75))', padding: '32px 12px 12px', borderBottomLeftRadius: 16, borderBottomRightRadius: 16, pointerEvents: 'none' }}>
      <div style={{ pointerEvents: 'auto' }}>
        {!aiSuggestion && !aiApplied && !aiAnalysing && (
          <button
            onClick={analyseWithAI}
            style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg,rgba(124,58,237,0.9),rgba(37,99,235,0.9))', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '10px', color: 'white', fontWeight: 700, fontSize: '13px', cursor: 'pointer' }}
          >
            ✨ AI Detect Best Moment
          </button>
        )}
        {aiAnalysing && (
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.85)', fontSize: 13, fontWeight: 600, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '10px' }}>
            ⚙️ {aiStep || 'Analysing...'}
          </div>
        )}
        {aiError && !aiAnalysing && (
          <div style={{ color: '#FCD34D', fontSize: 12, textAlign: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '6px 10px' }}>
            ⚠️ {aiError} — <span onClick={analyseWithAI} style={{ textDecoration: 'underline', cursor: 'pointer' }}>retry</span>
          </div>
        )}
        {aiSuggestion && !aiApplied && (
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, background: 'rgba(124,58,237,0.9)', backdropFilter: 'blur(8px)', borderRadius: 10, padding: '8px 12px' }}>
            <div style={{ flex: 1, color: 'white', fontSize: 12 }}>
              <span style={{ fontWeight: 700 }}>✨ Best moment</span> at {aiSuggestion.startTime.toFixed(1)}s
            </div>
            <button
              onClick={() => {
                if (!aiSuggestion) return
                const s = composer.highlight.spotlight
                updateHighlight({ spotlight: { enabled: true, style: s?.style || 'soft_white', startTime: aiSuggestion.startTime, durationSeconds: Math.min(Math.round(aiSuggestion.endTime - aiSuggestion.startTime), 3) as 1|2|3 || 2, keyframes: s?.keyframes || [{ id: 'start', progress: 0, x: 50, y: 50 }, { id: 'mid', progress: 0.5, x: 50, y: 50 }, { id: 'end', progress: 1, x: 50, y: 50 }], label: s?.label } })
                setAiApplied(true)
              }}
              style={{ padding: '4px 12px', background: 'white', color: '#7C3AED', fontWeight: 700, fontSize: 12, borderRadius: 6, border: 'none', cursor: 'pointer' }}
            >
              Apply →
            </button>
          </div>
        )}
        {aiApplied && (
          <div style={{ color: '#6EE7B7', fontSize: 12, textAlign: 'center', background: 'rgba(0,0,0,0.5)', borderRadius: 8, padding: '6px 10px', fontWeight: 600 }}>
            ✅ Spotlight applied — place keyframes below
          </div>
        )}
      </div>
    </div>
  </div>
                        ) : (
                          <HighlightVideoPreview
                            localPreviewUrl={composer.localPreviewUrl}
                            videoRef={videoRef}
                            spotlight={composer.highlight.spotlight}
                            currentTime={composer.highlight.currentTime || 0}
                            placingKeyframe={composer.placingKeyframe}
                            showControls={false}
                            enableSpotlightPlacement={composer.activeEditTab === "spotlight"}
                            onLoadedMetadata={handleVideoLoadedMetadata}
                            onDurationChange={() => {}}
                            onTimeUpdate={handleVideoTimeUpdate}
                            onSeeked={() => {}}
                            onVideoAreaClick={handleVideoAreaClick}
                          />
                        )}
                      </div>

                      {/* Inline spotlight placement — shown when a spotlight exists */}
                      {composer.highlight.spotlight && (
                        <div style={{
                          background: 'rgba(124,58,237,0.08)',
                          border: '1px solid rgba(124,58,237,0.25)',
                          borderRadius: '12px',
                          padding: '12px',
                          marginBottom: '12px'
                        }}>
                          <div style={{ color: '#A78BFA', fontSize: 12, fontWeight: 700, marginBottom: 10 }}>
                            🎯 SPOTLIGHT PLACEMENT
                            <span style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 400, marginLeft: 8 }}>
                              tap a point, then click the video
                            </span>
                          </div>

                          {/* Style */}
                          <div className="flex gap-2 mb-3">
                            {([
                              { id: 'soft_white', label: 'Soft' },
                              { id: 'dark_focus', label: 'Focus' },
                              { id: 'ring_glow', label: 'Ring' }
                            ] as const).map(s => (
                              <button
                                key={s.id}
                                onClick={() => updateSpotlightStyle(s.id)}
                                style={{
                                  flex: 1, padding: '5px 0', fontSize: 11, fontWeight: 600,
                                  borderRadius: 8, border: 'none', cursor: 'pointer',
                                  background: composer.highlight.spotlight?.style === s.id
                                    ? '#7C3AED' : 'rgba(255,255,255,0.07)',
                                  color: 'white'
                                }}
                              >
                                {s.label}
                              </button>
                            ))}
                          </div>

                          {/* Keyframe placement */}
                          <div className="flex gap-2 mb-2">
                            {(['start', 'mid', 'end'] as const).map(kid => (
                              <button
                                key={kid}
                                onClick={() => setComposer(prev => ({ ...prev, placingKeyframe: kid, showEditSheet: false }))}
                                style={{
                                  flex: 1, padding: '6px 0', fontSize: 11, fontWeight: 700,
                                  borderRadius: 8, border: 'none', cursor: 'pointer',
                                  background: composer.placingKeyframe === kid
                                    ? '#7C3AED' : 'rgba(255,255,255,0.07)',
                                  color: composer.placingKeyframe === kid ? 'white' : 'rgba(255,255,255,0.6)',
                                  textTransform: 'capitalize'
                                }}
                              >
                                {kid}
                              </button>
                            ))}
                          </div>

                          {composer.placingKeyframe && (
                            <p style={{ color: '#A78BFA', fontSize: 11, textAlign: 'center', marginTop: 4 }}>
                              ↑ Click the video to place <strong>{composer.placingKeyframe}</strong> point
                            </p>
                          )}

                          <button
                            onClick={() => updateHighlight({ spotlight: undefined })}
                            style={{
                              width: '100%', marginTop: 8, padding: '4px', fontSize: 11,
                              background: 'transparent', border: '1px solid rgba(239,68,68,0.3)',
                              borderRadius: 6, color: 'rgba(239,68,68,0.7)', cursor: 'pointer'
                            }}
                          >
                            Clear spotlight
                          </button>
                        </div>
                      )}

                      {/* Edit Button */}
                      <button 
                        onClick={() => setComposer(prev => ({ ...prev, showEditSheet: true }))}
                        className="w-full px-6 py-4 font-medium transition-all mb-6"
                        style={{ 
                          ...styles.displayHeader, 
                          backgroundColor: colors.surface, 
                          color: colors.white, 
                          borderRadius: `${borderRadius.button}px`,
                          border: `1px solid ${colors.input}`
                        }}
                      >
                        EDIT CLIP
                      </button>

                      <div className="flex justify-between">
                        <button onClick={goBack} className="px-6 py-3 transition-all" style={{ backgroundColor: colors.surface, color: colors.white, border: `1px solid ${colors.input}`, borderRadius: `${borderRadius.button}px` }}>
                          Back
                        </button>
                        <button onClick={() => goToStep(3)} className="px-6 py-3 font-medium transition-all" style={{ 
                          fontFamily: typography.family,
                          fontWeight: typography.semibold,
                          backgroundColor: colors.electricViolet, 
                          color: colors.white, 
                          borderRadius: `${borderRadius.button}px`
                        }}>
                          Next: Publish
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 3: Metadata */}
                  {composer.step === 3 && (
                    <div>
                      <h2 style={{ fontFamily: "'Satoshi', Inter, sans-serif", fontWeight: 900, fontSize: "26px", color: colors.white, marginBottom: "24px", letterSpacing: "-0.03em" }}>
                        Add Your Highlight
                      </h2>

                      {/* Video Preview */}
                      <div className="mb-6">
                        {composer.highlight.muxPlaybackId ? (
                          <div style={{
                            width: '100%',
                            height: '160px',
                            borderRadius: '12px',
                            overflow: 'hidden',
                            position: 'relative'
                          }}>
                            <img
                              src={composer.highlight.coverFrameUrl || 
                                `https://image.mux.com/${composer.highlight.muxPlaybackId}/thumbnail.jpg`}
                              style={{
                                width: '100%',
                                height: '100%',
                                objectFit: 'cover'
                              }}
                              alt="Video thumbnail"
                            />
                            <div style={{
                              position: 'absolute',
                              inset: 0,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              background: 'rgba(0,0,0,0.3)'
                            }}>
                              <div style={{
                                width: 48,
                                height: 48,
                                borderRadius: '50%',
                                background: 'rgba(255,255,255,0.2)',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                fontSize: 20
                              }}>▶</div>
                            </div>
                            {composer.highlight.spotlight?.enabled && (
                              <div style={{
                                position: 'absolute',
                                bottom: 8,
                                left: 8,
                                background: 'rgba(124,58,237,0.9)',
                                color: 'white',
                                fontSize: 11,
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontWeight: 600
                              }}>
                                ✨ Spotlight at {composer.highlight.spotlight.startTime.toFixed(1)}s
                              </div>
                            )}
                          </div>
                        ) : composer.localPreviewUrl ? (
                          <HighlightVideoPreview
                            localPreviewUrl={composer.localPreviewUrl}
                            videoRef={videoRef}
                            spotlight={composer.highlight.spotlight}
                            currentTime={composer.highlight.currentTime || 0}
                            placingKeyframe={undefined}
                            showControls={true}
                            enableSpotlightPlacement={false}
                            onLoadedMetadata={() => {}}
                            onDurationChange={() => {}}
                            onTimeUpdate={() => {}}
                            onSeeked={() => {}}
                            onVideoAreaClick={() => {}}
                          />
                        ) : null}
                      </div>

                      {/* Metadata Form */}
                      <div className="space-y-6">
                        {/* Caption */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>
                            Caption
                          </label>
                          <textarea
                            value={composer.highlight.caption || ""}
                            onChange={(e) => updateHighlight({ caption: e.target.value })}
                            placeholder="Describe your highlight..."
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

                        {/* Position */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>
                            Position
                          </label>
                          <select
                            value={composer.highlight.position || ""}
                            onChange={(e) => updateHighlight({ position: e.target.value })}
                            className="w-full px-4 py-3 text-sm outline-none transition-all"
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

                        {/* Action Type */}
                        <div>
                          <label className="block text-sm font-medium mb-3" style={{ color: colors.white }}>
                            Action Type
                          </label>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                            {actionTypeOptions.map(action => (
                              <button
                                key={action.value}
                                onClick={() => updateHighlight({ actionType: action.value as any })}
                                style={{
                                  padding: "16px 10px",
                                  border: "1px solid",
                                  backgroundColor: composer.highlight.actionType === action.value ? "rgba(124,58,237,0.2)" : colors.surface,
                                  borderColor: composer.highlight.actionType === action.value ? colors.accent : colors.input,
                                  color: colors.white,
                                  borderRadius: `${borderRadius.button}px`,
                                  cursor: "pointer",
                                  transition: "all 0.15s",
                                  display: "flex",
                                  flexDirection: "column",
                                  alignItems: "center",
                                  gap: 8,
                                  boxShadow: composer.highlight.actionType === action.value ? "0 0 0 1px rgba(124,58,237,0.5)" : "none",
                                }}
                              >
                                <div style={{ fontSize: 24 }}>{action.icon}</div>
                                <div style={{ fontSize: 13, fontWeight: 600, fontFamily: "Inter, sans-serif" }}>{action.label}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Optional Fields */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>
                              Opponent (Optional)
                            </label>
                            <input
                              type="text"
                              value={composer.highlight.opponent || ""}
                              onChange={(e) => updateHighlight({ opponent: e.target.value })}
                              placeholder="vs Team Name"
                              className="w-full px-4 py-3 text-sm outline-none transition-all"
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
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>
                              Minute (Optional)
                            </label>
                            <input
                              type="number"
                              value={composer.highlight.minute || ""}
                              onChange={(e) => updateHighlight({ minute: parseInt(e.target.value) || undefined })}
                              placeholder="45"
                              min="1"
                              max="120"
                              className="w-full px-4 py-3 text-sm outline-none transition-all"
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
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>
                              Competition (Optional)
                            </label>
                            <input
                              type="text"
                              value={composer.highlight.competition || ""}
                              onChange={(e) => updateHighlight({ competition: e.target.value })}
                              placeholder="League Name"
                              className="w-full px-4 py-3 text-sm outline-none transition-all"
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
                            <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>
                              Result (Optional)
                            </label>
                            <input
                              type="text"
                              value={composer.highlight.result || ""}
                              onChange={(e) => updateHighlight({ result: e.target.value })}
                              placeholder="2-1"
                              className="w-full px-4 py-3 text-sm outline-none transition-all"
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

                        {/* Visibility */}
                        <div>
                          <label className="block text-sm font-medium mb-2" style={{ color: colors.white }}>
                            Visibility
                          </label>
                          <select
                            value={composer.highlight.visibility || "public"}
                            onChange={(e) => updateHighlight({ visibility: e.target.value as "public" | "followers" })}
                            className="w-full px-4 py-3 text-sm outline-none transition-all"
                            style={{ 
                              ...styles.buttonBorder,
                              backgroundColor: colors.input, 
                              border: `1px solid ${colors.surface}`, 
                              color: colors.white,
                              fontFamily: typography.body
                            }}
                          >
                            <option value="public">Public</option>
                            <option value="followers">Followers Only</option>
                          </select>
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <button onClick={goBack} className="px-6 py-3 transition-all" style={{ backgroundColor: colors.surface, color: colors.white, border: `1px solid ${colors.input}`, borderRadius: `${borderRadius.button}px` }}>
                          Back
                        </button>
                        <button onClick={() => goToStep(4)} className="px-6 py-3 font-medium transition-all" style={{
                          fontFamily: typography.family,
                          fontWeight: typography.semibold,
                          backgroundColor: colors.electricViolet,
                          color: colors.white,
                          borderRadius: `${borderRadius.button}px`
                        }}>
                          Next: Publish
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Preview */}
                  {composer.step === 4 && (
                    <div>
                      <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "24px" }}>
                        PREVIEW
                      </h2>

                      {/* Video Preview */}
                      <div className="mb-6">
                        <HighlightVideoPreview
                          localPreviewUrl={composer.localPreviewUrl}
                          videoRef={videoRef}
                          spotlight={undefined}
                          currentTime={composer.highlight.currentTime || 0}
                          placingKeyframe={undefined}
                          showControls={true}
                          enableSpotlightPlacement={false}
                          onLoadedMetadata={() => {}}
                          onDurationChange={() => {}}
                          onTimeUpdate={() => {}}
                          onSeeked={() => {}}
                          onVideoAreaClick={() => {}}
                        />
                      </div>

                      {/* Review Card */}
                      <div style={{ backgroundColor: "#1A1A1A", borderRadius: `${borderRadius.sheet}px`, border: `1px solid #7C3AED` }} className="p-6 mb-6">
                        <h3 style={{ ...styles.displayHeader, fontSize: "18px", color: "#7C3AED", marginBottom: "16px" }}>
                          HIGHLIGHT SUMMARY
                        </h3>
                        
                        <div className="space-y-4">
                          {/* Trim Summary */}
                          <div className="flex justify-between items-center">
                            <span style={{ color: colors.muted, fontSize: "14px" }}>Trim</span>
                            <span style={{ color: colors.white, fontWeight: "medium" }}>
                              {composer.highlight.trimStart ? `${Math.floor(composer.highlight.trimStart / 60)}:${(Math.floor(composer.highlight.trimStart % 60)).toString().padStart(2, '0')}` : "0:00"} → {composer.highlight.trimEnd ? `${Math.floor(composer.highlight.trimEnd / 60)}:${(Math.floor(composer.highlight.trimEnd % 60)).toString().padStart(2, '0')}` : "0:00"}
                              {composer.highlight.trimStart && composer.highlight.trimEnd && ` (${Math.floor((composer.highlight.trimEnd - composer.highlight.trimStart))}s)`}
                            </span>
                          </div>

                          {/* Cover Frame */}
                          <div className="flex justify-between items-center">
                            <span style={{ color: colors.muted, fontSize: "14px" }}>Cover Frame</span>
                            <span style={{ color: colors.white, fontWeight: "medium" }}>
                              {composer.highlight.coverFrameTime ? `${Math.floor(composer.highlight.coverFrameTime / 60)}:${(Math.floor(composer.highlight.coverFrameTime % 60)).toString().padStart(2, '0')}` : "Default (first frame)"}
                            </span>
                          </div>

                          {/* Spotlight */}
                          <div className="flex justify-between items-center">
                            <span style={{ color: colors.muted, fontSize: "14px" }}>Spotlight</span>
                            <span style={{ color: colors.white, fontWeight: "medium" }}>
                              {composer.highlight.spotlight ? `${composer.highlight.spotlight.style} (${composer.highlight.spotlight.durationSeconds}s)` : "None"}
                            </span>
                          </div>

                          {/* Highlight Details */}
                          <div style={{ borderTop: `1px solid ${colors.surface}`, paddingTop: "16px" }}>
                            <h4 style={{ ...styles.displayHeader, fontSize: "16px", color: colors.white, marginBottom: "12px" }}>
                              Details
                            </h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                              <div className="flex justify-between items-center">
                                <span style={{ color: colors.muted, fontSize: "14px" }}>Clip Type</span>
                                <span style={{ color: colors.white, fontWeight: "medium" }}>
                                  {clipTypeOptions.find(t => t.value === composer.highlight.clipType)?.label}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span style={{ color: colors.muted, fontSize: "14px" }}>Action</span>
                                <span style={{ color: colors.white, fontWeight: "medium" }}>
                                  {actionTypeOptions.find(a => a.value === composer.highlight.actionType)?.label}
                                </span>
                              </div>
                              <div className="flex justify-between items-center">
                                <span style={{ color: colors.muted, fontSize: "14px" }}>Position</span>
                                <span style={{ color: colors.white, fontWeight: "medium" }}>
                                  {composer.highlight.position || "Not set"}
                                </span>
                              </div>
                              {composer.highlight.opponent && (
                                <div className="flex justify-between items-center">
                                  <span style={{ color: colors.muted, fontSize: "14px" }}>Opponent</span>
                                  <span style={{ color: colors.white, fontWeight: "medium" }}>vs {composer.highlight.opponent}</span>
                                </div>
                              )}
                              {composer.highlight.minute && (
                                <div className="flex justify-between items-center">
                                  <span style={{ color: colors.muted, fontSize: "14px" }}>Minute</span>
                                  <span style={{ color: colors.white, fontWeight: "medium" }}>{composer.highlight.minute}'</span>
                                </div>
                              )}
                              {composer.highlight.competition && (
                                <div className="flex justify-between items-center">
                                  <span style={{ color: colors.muted, fontSize: "14px" }}>Competition</span>
                                  <span style={{ color: colors.white, fontWeight: "medium" }}>{composer.highlight.competition}</span>
                                </div>
                              )}
                              {composer.highlight.result && (
                                <div className="flex justify-between items-center">
                                  <span style={{ color: colors.muted, fontSize: "14px" }}>Result</span>
                                  <span style={{ color: colors.white, fontWeight: "medium" }}>{composer.highlight.result}</span>
                                </div>
                              )}
                              <div className="flex justify-between items-center">
                                <span style={{ color: colors.muted, fontSize: "14px" }}>Visibility</span>
                                <span style={{ color: colors.white, fontWeight: "medium" }}>
                                  {composer.highlight.visibility === "public" ? "Public" : "Followers Only"}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Caption */}
                          {composer.highlight.caption && (
                            <div style={{ borderTop: `1px solid ${colors.surface}`, paddingTop: "16px" }}>
                              <h4 style={{ ...styles.displayHeader, fontSize: "16px", color: colors.white, marginBottom: "8px" }}>
                                Caption
                              </h4>
                              <p style={{ color: colors.white, fontFamily: typography.body, fontSize: "14px", lineHeight: 1.5 }}>
                                {composer.highlight.caption}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="flex justify-between">
                        <button onClick={goBack} className="px-6 py-3 transition-all" style={{ backgroundColor: colors.surface, color: colors.white, border: `1px solid ${colors.input}`, borderRadius: `${borderRadius.button}px` }}>
                          Back
                        </button>
                        <button onClick={publishPost} disabled={composer.isPublishing} className="px-6 py-3 font-medium transition-all disabled:opacity-50" style={{ 
                          fontFamily: typography.family,
                          fontWeight: typography.semibold,
                          backgroundColor: colors.electricViolet, 
                          color: colors.white, 
                          borderRadius: `${borderRadius.button}px`
                        }}>
                          {composer.isPublishing ? "Publishing..." : "Publish"}
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Step 5: Publish */}
                  {composer.step === 5 && (
                    <div>
                      <h2 style={{ ...styles.displayHeader, fontSize: "24px", color: colors.white, marginBottom: "24px" }}>
                        PUBLISH
                      </h2>

                      {/* Video Preview */}
                      <div className="mb-6">
                        <HighlightVideoPreview
                          localPreviewUrl={composer.localPreviewUrl}
                          videoRef={videoRef}
                          spotlight={composer.highlight.spotlight}
                          currentTime={composer.highlight.currentTime || 0}
                          placingKeyframe={undefined}
                          showControls={true}
                          enableSpotlightPlacement={false}
                          onLoadedMetadata={() => {}}
                          onDurationChange={() => {}}
                          onTimeUpdate={() => {}}
                          onSeeked={() => {}}
                          onVideoAreaClick={() => {}}
                        />
                      </div>

                      {composer.publishError && (
                        <div className="mb-6 p-4 rounded-xl" style={{ backgroundColor: `${colors.danger}20`, border: `1px solid ${colors.danger}40`, color: colors.danger }}>
                          {composer.publishError}
                        </div>
                      )}

                      <div className="flex justify-between">
                        <button onClick={goBack} disabled={composer.isPublishing} className="px-6 py-3 transition-all disabled:opacity-50" style={{ backgroundColor: colors.surface, color: colors.white, border: `1px solid ${colors.input}`, borderRadius: `${borderRadius.button}px` }}>
                          Back
                        </button>
                        <button onClick={publishPost} disabled={composer.isPublishing} className="px-6 py-3 font-medium transition-all disabled:opacity-50" style={{ backgroundColor: colors.accent, color: colors.white, borderRadius: `${borderRadius.button}px` }}>
                          {composer.isPublishing ? "Publishing..." : "Publish Highlight"}
                        </button>
                      </div>
                    </div>
                  )}
            </>
          )}
        </div>
      </motion.div>
    </AnimatePresence>

    {/* Edit Sheet Drawer */}
    {composer.showEditSheet && (
      <>
        {/* Backdrop */}
        <div
          className="fixed inset-0 z-40"
          style={{ backgroundColor: "rgba(0, 0, 0, 0.5)" }}
          onClick={() => setComposer(prev => ({ ...prev, showEditSheet: false }))}
        />
        
        {/* Sheet */}
        <div
          className="relative z-50"
          style={{ backgroundColor: colors.card, borderTopLeftRadius: `${borderRadius.sheet}px`, borderTopRightRadius: `${borderRadius.sheet}px` }}
        >
          <div className="p-6">
            {/* Handle */}
            <div className="w-12 h-1 mx-auto mb-6 rounded-full" style={{ backgroundColor: colors.surface }} />
            
            {/* Tabs */}
            <div className="flex space-x-1 mb-6" style={{ backgroundColor: colors.surface, borderRadius: `${borderRadius.button}px`, padding: "4px" }}>
              {(["trim", "cover", "spotlight"] as const).map(tab => (
                <button 
                  key={tab} 
                  onClick={() => updateEditTab(tab)} 
                  className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-all capitalize ${
                    composer.activeEditTab === tab ? "" : ""
                  }`}
                  style={{ 
                    ...styles.displayHeader,
                    backgroundColor: composer.activeEditTab === tab ? colors.accent : "transparent",
                    color: colors.white
                  }}
                >
                  {tab}
                </button>
              ))}
            </div>

            {/* Tab Content */}
            <div className="max-h-96 overflow-y-auto">
              {/* Trim Control */}
              {composer.activeEditTab === "trim" && (
                <TrimControl
                  duration={resolvedDuration}
                  trimStart={resolvedTrimStart}
                  trimEnd={resolvedTrimEnd}
                  onTrimStartChange={updateTrimStart}
                  onTrimEndChange={updateTrimEnd}
                  currentTime={composer.highlight.currentTime || 0}
                  onCurrentTimeChange={updateCurrentTime}
                />
              )}

              {/* Cover Frame */}
              {composer.activeEditTab === "cover" && (
                <div className="space-y-4">
                  <h3 style={{ ...styles.displayHeader, fontSize: "18px", color: colors.white }}>
                    Cover Frame
                  </h3>
                  <div className="space-y-4">
                    <div>
                      <label style={{ color: colors.muted, fontSize: "14px" }}>Current Position</label>
                      <div style={{ fontFamily: typography.body, color: colors.white, fontSize: "18px", fontWeight: "500" }}>
                        {Math.floor((composer.highlight.currentTime || 0) / 60)}:{(Math.floor((composer.highlight.currentTime || 0) % 60)).toString().padStart(2, '0')}
                      </div>
                    </div>
                    <button 
                      onClick={() => updateHighlight({ coverFrameTime: composer.highlight.currentTime || 0 })} 
                      className="w-full px-4 py-3 font-medium transition-all"
                      style={{ 
                        ...styles.displayHeader, 
                        backgroundColor: colors.accent, 
                        color: colors.white, 
                        borderRadius: `${borderRadius.button}px` 
                      }}
                    >
                      SET CURRENT FRAME AS COVER
                    </button>
                    {composer.highlight.coverFrameTime && composer.highlight.coverFrameTime > 0 && (
                      <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}20`, border: `1px solid ${colors.accent}40` }}>
                        <div style={{ color: colors.accent, fontSize: "14px" }}>
                          Cover frame set at {Math.floor(composer.highlight.coverFrameTime / 60)}:{(Math.floor(composer.highlight.coverFrameTime % 60)).toString().padStart(2, '0')}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Spotlight */}
              {composer.activeEditTab === "spotlight" && (
                <div className="space-y-4">
                  <h3 style={{ ...styles.displayHeader, fontSize: "18px", color: colors.white }}>
                    Spotlight Effect
                  </h3>
                  {composer.highlight.spotlight?.enabled && (
                    <div style={{
                      background: 'rgba(124,58,237,0.15)',
                      border: '1px solid rgba(124,58,237,0.3)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                      color: '#A78BFA',
                      fontSize: 13
                    }}>
                      ✨ Spotlight set at {composer.highlight.spotlight.startTime.toFixed(1)}s 
                      for {composer.highlight.spotlight.durationSeconds}s
                    </div>
                  )}
                  <div className="space-y-4">
                    {!composer.highlight.spotlight ? (
                      <div>
                        <p style={{ color: colors.muted, fontSize: "14px", marginBottom: "12px" }}>
                          Create an animated spotlight that follows the action
                        </p>
                        <div className="p-3 rounded-lg text-center" style={{ backgroundColor: colors.surface, color: colors.muted, fontSize: "14px" }}>
                          <div className="text-2xl mb-2">🎯</div>
                          Click "Place Start Point" to begin
                        </div>
                        <button
                          onClick={() => {
                            setSpotlightStartPoint(50, 50)
                            setComposer(prev => ({ ...prev, placingKeyframe: 'start', showEditSheet: false }))
                          }}
                          className="w-full mt-3 px-4 py-3 font-medium transition-all"
                          style={{ 
                            ...styles.displayHeader, 
                            backgroundColor: colors.accent, 
                            color: colors.white, 
                            borderRadius: `${borderRadius.button}px` 
                          }}
                        >
                          PLACE START POINT
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {/* Keyframe status */}
                        <div className="p-3 rounded-lg" style={{ backgroundColor: `${colors.accent}20`, border: `1px solid ${colors.accent}40` }}>
                          <div style={{ color: colors.accent, fontSize: "14px", marginBottom: "8px" }}>
                            Keyframes placed: {composer.highlight.spotlight.keyframes.length}/3
                          </div>
                          <div className="flex space-x-2">
                            {(["start", "mid", "end"] as const).map(kid => {
                              const has = composer.highlight.spotlight!.keyframes.find(kf => kf.id === kid);
                              return (
                                <div key={kid} className={`flex-1 text-center py-1 rounded text-xs`} style={{ 
                                  backgroundColor: has ? colors.accent : colors.surface, 
                                  color: colors.white 
                                }}>
                                  {kid.charAt(0).toUpperCase() + kid.slice(1)}
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        {/* Placement buttons */}
                        <div>
                          <label style={{ color: colors.muted, fontSize: "14px", marginBottom: "8px", display: "block" }}>
                            Place Keyframes — click a button, then click the video
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {(["start", "mid", "end"] as const).map(kid => (
                              <button
                                key={kid}
                                onClick={() => setComposer(prev => ({ ...prev, placingKeyframe: kid, showEditSheet: false }))}
                                className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                                  composer.placingKeyframe === kid ? "" : ""
                                }`}
                                style={{ 
                                  ...styles.displayHeader,
                                  backgroundColor: composer.placingKeyframe === kid ? colors.accent : colors.surface,
                                  color: colors.white,
                                  borderRadius: `${borderRadius.button}px`
                                }}
                              >
                                {kid.charAt(0).toUpperCase() + kid.slice(1)} Point
                              </button>
                            ))}
                          </div>
                          {composer.placingKeyframe && (
                            <p style={{ color: colors.accent, fontSize: "12px", marginTop: "8px", textAlign: "center" }}>
                              ↑ Click on the video above to place the <strong>{composer.placingKeyframe}</strong> point
                            </p>
                          )}
                        </div>

                        {/* Style */}
                        <div>
                          <label style={{ color: colors.muted, fontSize: "14px", marginBottom: "8px", display: "block" }}>
                            Visual Style
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {[{ id: "soft_white", label: "Soft White", desc: "Bright light" }, { id: "dark_focus", label: "Dark Focus", desc: "Dramatic" }, { id: "ring_glow", label: "Ring Glow", desc: "Modern" }].map(s => (
                              <button 
                                key={s.id} 
                                onClick={() => updateSpotlightStyle(s.id as SpotlightStyle)} 
                                className={`px-2 py-2 rounded-lg text-xs font-medium transition-all ${
                                  composer.highlight.spotlight?.style === s.id ? "" : ""
                                }`}
                                style={{ 
                                  backgroundColor: composer.highlight.spotlight?.style === s.id ? colors.accent : colors.surface,
                                  color: colors.white,
                                  borderRadius: `${borderRadius.button}px`
                                }}
                              >
                                <div className="font-medium">{s.label}</div>
                                <div className="text-xs opacity-75">{s.desc}</div>
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Duration */}
                        <div>
                          <label style={{ color: colors.muted, fontSize: "14px", marginBottom: "8px", display: "block" }}>
                            Duration
                          </label>
                          <div className="grid grid-cols-3 gap-2">
                            {([1, 2, 3] as const).map(d => (
                              <button 
                                key={d} 
                                onClick={() => updateSpotlightDuration(d)} 
                                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all ${
                                  composer.highlight.spotlight?.durationSeconds === d ? "" : ""
                                }`}
                                style={{ 
                                  ...styles.displayHeader,
                                  backgroundColor: composer.highlight.spotlight?.durationSeconds === d ? colors.accent : colors.surface,
                                  color: colors.white,
                                  borderRadius: `${borderRadius.button}px`
                                }}
                              >
                                {d}s
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Label */}
                        <div>
                          <label style={{ color: colors.muted, fontSize: "14px" }}>Label (optional)</label>
                          <input 
                            type="text" 
                            value={composer.highlight.spotlight.label || ""} 
                            onChange={(e) => updateSpotlightLabel(e.target.value)} 
                            placeholder="e.g. Great pass, Goal, etc." 
                            className="w-full px-3 py-2 transition-all"
                            style={{ 
                              backgroundColor: colors.input, 
                              border: `1px solid ${colors.surface}`, 
                              color: colors.white, 
                              borderRadius: `${borderRadius.button}px`,
                              fontFamily: typography.body
                            }} 
                          />
                        </div>

                        <button 
                          onClick={() => updateHighlight({ spotlight: undefined })} 
                          className="w-full px-4 py-2 font-medium transition-all"
                          style={{ 
                            ...styles.displayHeader,
                            backgroundColor: `${colors.danger}20`, 
                            border: `1px solid ${colors.danger}40`,
                            color: colors.danger, 
                            borderRadius: `${borderRadius.button}px` 
                          }}
                        >
                          CLEAR SPOTLIGHT
                        </button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </>
    )}
    </div>
  </div>
);
}
