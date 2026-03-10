import React, { useEffect, useMemo, useRef, useState } from "react";
import { VideoEditorProps } from "../types/video";

export const SimpleVideoEditor: React.FC<VideoEditorProps> = ({
  mediaUrl,
  mediaBucket,
  mediaPath,
  onClose,
  onSave,
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  const [isLoading, setIsLoading] = useState(true);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [hasVideoError, setHasVideoError] = useState(false);
  const [videoErrorMessage, setVideoErrorMessage] = useState<string | null>(null);
  const [reloadKey, setReloadKey] = useState(0);

  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [trimStartTime, setTrimStartTime] = useState(0);
  const [trimEndTime, setTrimEndTime] = useState(0);

  const isValidMediaUrl =
    !!mediaUrl && (mediaUrl.startsWith("blob:") || mediaUrl.startsWith("http"));

  const videoSrc = useMemo(() => {
    if (!isValidMediaUrl) return "";
    return mediaUrl;
  }, [isValidMediaUrl, mediaUrl]);

  useEffect(() => {
    const video = videoRef.current;

    setIsLoading(true);
    setIsVideoReady(false);
    setHasVideoError(false);
    setVideoErrorMessage(null);
    setDuration(0);
    setCurrentTime(0);
    setTrimStartTime(0);
    setTrimEndTime(0);
    setIsPlaying(false);

    if (!video || !videoSrc) {
      setIsLoading(false);
      if (!videoSrc) {
        setHasVideoError(true);
        setVideoErrorMessage("No valid video source provided.");
      }
      return;
    }

    const logMediaState = (label: string) => {
      const mediaError = video.error;
      console.error(
        label,
        "mediaUrl:",
        mediaUrl,
        "currentSrc:",
        video.currentSrc,
        "mediaErrorCode:",
        mediaError?.code ?? "none",
        "networkState:",
        video.networkState,
        "readyState:",
        video.readyState,
        "duration:",
        video.duration,
        "isBlob:",
        mediaUrl?.startsWith("blob:")
      );
    };

    const handleLoadedMetadata = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;

      if (nextDuration > 0) {
        setDuration(nextDuration);
        setTrimEndTime(nextDuration);
      }
    };

    const handleCanPlay = () => {
      const nextDuration = Number.isFinite(video.duration) ? video.duration : 0;

      setDuration(nextDuration > 0 ? nextDuration : 0);
      if (nextDuration > 0 && trimEndTime === 0) {
        setTrimEndTime(nextDuration);
      }

      setIsLoading(false);
      setIsVideoReady(true);
      setHasVideoError(false);
      setVideoErrorMessage(null);
    };

    const handleLoadedData = () => {
      setIsLoading(false);
    };

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime || 0);
    };

    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);
    const handleEnded = () => setIsPlaying(false);

    const handleError = () => {
      const mediaError = video.error;

      let message = "Video failed to load.";
      switch (mediaError?.code) {
        case MediaError.MEDIA_ERR_ABORTED:
          message = "Video loading was aborted.";
          break;
        case MediaError.MEDIA_ERR_NETWORK:
          message = "A network error occurred while loading the video.";
          break;
        case MediaError.MEDIA_ERR_DECODE:
          message = "The video could not be decoded. It may use an unsupported codec.";
          break;
        case MediaError.MEDIA_ERR_SRC_NOT_SUPPORTED:
          message = "This video format or source is not supported by the browser.";
          break;
      }

      logMediaState("[SimpleVideoEditor] Video load failure");
      setHasVideoError(true);
      setVideoErrorMessage(message);
      setIsLoading(false);
      setIsVideoReady(false);
      setIsPlaying(false);
    };

    const handleStalled = () => {
      console.warn("[SimpleVideoEditor] Video stalled", "src:", video.currentSrc);
    };

    video.addEventListener("loadedmetadata", handleLoadedMetadata);
    video.addEventListener("loadeddata", handleLoadedData);
    video.addEventListener("canplay", handleCanPlay);
    video.addEventListener("timeupdate", handleTimeUpdate);
    video.addEventListener("play", handlePlay);
    video.addEventListener("pause", handlePause);
    video.addEventListener("ended", handleEnded);
    video.addEventListener("error", handleError);
    video.addEventListener("stalled", handleStalled);

    // Let React apply src first, then ask the browser to load it.
    requestAnimationFrame(() => {
      if (videoRef.current) {
        videoRef.current.load();
      }
    });

    const timeout = window.setTimeout(() => {
      if (!videoRef.current) return;
      if (!isVideoReady && !hasVideoError) {
        logMediaState("[SimpleVideoEditor] Video still not ready after timeout");
      }
    }, 8000);

    return () => {
      video.removeEventListener("loadedmetadata", handleLoadedMetadata);
      video.removeEventListener("loadeddata", handleLoadedData);
      video.removeEventListener("canplay", handleCanPlay);
      video.removeEventListener("timeupdate", handleTimeUpdate);
      video.removeEventListener("play", handlePlay);
      video.removeEventListener("pause", handlePause);
      video.removeEventListener("ended", handleEnded);
      video.removeEventListener("error", handleError);
      video.removeEventListener("stalled", handleStalled);
      window.clearTimeout(timeout);
    };
  }, [videoSrc, mediaUrl, reloadKey]);

  const handlePlayPause = async () => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;

    try {
      if (video.paused) {
        await video.play();
      } else {
        video.pause();
      }
    } catch (err) {
      console.error("[SimpleVideoEditor] Play error", err);
    }
  };

  const handleSeek = (value: number) => {
    const video = videoRef.current;
    if (!video || !isVideoReady) return;
    video.currentTime = value;
    setCurrentTime(value);
  };

  const handleTrimStartChange = (value: number) => {
    if (!isVideoReady) return;
    setTrimStartTime(value);
    if (value >= trimEndTime) {
      setTrimEndTime(Math.min(duration, value + 1));
    }
  };

  const handleTrimEndChange = (value: number) => {
    if (!isVideoReady) return;
    setTrimEndTime(value);
    if (value <= trimStartTime) {
      setTrimStartTime(Math.max(0, value - 1));
    }
  };

  const resetFilters = () => {
    setBrightness(100);
    setContrast(100);
    setSaturation(100);
  };

  const handleRetry = () => {
    setHasVideoError(false);
    setVideoErrorMessage(null);
    setIsLoading(true);
    setIsVideoReady(false);
    setReloadKey((prev) => prev + 1);
  };

  const handleSave = () => {
    console.log("[SimpleVideoEditor] Saving video", {
      mediaUrl,
      mediaBucket,
      mediaPath,
      trimStartTime,
      trimEndTime,
      brightness,
      contrast,
      saturation,
    });
    onSave();
  };

  const formatTime = (seconds: number) => {
    const safe = Number.isFinite(seconds) ? seconds : 0;
    const mins = Math.floor(safe / 60);
    const secs = Math.floor(safe % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const videoStyle = {
    filter: `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`,
  };

  if (!isValidMediaUrl) {
    return (
      <div className="flex h-full w-full items-center justify-center rounded-lg bg-slate-900">
        <div className="text-center">
          <div className="mb-2 text-slate-400">No valid video source available</div>
          <div className="text-xs text-slate-500">Please upload a video first</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full w-full flex-col overflow-hidden rounded-lg bg-slate-900">
      <div className="relative flex-1 bg-black">
        <video
          key={reloadKey}
          ref={videoRef}
          src={videoSrc}
          style={videoStyle}
          className="h-full w-full object-contain"
          playsInline
          muted
          preload="metadata"
          controls={false}
        />

        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50">
            <div className="text-white">Loading video...</div>
          </div>
        )}

        {hasVideoError && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/60">
            <div className="max-w-md p-4 text-center text-red-400">
              <div className="mb-2 text-lg font-semibold">Video Error</div>
              <div className="mb-3 text-sm">{videoErrorMessage || "Unknown video error"}</div>
              <div className="mb-4 text-xs text-slate-400">
                Source type: {mediaUrl.startsWith("blob:") ? "Blob URL" : "Remote URL"}
              </div>

              <div className="flex justify-center gap-2">
                <button
                  onClick={handleRetry}
                  className="rounded bg-red-600 px-4 py-2 text-sm text-white"
                >
                  Retry
                </button>
                <button
                  onClick={onClose}
                  className="rounded bg-slate-600 px-4 py-2 text-sm text-white"
                >
                  Go Back
                </button>
              </div>
            </div>
          </div>
        )}

        {!isLoading && !hasVideoError && isVideoReady && (
          <button
            onClick={handlePlayPause}
            className="absolute bottom-4 left-4 rounded-lg bg-black/50 px-4 py-2 text-white hover:bg-black/70"
          >
            {isPlaying ? "Pause" : "Play"}
          </button>
        )}
      </div>

      <div className="max-h-96 space-y-4 overflow-y-auto bg-slate-800 p-4">
        <div className="space-y-2">
          <div className="flex items-center gap-4">
            <span className="w-12 text-sm text-white">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={Math.min(currentTime, duration || 0)}
              onChange={(e) => handleSeek(Number(e.target.value))}
              className="flex-1"
              step="0.1"
              disabled={!isVideoReady}
            />
            <span className="w-12 text-sm text-white">{formatTime(duration)}</span>
          </div>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-white">Filters</div>

          <div className="flex items-center gap-4">
            <label className="w-20 text-sm text-white">Brightness</label>
            <input
              type="range"
              min="0"
              max="200"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-12 text-sm text-white">{brightness}%</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-20 text-sm text-white">Contrast</label>
            <input
              type="range"
              min="0"
              max="200"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-12 text-sm text-white">{contrast}%</span>
          </div>

          <div className="flex items-center gap-4">
            <label className="w-20 text-sm text-white">Saturation</label>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="flex-1"
            />
            <span className="w-12 text-sm text-white">{saturation}%</span>
          </div>

          <button
            onClick={resetFilters}
            className="rounded bg-slate-700 px-4 py-2 text-sm text-white hover:bg-slate-600"
          >
            Reset Filters
          </button>
        </div>

        <div className="space-y-3">
          <div className="text-sm font-medium text-white">Trim Video</div>

          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <label className="w-16 text-sm text-white">Start</label>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={trimStartTime}
                onChange={(e) => handleTrimStartChange(Number(e.target.value))}
                className="flex-1"
                step="0.1"
                disabled={!isVideoReady}
              />
              <span className="w-16 text-sm text-white">{formatTime(trimStartTime)}</span>
            </div>

            <div className="flex items-center gap-4">
              <label className="w-16 text-sm text-white">End</label>
              <input
                type="range"
                min="0"
                max={duration || 0}
                value={trimEndTime}
                onChange={(e) => handleTrimEndChange(Number(e.target.value))}
                className="flex-1"
                step="0.1"
                disabled={!isVideoReady}
              />
              <span className="w-16 text-sm text-white">{formatTime(trimEndTime)}</span>
            </div>

            <div className="text-xs text-slate-400">
              Duration: {formatTime(Math.max(0, trimEndTime - trimStartTime))}
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            onClick={handleSave}
            className="rounded bg-blue-600 px-6 py-2 text-white hover:bg-blue-700"
          >
            Save
          </button>
          <button
            onClick={onClose}
            className="rounded bg-slate-700 px-6 py-2 text-white hover:bg-slate-600"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};
