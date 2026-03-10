import { useState, useEffect } from 'react';
import { parseSupabaseStorageUrl } from '../lib/media/parseSupabaseStorageUrl';

interface UseSignedMediaUrlOptions {
  bucket?: string;
  path?: string;
  mediaUrl?: string;
  expiresIn?: number;
  enabled?: boolean;
}

export function useSignedMediaUrl({
  bucket,
  path,
  mediaUrl,
  expiresIn = 600,
  enabled = true
}: UseSignedMediaUrlOptions) {
  const [signedUrl, setSignedUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSignedUrl = async () => {
    if (!enabled) {
      setSignedUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      let targetBucket = bucket;
      let targetPath = path;

      // If we have a mediaUrl but no bucket/path, parse it
      if (mediaUrl && (!bucket || !path)) {
        if (!mediaUrl.includes('/storage/v1/object/')) {
          setSignedUrl(mediaUrl); // Not a Supabase URL, use as-is
          setIsLoading(false);
          return;
        }

        const parsed = parseSupabaseStorageUrl(mediaUrl);
        if (!parsed) {
          throw new Error('Failed to parse media URL');
        }

        targetBucket = targetBucket || parsed.bucket;
        targetPath = targetPath || parsed.path;
      }

      if (!targetBucket || !targetPath) {
        throw new Error('Bucket and path are required');
      }

      // Fetch fresh signed URL
      const response = await fetch('/api/media/signed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bucket: targetBucket,
          path: targetPath,
          expiresIn
        })
      });

      const result = await response.json();

      if (!response.ok) {
        // Handle specific auth errors
        if (response.status === 401) {
          throw new Error('Authentication required. Please sign in again.');
        }
        if (response.status === 403) {
          throw new Error('Access denied. Check bucket permissions.');
        }
        throw new Error(result.error || 'Failed to fetch signed URL');
      }

      setSignedUrl(result.signedUrl);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Failed to fetch signed URL:', err);
      
      // Fallback to original URL if it's a blob URL or not a Supabase URL
      if (mediaUrl && (!mediaUrl.includes('/storage/v1/object/') || mediaUrl.startsWith('blob:'))) {
        console.log('Using fallback URL:', mediaUrl);
        setSignedUrl(mediaUrl);
      } else if (errorMessage.includes('Authentication') || errorMessage.includes('fetch')) {
        // For auth/network errors, try to use the original URL if it exists
        if (mediaUrl) {
          console.log('Auth/network error, using original URL:', mediaUrl);
          setSignedUrl(mediaUrl);
        }
      }
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchSignedUrl();
  }, [bucket, path, mediaUrl, expiresIn, enabled]);

  const retry = () => {
    fetchSignedUrl();
  };

  return { signedUrl, isLoading, error, retry };
}
