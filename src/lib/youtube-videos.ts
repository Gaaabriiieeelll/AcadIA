import "server-only";

import { z } from "zod";

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";

const youtubeSearchSchema = z.object({
  items: z.array(z.object({
    id: z.object({ videoId: z.string().min(1) }),
    snippet: z.object({
      title: z.string(),
      channelTitle: z.string(),
      publishedAt: z.string().optional(),
      thumbnails: z.record(z.string(), z.object({ url: z.string().url() })),
    }),
  })).default([]),
});

export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: Date | null;
};

export class YouTubeSearchError extends Error {
  constructor(public readonly code: "NOT_CONFIGURED" | "UNAVAILABLE") {
    super(code);
    this.name = "YouTubeSearchError";
  }
}

function decodeHtml(value: string) {
  const namedEntities: Record<string, string> = {
    amp: "&",
    apos: "'",
    gt: ">",
    lt: "<",
    quot: '"',
  };

  return value.replace(/&(#x?[0-9a-f]+|[a-z]+);/giu, (entity, code: string) => {
    if (code.startsWith("#x")) {
      return String.fromCodePoint(Number.parseInt(code.slice(2), 16));
    }
    if (code.startsWith("#")) {
      return String.fromCodePoint(Number.parseInt(code.slice(1), 10));
    }
    return namedEntities[code.toLocaleLowerCase("en-US")] ?? entity;
  });
}

export async function searchEducationalYouTubeVideo(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) throw new YouTubeSearchError("NOT_CONFIGURED");

  const parameters = new URLSearchParams({
    key: apiKey,
    maxResults: "5",
    order: "relevance",
    part: "snippet",
    q: query,
    regionCode: "BR",
    relevanceLanguage: "pt",
    safeSearch: "strict",
    type: "video",
    videoEmbeddable: "true",
  });

  const response = await fetch(`${YOUTUBE_SEARCH_URL}?${parameters}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  }).catch(() => {
    throw new YouTubeSearchError("UNAVAILABLE");
  });

  if (!response.ok) throw new YouTubeSearchError("UNAVAILABLE");

  const parsed = youtubeSearchSchema.safeParse(await response.json());
  if (!parsed.success) throw new YouTubeSearchError("UNAVAILABLE");

  return parsed.data.items.map<YouTubeVideo>((item) => {
    const thumbnail = item.snippet.thumbnails.high
      ?? item.snippet.thumbnails.medium
      ?? item.snippet.thumbnails.default;
    const publishedAt = item.snippet.publishedAt
      ? new Date(item.snippet.publishedAt)
      : null;

    return {
      videoId: item.id.videoId,
      title: decodeHtml(item.snippet.title).slice(0, 240),
      channelTitle: decodeHtml(item.snippet.channelTitle).slice(0, 180),
      thumbnailUrl: thumbnail?.url ?? `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
    };
  });
}
