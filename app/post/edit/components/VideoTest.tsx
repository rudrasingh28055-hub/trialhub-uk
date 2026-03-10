import React, { useRef, useEffect, useState } from 'react';

interface VideoTestProps {
  mediaUrl: string;
}

export const VideoTest: React.FC<VideoTestProps> = ({ mediaUrl }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [status, setStatus] = useState('Loading...');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    console.log('VideoTest - Setting src:', mediaUrl);
    video.src = mediaUrl;

    const events = [
      'loadstart', 'loadedmetadata', 'loadeddata', 'canplay', 'canplaythrough',
      'play', 'pause', 'ended', 'error', 'stalled', 'suspend'
    ];

    const handleEvent = (e: Event) => {
      console.log('VideoTest - Event:', e.type, {
        readyState: video.readyState,
        networkState: video.networkState,
        currentTime: video.currentTime,
        duration: video.duration
      });
      
      if (e.type === 'error') {
        const err = video.error;
        if (err) {
          let errorMsg = 'Unknown error';
          switch (err.code) {
            case err.MEDIA_ERR_ABORTED:
              errorMsg = 'Video load aborted';
              break;
            case err.MEDIA_ERR_NETWORK:
              errorMsg = 'Network error';
              break;
            case err.MEDIA_ERR_DECODE:
              errorMsg = 'Decode error (unsupported format)';
              break;
            case err.MEDIA_ERR_SRC_NOT_SUPPORTED:
              errorMsg = 'Source not supported';
              break;
          }
          setError(errorMsg);
          setStatus('Error');
        }
      }
      
      if (e.type === 'loadedmetadata') {
        setStatus('Metadata loaded');
      }
      
      if (e.type === 'canplay') {
        setStatus('Can play');
      }
      
      if (e.type === 'canplaythrough') {
        setStatus('Can play through');
      }
    };

    events.forEach(event => {
      video.addEventListener(event, handleEvent);
    });

    return () => {
      events.forEach(event => {
        video.removeEventListener(event, handleEvent);
      });
    };
  }, [mediaUrl]);

  const playVideo = () => {
    if (videoRef.current) {
      videoRef.current.play().catch(e => {
        console.error('Play failed:', e);
        setError('Play failed: ' + e.message);
      });
    }
  };

  const pauseVideo = () => {
    if (videoRef.current) {
      videoRef.current.pause();
    }
  };

  return (
    <div className="p-4 bg-slate-900 rounded-lg">
      <div className="mb-4">
        <h3 className="text-white font-bold mb-2">Minimal Video Test</h3>
        <p className="text-slate-400 text-sm mb-2">URL: {mediaUrl}</p>
        <p className="text-slate-400 text-sm mb-2">Status: {status}</p>
        {error && <p className="text-red-400 text-sm mb-2">Error: {error}</p>}
      </div>
      
      <div className="mb-4">
        <video
          ref={videoRef}
          className="w-full max-w-md bg-black rounded"
          controls
          playsInline
        />
      </div>
      
      <div className="flex gap-2">
        <button
          onClick={playVideo}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Play
        </button>
        <button
          onClick={pauseVideo}
          className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
        >
          Pause
        </button>
      </div>
    </div>
  );
};
