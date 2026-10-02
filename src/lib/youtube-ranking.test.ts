import assert from "node:assert/strict";
import test from "node:test";

import {
  parseYouTubeDuration,
  rankEducationalVideos,
  type EducationalVideoCandidate,
} from "./youtube-ranking";

const now = new Date("2026-10-02T12:00:00.000Z");

function candidate(
  videoId: string,
  title: string,
  changes: Partial<EducationalVideoCandidate> = {},
): EducationalVideoCandidate {
  return {
    videoId,
    title,
    description: "",
    channelTitle: "Professor",
    thumbnailUrl: "https://i.ytimg.com/vi/example/hqdefault.jpg",
    publishedAt: null,
    searchPosition: 0,
    durationSeconds: null,
    hasCaptions: null,
    audioLanguage: null,
    viewCount: null,
    likeCount: null,
    commentCount: null,
    ...changes,
  };
}

test("prioriza o assunto mesmo quando outro vídeo tem muito mais visualizações", () => {
  const ranked = rankEducationalVideos("equações do segundo grau", [
    candidate("popular", "Aula de geografia", {
      searchPosition: 0,
      viewCount: 10_000_000,
      likeCount: 500_000,
      commentCount: 80_000,
    }),
    candidate("relevant", "Equações do segundo grau: videoaula", {
      searchPosition: 1,
      viewCount: 100,
    }),
  ], now);

  assert.equal(ranked[0].videoId, "relevant");
});

test("prefere duração de aula, legendas e áudio em português quando o assunto coincide", () => {
  const ranked = rankEducationalVideos("circuitos elétricos", [
    candidate("short", "Circuitos elétricos", { durationSeconds: 50 }),
    candidate("lesson", "Circuitos elétricos", {
      durationSeconds: 1_200,
      hasCaptions: true,
      audioLanguage: "pt-BR",
    }),
  ], now);

  assert.equal(ranked[0].videoId, "lesson");
  assert.equal(ranked[0].selectionReason, "Critérios do vídeo: 20 min, legendas disponíveis, áudio em português.");
  assert.equal(ranked[1].selectionReason, "Critérios do vídeo: 1 min.");
});

test("não atribui legendas ou idioma quando os metadados não informam", () => {
  const [video] = rankEducationalVideos("história do Brasil", [
    candidate("unknown", "História do Brasil", { hasCaptions: null }),
  ], now);

  assert.equal(video.selectionReason, "Critério do vídeo: relação com o assunto pesquisado.");
});

test("usa a ordem da busca como desempate", () => {
  const ranked = rankEducationalVideos("química orgânica", [
    candidate("second", "Química orgânica", { searchPosition: 1 }),
    candidate("first", "Química orgânica", { searchPosition: 0 }),
  ], now);

  assert.equal(ranked[0].videoId, "first");
});

test("interpreta a duração ISO 8601 do YouTube", () => {
  assert.equal(parseYouTubeDuration("PT1H2M3S"), 3_723);
  assert.equal(parseYouTubeDuration("PT18M"), 1_080);
  assert.equal(parseYouTubeDuration("P1DT2H"), 93_600);
  assert.equal(parseYouTubeDuration("PT0S"), null);
  assert.equal(parseYouTubeDuration("invalid"), null);
});
