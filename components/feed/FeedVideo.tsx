import React from 'react';
import { useSimpleVideoUrl } from '../../hooks/useSimpleVideoUrl';

interface FeedVideoProps {
  mediaUrl?: string;
  mediaBucket?: string;
  mediaPath?: string;
}

export const FeedVideo: React.FC<FeedVideoProps> = ({
  mediaUrl,
  mediaBucket,
  mediaPath
}) => {
  const { videoUrl, isLoading, error } = useSimpleVideoUrl({
    bucket: mediaBucket,
    path: mediaPath,
    mediaUrl,
    enabled: !!(mediaUrl || (mediaBucket && mediaPath))
  });

  const videoSrc = videoUrl || mediaUrl;

  if (isLoading) {
    return (
      <div className="aspect-video bg-slate-900 flex items-center justify-center">
        <div className="text-slate-400">Loading video...</div>
      </div>
    );
  }

  if (error || !videoSrc) {
    return (
      <div className="aspect-video bg-slate-900 flex items-center justify-center">
        <div className="text-red-400 text-center">
          <div>Failed to load video</div>
          <div className="text-xs mt-2">{error}</div>
        </div>
      </div>
    );
  }

  return (
    <video
      src={videoSrc}
      className="w-full h-full object-cover"
      controls
      muted
      loop
      playsInline
      onError={(e) => {
        console.error('Feed video error:', {
          src: videoSrc,
          error: e.currentTarget.error
        });
      }}
      onLoadedMetadata={() => {
        console.log('Feed video loaded successfully:', videoSrc);
      }}
    />
  );
};
