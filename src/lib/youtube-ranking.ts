export type EducationalVideoCandidate = {
  videoId: string;
  title: string;
  description: string;
  channelTitle: string;
  thumbnailUrl: string;
  publishedAt: Date | null;
  searchPosition: number;
  durationSeconds: number | null;
  hasCaptions: boolean | null;
  audioLanguage: string | null;
  viewCount: number | null;
  likeCount: number | null;
  commentCount: number | null;
};

export type RankedEducationalVideo = EducationalVideoCandidate & {
  selectionReason: string;
};

const SEARCH_WORDS = new Set([
  "a", "as", "ao", "aos", "com", "como", "da", "das", "de", "do", "dos", "e",
  "em", "ensino", "explicacao", "medio", "na", "nas", "no", "nos", "o", "os",
  "para", "por", "portugues", "pt", "sobre", "um", "uma", "video", "videoaula",
  "videos", "aula", "aulas", "brasil", "brasileiro",
]);

function terms(value: string) {
  return new Set(
    value.normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .toLocaleLowerCase("pt-BR")
      .match(/[a-z0-9]+/g)
      ?.filter((word) => word.length > 2 && !SEARCH_WORDS.has(word)) ?? [],
  );
}

function overlap(queryTerms: Set<string>, value: string) {
  if (queryTerms.size === 0) return 0;
  const valueTerms = terms(value);
  return [...queryTerms].filter((word) => valueTerms.has(word)).length / queryTerms.size;
}

export function parseYouTubeDuration(value: string | undefined): number | null {
  if (!value) return null;
  const match = /^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/.exec(value);
  if (!match) return null;
  const seconds = Number(match[1] ?? 0) * 86_400
    + Number(match[2] ?? 0) * 3_600
    + Number(match[3] ?? 0) * 60
    + Number(match[4] ?? 0);
  return Number.isSafeInteger(seconds) && seconds > 0 ? seconds : null;
}

function scoreVideo(
  video: EducationalVideoCandidate,
  queryTerms: Set<string>,
  now: Date,
) {
  let score = overlap(queryTerms, video.title) * 44
    + overlap(queryTerms, video.description) * 10
    + Math.max(0, 12 - video.searchPosition * 2);

  if (/\b(aula|videoaula|explica(?:ç|c)[aã]o|exerc[ií]cios?|revis[aã]o)\b/iu.test(video.title)) {
    score += 7;
  }

  const duration = video.durationSeconds;
  if (duration !== null) {
    if (duration < 120) score -= 18;
    else if (duration >= 480 && duration <= 2_700) score += 10;
    else if (duration <= 3_600) score += 6;
    else if (duration <= 5_400) score += 2;
    else if (duration > 7_200) score -= 6;
  }

  if (video.hasCaptions) score += 6;
  if (video.audioLanguage?.toLowerCase().startsWith("pt")) score += 7;
  else if (video.audioLanguage) score -= 5;

  if (video.publishedAt) {
    const ageYears = (now.getTime() - video.publishedAt.getTime()) / 31_557_600_000;
    if (ageYears >= 0 && ageYears <= 3) score += 3;
    else if (ageYears > 3 && ageYears <= 7) score += 1;
  }

  // Popularity is a minor tie breaker: counts alone do not establish teaching quality.
  if (video.viewCount !== null) {
    score += Math.min(4, Math.log10(video.viewCount + 1));
    if (video.viewCount >= 100 && video.likeCount !== null) {
      score += Math.min(2, (video.likeCount / video.viewCount) * 50);
    }
    if (video.commentCount !== null) score += Math.min(1, Math.log10(video.commentCount + 1) / 3);
  }

  return score;
}

function selectionReason(video: EducationalVideoCandidate) {
  const details: string[] = [];
  if (video.durationSeconds !== null) {
    details.push(`${Math.max(1, Math.round(video.durationSeconds / 60))} min`);
  }
  if (video.hasCaptions) details.push("legendas disponíveis");
  if (video.audioLanguage?.toLowerCase().startsWith("pt")) details.push("áudio em português");

  return details.length > 0
    ? `Critérios do vídeo: ${details.join(", ")}.`
    : "Critério do vídeo: relação com o assunto pesquisado.";
}

export function rankEducationalVideos(
  query: string,
  videos: EducationalVideoCandidate[],
  now = new Date(),
): RankedEducationalVideo[] {
  const queryTerms = terms(query);
  return videos
    .map((video) => ({
      video: { ...video, selectionReason: selectionReason(video) },
      score: scoreVideo(video, queryTerms, now),
    }))
    .sort((left, right) => right.score - left.score
      || left.video.searchPosition - right.video.searchPosition)
    .map(({ video }) => video);
}
