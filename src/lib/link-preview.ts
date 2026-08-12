/**
 * Resolve a cover image for a video link, so the CRM only ever asks the
 * salesperson for the URL — never for a manual upload.
 *
 * Strategy, cheapest first:
 *   1. YouTube — the thumbnail URL is derivable from the video id (no API).
 *   2. Instagram/Facebook — official oEmbed, but only if FB app credentials
 *      exist (they're optional, like every other integration here).
 *   3. Anything else — fetch the page and read its <meta property="og:image">.
 *
 * Never throws and never blocks for long: a missing cover is fine, the UI just
 * shows the link instead.
 */

const FETCH_TIMEOUT = 6000;

/**
 * An embeddable player for the link, so the card shows the actual video
 * instead of a raw URL. Instagram's /embed endpoint is public (no API key),
 * which is the only reliable way to preview a Reel — its OG tags are blocked
 * to servers.
 */
export function videoEmbed(url?: string | null): { kind: 'instagram' | 'youtube'; src: string } | null {
  if (!url) return null;
  const u = url.trim();

  const ig = u.match(/instagram\.com\/(?:[\w.]+\/)?(p|reel|reels|tv)\/([A-Za-z0-9_-]+)/i);
  if (ig) {
    const kind = ig[1].toLowerCase() === 'reels' ? 'reel' : ig[1].toLowerCase();
    return { kind: 'instagram', src: `https://www.instagram.com/${kind}/${ig[2]}/embed` };
  }

  const yt = youtubeId(u);
  if (yt) return { kind: 'youtube', src: `https://www.youtube.com/embed/${yt}` };

  return null;
}

function youtubeId(url: string): string | null {
  const m =
    url.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([A-Za-z0-9_-]{6,})/);
  return m?.[1] ?? null;
}

async function withTimeout(url: string, init?: RequestInit): Promise<Response | null> {
  const ctl = new AbortController();
  const timer = setTimeout(() => ctl.abort(), FETCH_TIMEOUT);
  try {
    return await fetch(url, {
      ...init,
      signal: ctl.signal,
      headers: {
        // Some CDNs only return OG tags to a browser-ish UA.
        'user-agent': 'Mozilla/5.0 (compatible; mimiBot/1.0; +https://mimitj.agency)',
        ...(init?.headers ?? {}),
      },
    });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Pull og:image (or twitter:image) out of an HTML document. */
function ogImage(html: string): string | null {
  const patterns = [
    /<meta[^>]+property=["']og:image(?::secure_url)?["'][^>]+content=["']([^"']+)["']/i,
    /<meta[^>]+content=["']([^"']+)["'][^>]+property=["']og:image["']/i,
    /<meta[^>]+name=["']twitter:image["'][^>]+content=["']([^"']+)["']/i,
  ];
  for (const re of patterns) {
    const m = html.match(re);
    if (m?.[1]) return m[1].replace(/&amp;/g, '&');
  }
  return null;
}

export async function resolveVideoCover(rawUrl: string): Promise<string | null> {
  const url = rawUrl.trim();
  if (!/^https?:\/\//i.test(url)) return null;

  // 1) YouTube — deterministic, no network call needed.
  const yt = youtubeId(url);
  if (yt) return `https://img.youtube.com/vi/${yt}/hqdefault.jpg`;

  // 2) Instagram / Facebook oEmbed — only when app credentials are configured.
  const appId = process.env.FB_APP_ID;
  const appSecret = process.env.FB_APP_SECRET;
  if (appId && appSecret && /instagram\.com|facebook\.com|fb\.watch/i.test(url)) {
    const endpoint = /instagram\.com/i.test(url) ? 'instagram_oembed' : 'oembed_video';
    const api =
      `https://graph.facebook.com/v19.0/${endpoint}` +
      `?url=${encodeURIComponent(url)}&access_token=${appId}|${appSecret}&fields=thumbnail_url`;
    const res = await withTimeout(api);
    if (res?.ok) {
      const data = await res.json().catch(() => null);
      if (data?.thumbnail_url) return data.thumbnail_url as string;
    }
  }

  // 3) Generic: read the page's own OG image.
  const res = await withTimeout(url);
  if (!res?.ok) return null;
  const ct = res.headers.get('content-type') ?? '';
  if (!ct.includes('text/html')) return null;
  const html = (await res.text().catch(() => '')).slice(0, 400_000);
  return ogImage(html);
}
