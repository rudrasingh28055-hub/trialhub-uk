export function getEmbedUrl(url: string): string | null {
  if (!url) return null;

  // YouTube
  const youtubeRegex = /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/;
  const youtubeMatch = url.match(youtubeRegex);
  if (youtubeMatch) {
    return `https://www.youtube.com/embed/${youtubeMatch[1]}`;
  }

  // Vimeo
  const vimeoRegex = /vimeo\.com\/(?:.*\/)?(\d+)/;
  const vimeoMatch = url.match(vimeoRegex);
  if (vimeoMatch) {
    return `https://player.vimeo.com/video/${vimeoMatch[1]}`;
  }

  // If it's already an embed URL or direct video file, return as is
  if (url.includes('youtube.com/embed') || url.includes('player.vimeo.com') || url.match(/\.(mp4|webm|ogg)$/i)) {
    return url;
  }

  return null;
}

export function isEmbeddableVideo(url: string): boolean {
  return getEmbedUrl(url) !== null;
}

export function isDirectVideoUrl(url: string): boolean {
  return url.match(/\.(mp4|webm|ogg)$/i) !== null;
}
