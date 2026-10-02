import "server-only";

import { z } from "zod";
import {
  parseYouTubeDuration,
  rankEducationalVideos,
  type EducationalVideoCandidate,
} from "@/lib/youtube-ranking";

const YOUTUBE_SEARCH_URL = "https://www.googleapis.com/youtube/v3/search";
const YOUTUBE_VIDEOS_URL = "https://www.googleapis.com/youtube/v3/videos";

const youtubeSearchSchema = z.object({
  items: z.array(z.object({
    id: z.object({ videoId: z.string().min(1) }),
    snippet: z.object({
      title: z.string(),
      channelTitle: z.string(),
      description: z.string().optional(),
      liveBroadcastContent: z.string().optional(),
      publishedAt: z.string().optional(),
      thumbnails: z.record(z.string(), z.object({ url: z.string().url() })),
    }),
  })).default([]),
});

const youtubeVideosSchema = z.object({
  items: z.array(z.object({
    id: z.string(),
    snippet: z.object({
      description: z.string().optional(),
      defaultAudioLanguage: z.string().optional(),
      liveBroadcastContent: z.string().optional(),
    }).optional(),
    contentDetails: z.object({
      duration: z.string().optional(),
      caption: z.string().optional(),
      regionRestriction: z.object({
        allowed: z.array(z.string()).optional(),
        blocked: z.array(z.string()).optional(),
      }).optional(),
    }).optional(),
    statistics: z.object({
      viewCount: z.string().optional(),
      likeCount: z.string().optional(),
      commentCount: z.string().optional(),
    }).optional(),
    status: z.object({
      embeddable: z.boolean().optional(),
      privacyStatus: z.string().optional(),
    }).optional(),
  })).default([]),
});

export type YouTubeVideo = {
  videoId: string;
  title: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: Date | null;
  selectionReason: string;
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

function count(value: string | undefined): number | null {
  if (!value || !/^\d+$/.test(value)) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) ? parsed : null;
}

async function videoDetails(videoIds: string[], apiKey: string) {
  const parameters = new URLSearchParams({
    key: apiKey,
    part: "snippet,contentDetails,statistics,status",
    id: videoIds.join(","),
  });
  const response = await fetch(`${YOUTUBE_VIDEOS_URL}?${parameters}`, {
    cache: "no-store",
    signal: AbortSignal.timeout(20_000),
  }).catch(() => null);
  if (!response?.ok) return null;

  const payload = await response.json().catch(() => null);
  const parsed = youtubeVideosSchema.safeParse(payload);
  return parsed.success ? new Map(parsed.data.items.map((item) => [item.id, item])) : null;
}

export async function searchEducationalYouTubeVideo(query: string) {
  const apiKey = process.env.YOUTUBE_API_KEY?.trim();
  if (!apiKey) throw new YouTubeSearchError("NOT_CONFIGURED");

  const parameters = new URLSearchParams({
    key: apiKey,
    maxResults: "10",
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

  const candidates = parsed.data.items.flatMap<EducationalVideoCandidate>((item, searchPosition) => {
    if (item.snippet.liveBroadcastContent && item.snippet.liveBroadcastContent !== "none") {
      return [];
    }
    const thumbnail = item.snippet.thumbnails.high
      ?? item.snippet.thumbnails.medium
      ?? item.snippet.thumbnails.default;
    const publishedAt = item.snippet.publishedAt
      ? new Date(item.snippet.publishedAt)
      : null;

    return [{
      videoId: item.id.videoId,
      title: decodeHtml(item.snippet.title).slice(0, 240),
      description: decodeHtml(item.snippet.description ?? "").slice(0, 3_000),
      channelTitle: decodeHtml(item.snippet.channelTitle).slice(0, 180),
      thumbnailUrl: thumbnail?.url ?? `https://i.ytimg.com/vi/${item.id.videoId}/hqdefault.jpg`,
      publishedAt: publishedAt && !Number.isNaN(publishedAt.getTime()) ? publishedAt : null,
      searchPosition,
      durationSeconds: null,
      hasCaptions: null,
      audioLanguage: null,
      viewCount: null,
      likeCount: null,
      commentCount: null,
    }];
  });

  if (candidates.length === 0) return [];

  const details = await videoDetails(candidates.map((video) => video.videoId), apiKey);
  const available = details === null ? candidates : candidates.flatMap((video) => {
    const detail = details.get(video.videoId);
    if (!detail || detail.status?.embeddable === false
      || (detail.status?.privacyStatus && detail.status.privacyStatus !== "public")
      || (detail.snippet?.liveBroadcastContent && detail.snippet.liveBroadcastContent !== "none")
      || detail.contentDetails?.regionRestriction?.blocked?.includes("BR")
      || (detail.contentDetails?.regionRestriction?.allowed
        && !detail.contentDetails.regionRestriction.allowed.includes("BR"))) {
      return [];
    }
    return [{
      ...video,
      description: decodeHtml(detail.snippet?.description ?? video.description).slice(0, 3_000),
      durationSeconds: parseYouTubeDuration(detail.contentDetails?.duration),
      hasCaptions: detail.contentDetails?.caption === undefined
        ? null
        : detail.contentDetails.caption === "true",
      audioLanguage: detail.snippet?.defaultAudioLanguage ?? null,
      viewCount: count(detail.statistics?.viewCount),
      likeCount: count(detail.statistics?.likeCount),
      commentCount: count(detail.statistics?.commentCount),
    }];
  });

  return rankEducationalVideos(query, available).map<YouTubeVideo>((video) => ({
    videoId: video.videoId,
    title: video.title,
    channelTitle: video.channelTitle,
    thumbnailUrl: video.thumbnailUrl,
    publishedAt: video.publishedAt,
    selectionReason: video.selectionReason,
  }));
}
