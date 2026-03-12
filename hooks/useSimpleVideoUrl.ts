import { useState, useEffect } from 'react';
import { parseSupabaseStorageUrl } from '../lib/media/parseSupabaseStorageUrl';

// YouTube URL detection and conversion helpers
export const isYouTubeUrl = (url?: string | null): boolean => {
  if (!url) return false;
  return url.includes('youtube.com/watch?v=') || url.includes('youtu.be/');
};

export const getYouTubeEmbedUrl = (url: string): string => {
  // Extract video ID from YouTube URL
  let videoId = '';
  
  if (url.includes('youtube.com/watch?v=')) {
    const match = url.match(/[?&]v=([^&]+)/);
    videoId = match ? match[1] : '';
  } else if (url.includes('youtu.be/')) {
    videoId = url.split('youtu.be/')[1]?.split('?')[0] || '';
  }
  
  return videoId ? `https://www.youtube.com/embed/${videoId}` : '';
};

export const isDirectVideoUrl = (url?: string | null): boolean => {
  if (!url) return false;
  // Check for common video file extensions or Supabase storage URLs
  return url.includes('.mp4') || 
         url.includes('.webm') || 
         url.includes('.mov') || 
         url.includes('/storage/v1/object/');
};

interface UseSimpleVideoUrlOptions {
  mediaUrl?: string;
  bucket?: string;
  path?: string;
  enabled?: boolean;
}

export function useSimpleVideoUrl({
  mediaUrl,
  bucket,
  path,
  enabled = true
}: UseSimpleVideoUrlOptions) {
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [retryTrigger, setRetryTrigger] = useState(0);

  useEffect(() => {
    // For videos, we should have bucket/path even if mediaUrl is null
    if (!enabled || (!mediaUrl && !(bucket && path))) {
      console.log('[useSimpleVideoUrl] Disabled or insufficient data', { mediaUrl, bucket, path, enabled });
      setVideoUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    // Skip URL resolution for YouTube URLs - they'll be handled by the component
    if (mediaUrl && isYouTubeUrl(mediaUrl)) {
      console.log('[useSimpleVideoUrl] YouTube URL detected, skipping resolution', { mediaUrl });
      setVideoUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const processUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For blob URLs, use directly
        if (mediaUrl && mediaUrl.startsWith('blob:')) {
          console.log('[useSimpleVideoUrl] Using blob URL directly');
          setVideoUrl(mediaUrl);
          setIsLoading(false);
          return;
        }

        // For non-Supabase URLs, use directly
        if (mediaUrl && !mediaUrl.includes('/storage/v1/object/')) {
          console.log('[useSimpleVideoUrl] Using non-Supabase URL directly');
          setVideoUrl(mediaUrl);
          setIsLoading(false);
          return;
        }

        // For Supabase bucket/path (videos with null mediaUrl), get signed URL
        if (bucket && path) {
          console.log('[useSimpleVideoUrl] Getting signed URL for bucket/path', { bucket, path });
          try {
            const response = await fetch('/api/media/signed', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ bucket, path, expiresIn: 600 })
            });

            if (response.ok) {
              const result = await response.json();
              console.log('[useSimpleVideoUrl] Got fresh signed URL');
              setVideoUrl(result.signedUrl);
              return;
            } else {
              console.log('[useSimpleVideoUrl] Signed URL failed:', response.status, response.statusText);
              const errorText = await response.text();
              console.log('[useSimpleVideoUrl] Error response:', errorText);
              setError(`Signed URL failed: ${response.status}`);
            }
          } catch (err) {
            console.log('[useSimpleVideoUrl] Signed URL error:', err);
            const errorMessage = err instanceof Error ? err.message : 'Unknown error';
            setError(`Signed URL error: ${errorMessage}`);
          }
        } else if (mediaUrl) {
          // Fallback: use original Supabase URL if we have one
          console.log('[useSimpleVideoUrl] Using original Supabase URL as fallback');
          setVideoUrl(mediaUrl);
        } else {
          throw new Error('No valid video source available');
        }

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useSimpleVideoUrl] Error processing URL:', err);
        
        // Always fallback to original URL if available
        if (mediaUrl) {
          console.log('[useSimpleVideoUrl] Error fallback to original URL:', mediaUrl);
          setVideoUrl(mediaUrl);
        }
      } finally {
        setIsLoading(false);
      }
    };

    processUrl();
  }, [mediaUrl, bucket, path, enabled, retryTrigger]);

  const retry = () => {
    console.log('[useSimpleVideoUrl] Retrying', { mediaUrl, bucket, path });
    setError(null);
    setRetryTrigger(prev => prev + 1); // Trigger useEffect to run again
  };

  return { videoUrl, isLoading, error, retry };
}
