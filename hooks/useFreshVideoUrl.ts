import { useState, useEffect } from 'react';

export function useFreshVideoUrl(mediaUrl: string | null, enabled: boolean = true) {
  const [freshUrl, setFreshUrl] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !mediaUrl) {
      setFreshUrl(null);
      setIsLoading(false);
      setError(null);
      return;
    }

    const fetchFreshUrl = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // For non-Supabase URLs, use as-is
        if (!mediaUrl.includes('/storage/v1/object/')) {
          setFreshUrl(mediaUrl);
          setIsLoading(false);
          return;
        }

        console.log('[useFreshVideoUrl] Fetching fresh URL for:', mediaUrl.substring(0, 100) + '...');

        const response = await fetch('/api/get-fresh-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            mediaUrl,
            expiresIn: 3600 // 1 hour
          })
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch fresh URL');
        }

        console.log('[useFreshVideoUrl] Got fresh URL:', result.signedUrl?.substring(0, 100) + '...');
        setFreshUrl(result.signedUrl);

      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : 'Unknown error';
        setError(errorMessage);
        console.error('[useFreshVideoUrl] Failed:', err);
        // Fall back to original URL
        setFreshUrl(mediaUrl);
      } finally {
        setIsLoading(false);
      }
    };

    fetchFreshUrl();
  }, [mediaUrl, enabled]);

  return { freshUrl, isLoading, error };
}
