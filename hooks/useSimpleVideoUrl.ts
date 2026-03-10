import { useState, useEffect } from 'react';
import { parseSupabaseStorageUrl } from '../lib/media/parseSupabaseStorageUrl';

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

  useEffect(() => {
    if (!enabled || !mediaUrl) {
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
        if (mediaUrl.startsWith('blob:')) {
          console.log('[useSimpleVideoUrl] Using blob URL directly');
          setVideoUrl(mediaUrl);
          setIsLoading(false);
          return;
        }

        // For non-Supabase URLs, use directly
        if (!mediaUrl.includes('/storage/v1/object/')) {
          console.log('[useSimpleVideoUrl] Using non-Supabase URL directly');
          setVideoUrl(mediaUrl);
          setIsLoading(false);
          return;
        }

        // For Supabase URLs, try to get fresh signed URL, but fallback to original
        if (bucket && path) {
          console.log('[useSimpleVideoUrl] Attempting to get fresh signed URL');
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
              console.log('[useSimpleVideoUrl] Signed URL failed, using original:', response.status);
            }
          } catch (err) {
            console.log('[useSimpleVideoUrl] Signed URL error, using original:', err);
          }
        }

        // Fallback: use original URL
        console.log('[useSimpleVideoUrl] Using original Supabase URL as fallback');
        setVideoUrl(mediaUrl);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useSimpleVideoUrl] Error processing URL:', err);
        
        // Always fallback to original URL
        console.log('[useSimpleVideoUrl] Error fallback to original URL:', mediaUrl);
        setVideoUrl(mediaUrl);
      } finally {
        setIsLoading(false);
      }
    };

    processUrl();
  }, [mediaUrl, bucket, path, enabled]);

  const retry = () => {
    if (mediaUrl) {
      console.log('[useSimpleVideoUrl] Retrying with original URL:', mediaUrl);
      setVideoUrl(mediaUrl);
      setError(null);
      setIsLoading(false);
    }
  };

  return { videoUrl, isLoading, error, retry };
}
