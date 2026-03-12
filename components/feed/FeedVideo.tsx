import React, { useRef, useState, useEffect } from 'react';
import MuxPlayer from '@mux/mux-player-react'
import { useSimpleVideoUrl, isYouTubeUrl, getYouTubeEmbedUrl, isDirectVideoUrl } from '../../hooks/useSimpleVideoUrl';
import type { SpotlightStyle, SpotlightKeyframe } from '../../lib/feed/types';
import { colors, typography, borderRadius, glassPanel } from '../../lib/design/tokens';

interface FeedVideoProps {
  mediaUrl?: string;
  mediaBucket?: string;
  mediaPath?: string;
  muxPlaybackId?: string;
  trimStart?: number | null;
  trimEnd?: number | null;
  coverFrameTime?: number | null;
  spotlightTime?: number | null;
  spotlightLabel?: string | null;
  spotlightX?: number | null;
  spotlightY?: number | null;
  spotlightDuration?: number | null;
  spotlightStyle?: SpotlightStyle | null;
  spotlightKeyframes?: SpotlightKeyframe[] | null;
  autoplay?: boolean;
}

export const FeedVideo: React.FC<FeedVideoProps> = ({
  mediaUrl,
  mediaBucket,
  mediaPath,
  muxPlaybackId,
  trimStart,
  trimEnd,
  coverFrameTime,
  spotlightTime,
  spotlightLabel,
  spotlightX,
  spotlightY,
  spotlightDuration,
  spotlightStyle,
  spotlightKeyframes,
  autoplay = false,
}) => {
  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const { videoUrl, isLoading, error } = useSimpleVideoUrl({
    bucket: mediaBucket,
    path: mediaPath,
    mediaUrl,
    enabled: !!(mediaUrl || (mediaBucket && mediaPath)),
  });

  const videoRef = useRef<HTMLVideoElement>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [showSpotlight, setShowSpotlight] = useState(false);

  const isYouTube = mediaUrl && isYouTubeUrl(mediaUrl);
  const hasNativeVideo = videoUrl || (mediaUrl && isDirectVideoUrl(mediaUrl));
  const videoSrc = videoUrl || (mediaUrl && isDirectVideoUrl(mediaUrl) ? mediaUrl : undefined);
  const isExternalVideo = isYouTube || (mediaUrl && !isDirectVideoUrl(mediaUrl));

  // Interpolate spotlight position between keyframes
  const interpolateSpotlightPosition = (
    keyframes: SpotlightKeyframe[],
    ct: number,
    startTime: number,
    duration: number,
  ) => {
    if (!keyframes.length) return { x: 50, y: 50 };
    const elapsed = ct - startTime;
    const progress = Math.max(0, Math.min(1, elapsed / duration));

    let from = keyframes[0];
    let to = keyframes[0];
    for (let i = 0; i < keyframes.length - 1; i++) {
      if (progress >= keyframes[i].progress && progress <= keyframes[i + 1].progress) {
        from = keyframes[i];
        to = keyframes[i + 1];
        break;
      }
    }
    if (progress <= from.progress) return { x: from.x, y: from.y };
    if (progress >= to.progress) return { x: to.x, y: to.y };
    const t = (progress - from.progress) / (to.progress - from.progress);
    return { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
  };

  // Trim loop + initial seek
  useEffect(() => {
    const video = videoRef.current;
    if (!video || trimStart == null || trimEnd == null || trimEnd <= trimStart) return;

    const handleTimeUpdate = () => {
      if (video.currentTime >= trimEnd) video.currentTime = trimStart;
    };

    const handleLoadedMetadata = () => {
      const initial = coverFrameTime || trimStart || 0;
      video.currentTime = initial;
    };

    const handleSeeked = () => {
      if (video.currentTime < trimStart) video.currentTime = trimStart;
      else if (video.currentTime > trimEnd) video.currentTime = trimEnd;
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('seeked', handleSeeked);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('seeked', handleSeeked);
    };
  }, [trimStart, trimEnd, coverFrameTime]);

  // Cover frame poster generation
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !coverFrameTime || isExternalVideo) return;

    let posterGenerated = false;

    const handleCanPlay = () => {
      const shouldSeek = !trimStart || Math.abs(video.currentTime - coverFrameTime) > 0.5;
      if (shouldSeek) {
        video.currentTime = coverFrameTime;
        setTimeout(() => { if (!video.paused && !posterGenerated) video.pause(); }, 100);
      }
    };

    const handleSeeked = () => {
      if (Math.abs(video.currentTime - coverFrameTime) < 0.1 && !posterGenerated) {
        try {
          const isSameOrigin = video.src.startsWith('blob:') || !video.src.startsWith('http') || video.src.includes(window.location.hostname);
          if (isSameOrigin) {
            const canvas = document.createElement('canvas');
            canvas.width = video.videoWidth || 640;
            canvas.height = video.videoHeight || 360;
            const ctx = canvas.getContext('2d');
            if (ctx) {
              try {
                ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
                video.poster = canvas.toDataURL('image/jpeg', 0.8);
                posterGenerated = true;
              } catch { /* CORS - continue without poster */ }
            }
          }
        } catch { /* continue without poster */ }
      }
    };

    const handlePlay = () => {
      if (trimStart && Math.abs(video.currentTime - trimStart) > 0.1) {
        video.currentTime = trimStart;
      }
    };

    video.addEventListener('canplay', handleCanPlay);
    video.addEventListener('seeked', handleSeeked);
    video.addEventListener('play', handlePlay);
    return () => {
      video.removeEventListener('canplay', handleCanPlay);
      video.removeEventListener('seeked', handleSeeked);
      video.removeEventListener('play', handlePlay);
    };
  }, [coverFrameTime, trimStart, isExternalVideo]);

  // Spotlight visibility — driven by currentTime state
  useEffect(() => {
    const hasAdvanced = spotlightTime && spotlightDuration && spotlightKeyframes && spotlightKeyframes.length > 0;
    const hasLegacy = spotlightTime && spotlightDuration && spotlightX != null && spotlightY != null;
    if (!hasAdvanced && !hasLegacy) { setShowSpotlight(false); return; }

    const start = spotlightTime || 0;
    const end = start + (spotlightDuration || 2);
    setShowSpotlight(currentTime >= start && currentTime <= end);
  }, [currentTime, spotlightTime, spotlightDuration, spotlightKeyframes, spotlightX, spotlightY]);

  // Autoplay logic
  useEffect(() => {
    const video = videoRef.current;
    if (!video || !hasNativeVideo) return;

    if (autoplay) {
      // Autoplay muted when in view
      video.muted = true;
      video.play().catch(() => {
        // Autoplay failed, user interaction required
      });
    } else {
      // Pause when out of view
      video.pause();
    }
  }, [autoplay, hasNativeVideo]);

  if (isLoading) {
    return (
      <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: colors.deepNavy }}>
        <div style={{ color: colors.muted, fontFamily: typography.family }}>Loading video...</div>
      </div>
    );
  }

  // Mux Video
  if (muxPlaybackId) {
    return (
      <div className="relative w-full h-full">
        <MuxPlayer
          playbackId={muxPlaybackId}
          style={{ width: '100%', height: '100%' }}
          autoPlay={false}
          muted={autoplay}
        />
        {coverFrameTime && coverFrameTime > 0 && (
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs"
            style={{ 
              ...glassPanel,
              color: colors.electricViolet,
              fontFamily: typography.family,
              fontWeight: typography.medium
            }}
          >
            🎯 Cover at {formatTime(coverFrameTime)}
          </div>
        )}
      </div>
    );
  }

  // YouTube
  if (isYouTube && mediaUrl) {
    const embedUrl = getYouTubeEmbedUrl(mediaUrl);
    if (!embedUrl) {
      return (
        <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: colors.deepNavy }}>
          <div className="text-center max-w-md" style={{ color: colors.danger, fontFamily: typography.family }}>
            <div className="font-medium mb-2" style={{ fontSize: typography.card }}>Invalid YouTube URL</div>
            <div className="text-xs font-mono" style={{ color: colors.muted }}>{mediaUrl}</div>
          </div>
        </div>
      );
    }
    return (
      <div className="relative w-full h-full">
        <iframe 
          src={embedUrl} 
          className="w-full h-full" 
          style={{ borderRadius: '0px' }} 
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
          allowFullScreen 
          title="YouTube video player" 
        />
        {coverFrameTime && coverFrameTime > 0 && (
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs"
            style={{ 
              ...glassPanel,
              color: colors.electricViolet,
              fontFamily: typography.family,
              fontWeight: typography.medium
            }}
          >
            🎯 Cover at {formatTime(coverFrameTime)}
          </div>
        )}
      </div>
    );
  }

  // Native video
  if (hasNativeVideo && videoSrc) {
    return (
      <div className="relative w-full h-full">
        <video
          ref={videoRef}
          src={videoSrc}
          className="w-full h-full object-cover"
          style={{ borderRadius: '0px' }}
          controls={false}
          muted
          loop
          playsInline
          onTimeUpdate={(e) => setCurrentTime(e.currentTarget.currentTime)}
          onError={(e) => {
            const me = e.currentTarget.error;
            console.error('[FeedVideo] Playback failure', { videoSrc, code: me?.code, networkState: e.currentTarget.networkState });
          }}
          onLoadedMetadata={() => {
            console.log('[FeedVideo] Loaded', { duration: videoRef.current?.duration, trimStart, trimEnd });
          }}
        />

        {/* Spotlight overlay */}
        {showSpotlight && spotlightTime && spotlightDuration && (
          <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
            {(() => {
              if (spotlightKeyframes && spotlightKeyframes.length > 0 && spotlightStyle) {
                const pos = interpolateSpotlightPosition(spotlightKeyframes, currentTime, spotlightTime, spotlightDuration);

                if (spotlightStyle === 'soft_white') return (
                  <>
                    <div className="absolute w-32 h-32 rounded-full opacity-30" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(255,255,255,0.8) 0%, rgba(255,255,255,0.4) 30%, transparent 70%)', filter: 'blur(8px)' }} />
                    <div className="absolute w-20 h-20 rounded-full" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(255,255,255,0.6) 0%, rgba(255,255,255,0.2) 40%, transparent 80%)' }} />
                    <div className="absolute inset-0" style={{ background: 'radial-gradient(circle at 50% 50%, transparent 30%, rgba(0,0,0,0.3) 100%)' }} />
                  </>
                );

                if (spotlightStyle === 'dark_focus') return (
                  <>
                    <div className="absolute inset-0" style={{ background: `radial-gradient(circle at ${pos.x}% ${pos.y}%, transparent 15%, rgba(0,0,0,0.7) 50%)` }} />
                    <div className="absolute w-24 h-24 rounded-full border-2 border-white/30" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', boxShadow: '0 0 20px rgba(255,255,255,0.2)' }} />
                  </>
                );

                if (spotlightStyle === 'ring_glow') return (
                  <>
                    <div className="absolute w-16 h-16 rounded-full" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', border: '3px solid rgba(124, 58, 237, 0.8)', boxShadow: '0 0 30px rgba(124, 58, 237, 0.6), inset 0 0 20px rgba(124, 58, 237, 0.3)' }} />
                    <div className="absolute w-24 h-24 rounded-full" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', border: '1px solid rgba(124, 58, 237, 0.4)', boxShadow: '0 0 40px rgba(124, 58, 237, 0.3)' }} />
                    <div className="absolute w-20 h-20 rounded-full animate-pulse" style={{ left: `${pos.x}%`, top: `${pos.y}%`, transform: 'translate(-50%, -50%)', background: 'radial-gradient(circle, rgba(124, 58, 237, 0.2) 0%, transparent 70%)' }} />
                  </>
                );
              }

              // Legacy fallback
              if (spotlightX != null && spotlightY != null) {
                return (
                  <div className="absolute w-10 h-10 border-2 rounded-full flex items-center justify-center" style={{ 
                    left: `${spotlightX}%`, 
                    top: `${spotlightY}%`, 
                    transform: 'translate(-50%, -50%)',
                    borderColor: colors.electricViolet,
                    backgroundColor: `${colors.electricViolet}20`
                  }}>
                    <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: colors.electricViolet }} />
                  </div>
                );
              }

              return null;
            })()}

            {/* Label */}
            {spotlightLabel && (() => {
              let lx = spotlightX || 50;
              let ly = (spotlightY || 50) + 8;
              if (spotlightKeyframes && spotlightKeyframes.length > 0) {
                const pos = interpolateSpotlightPosition(spotlightKeyframes, currentTime, spotlightTime, spotlightDuration);
                lx = pos.x;
                ly = pos.y + 8;
              }
              return (
                <div 
                  className="absolute text-xs px-2 py-1 rounded-full"
                  style={{ 
                    left: `${lx}%`, 
                    top: `${ly}%`, 
                    transform: 'translateX(-50%)', 
                    ...glassPanel,
                    color: colors.white,
                    fontFamily: typography.family,
                    fontWeight: typography.medium,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.3)'
                  }}
                >
                  {spotlightLabel}
                </div>
              );
            })()}
          </div>
        )}

        {coverFrameTime && coverFrameTime > 0 && (
          <div 
            className="absolute top-2 right-2 px-2 py-1 rounded-full text-xs"
            style={{ 
              ...glassPanel,
              color: colors.electricViolet,
              fontFamily: typography.family,
              fontWeight: typography.medium
            }}
          >
            🎯 Cover at {formatTime(coverFrameTime)}
          </div>
        )}
      </div>
    );
  }

  // Fallback
  return (
    <div className="aspect-video flex items-center justify-center" style={{ backgroundColor: colors.deepNavy }}>
      <div className="text-center max-w-md" style={{ color: colors.muted, fontFamily: typography.family }}>
        <div className="font-medium mb-2" style={{ fontSize: typography.card }}>Video source not available</div>
        <div className="text-xs space-y-1 font-mono text-left">
          <div>mediaUrl: {mediaUrl ? 'present' : 'missing'}</div>
          <div>mediaBucket: {mediaBucket || 'missing'}</div>
          <div>mediaPath: {mediaPath || 'missing'}</div>
          <div>videoSrc: {videoSrc ? 'present' : 'missing'}</div>
          <div>hookError: {error || 'none'}</div>
        </div>
      </div>
    </div>
  );
};
