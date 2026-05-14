// ─── YouTube Integration ─────────────────────────────────────────────────────
// All embeds use youtube-nocookie.com to comply with COPPA.
// YouTube API calls are proxied through the backend — API key never in app.

export interface YouTubeVideoMeta {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  durationIso: string;
  channelTitle: string;
}

export function buildNoCookieEmbedUrl(videoId: string, options?: {
  autoplay?: boolean;
  controls?: boolean;
  modestbranding?: boolean;
  rel?: boolean;
}): string {
  const params = new URLSearchParams({
    autoplay: options?.autoplay ? '1' : '0',
    controls: options?.controls === false ? '0' : '1',
    modestbranding: '1',
    rel: '0',           // never show related videos (privacy + focus)
    disablekb: '0',
    fs: '1',
  });

  return `https://www.youtube-nocookie.com/embed/${videoId}?${params.toString()}`;
}

export function extractVideoId(urlOrId: string): string | null {
  if (/^[a-zA-Z0-9_-]{11}$/.test(urlOrId)) return urlOrId;
  const match = urlOrId.match(
    /(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/,
  );
  return match ? match[1] : null;
}

export function getThumbnailUrl(videoId: string): string {
  return `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
}
