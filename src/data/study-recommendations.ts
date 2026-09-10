import "server-only";

import { getCurrentClassroomOverview } from "@/data/google-classroom";
import { requireCurrentIdentity } from "@/data/current-user";
import { requireCurrentAiConsent } from "@/data/privacy";
import { getCurrentSubjects } from "@/data/subjects";
import { db } from "@/lib/db";
import {
  AI_ACADEMIC_ANALYSIS_PURPOSE,
  AI_CONSENT_VERSION,
} from "@/lib/privacy-constants";
import {
  RecommendationAIError,
  analyzeStudyRecommendations,
  answerStudyChat,
} from "@/lib/openai-study-recommendations";
import {
  YouTubeSearchError,
  searchEducationalYouTubeVideo,
} from "@/lib/youtube-videos";
import type {
  StudyChatHistoryMessage,
  StudyChatResponse,
  StudyChatVideoDTO,
  StudyRecommendationOverviewDTO,
  StudyVideoRecommendationDTO,
} from "@/types/study-recommendations";

export type StudyRecommendationErrorCode =
  | "NO_SUBJECTS"
  | "NO_CLASSROOM_CONTENT"
  | "NO_RECOMMENDATIONS";

export class StudyRecommendationError extends Error {
  constructor(public readonly code: StudyRecommendationErrorCode) {
    super(code);
    this.name = "StudyRecommendationError";
  }
}

function configured(value: string | undefined) {
  return Boolean(value?.trim());
}

export async function getCurrentStudyRecommendationOverview(): Promise<StudyRecommendationOverviewDTO> {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      classroomCredential: { select: { id: true } },
      privacyConsents: {
        where: {
          purpose: AI_ACADEMIC_ANALYSIS_PURPOSE,
          version: AI_CONSENT_VERSION,
          revokedAt: null,
        },
        select: { id: true },
        take: 1,
      },
      videoRecommendations: {
        orderBy: [{ averageScore: "asc" }, { createdAt: "desc" }],
        include: {
          subject: { select: { name: true, color: true } },
        },
      },
    },
  });

  const recommendations = (user?.videoRecommendations ?? []).map<StudyVideoRecommendationDTO>(
    (recommendation) => ({
      id: recommendation.id,
      subjectId: recommendation.subjectId,
      subjectName: recommendation.subject.name,
      subjectColor: recommendation.subject.color,
      topic: recommendation.topic,
      rationale: recommendation.rationale,
      sourceMaterialTitle: recommendation.sourceMaterialTitle,
      averageScore: recommendation.averageScore === null
        ? null
        : Number(recommendation.averageScore.toString()),
      videoId: recommendation.youtubeVideoId,
      videoTitle: recommendation.videoTitle,
      channelTitle: recommendation.channelTitle,
      thumbnailUrl: recommendation.thumbnailUrl,
      videoPublishedAt: recommendation.videoPublishedAt?.toISOString() ?? null,
      videoUrl: `https://www.youtube.com/watch?v=${recommendation.youtubeVideoId}`,
    }),
  );

  return {
    recommendations,
    generatedAt: user?.videoRecommendations[0]?.createdAt.toISOString() ?? null,
    classroomConnected: Boolean(user?.classroomCredential),
    aiConsentGranted: Boolean(user?.privacyConsents[0]),
    openAIConfigured: configured(process.env.OPENAI_API_KEY),
    youtubeConfigured: configured(process.env.YOUTUBE_API_KEY),
  };
}

export async function generateCurrentStudyRecommendations() {
  await requireCurrentAiConsent();
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: { id: true },
  });
  if (!user) throw new StudyRecommendationError("NO_SUBJECTS");

  const [subjects, classroom] = await Promise.all([
    getCurrentSubjects(),
    getCurrentClassroomOverview(),
  ]);
  if (subjects.length === 0) throw new StudyRecommendationError("NO_SUBJECTS");

  const materialsBySubject = new Map<string, typeof classroom.materials>();
  for (const material of classroom.materials) {
    if (!material.subjectId) continue;
    const existing = materialsBySubject.get(material.subjectId) ?? [];
    existing.push(material);
    materialsBySubject.set(material.subjectId, existing);
  }

  const candidateSubjects = subjects
    .filter((subject) => materialsBySubject.has(subject.id))
    .sort((left, right) => {
      if (left.averageScore === null && right.averageScore === null) {
        return left.name.localeCompare(right.name, "pt-BR");
      }
      if (left.averageScore === null) return 1;
      if (right.averageScore === null) return -1;
      return left.averageScore - right.averageScore;
    })
    .slice(0, 4);

  if (candidateSubjects.length === 0) {
    throw new StudyRecommendationError("NO_CLASSROOM_CONTENT");
  }

  const analysisSubjects = candidateSubjects.map((subject) => ({
    id: subject.id,
    name: subject.name,
    averageScore: subject.averageScore,
    bimesterGrades: subject.bimesterGrades.map(({ bimester, score }) => ({
      bimester,
      score,
    })),
    materials: (materialsBySubject.get(subject.id) ?? []).slice(0, 8).map((material) => ({
      id: material.id,
      title: material.title.slice(0, 200),
      description: material.description?.slice(0, 800) ?? null,
      attachmentTitles: material.attachments
        .map((attachment) => attachment.title.slice(0, 160))
        .slice(0, 6),
    })),
  }));

  const analysis = await analyzeStudyRecommendations({
    userIdentifier: googleSubject,
    subjects: analysisSubjects,
  });
  const subjectById = new Map(candidateSubjects.map((subject) => [subject.id, subject]));
  const materialById = new Map(
    analysisSubjects.flatMap((subject) =>
      subject.materials.map((material) => [material.id, {
        subjectId: subject.id,
        title: material.title,
      }] as const),
    ),
  );
  const seenQueries = new Set<string>();
  const validQueries = analysis.recommendations.filter((recommendation) => {
    const subject = subjectById.get(recommendation.subjectId);
    const material = materialById.get(recommendation.materialId);
    const queryKey = recommendation.searchQuery.toLocaleLowerCase("pt-BR");
    if (!subject || material?.subjectId !== subject.id || seenQueries.has(queryKey)) {
      return false;
    }
    seenQueries.add(queryKey);
    return true;
  });

  if (validQueries.length === 0) {
    throw new StudyRecommendationError("NO_RECOMMENDATIONS");
  }

  const searchResults = await Promise.all(
    validQueries.map(async (recommendation) => ({
      recommendation,
      videos: await searchEducationalYouTubeVideo(recommendation.searchQuery),
    })),
  );
  const usedVideos = new Set<string>();
  const generatedAt = new Date();
  const records = searchResults.flatMap(({ recommendation, videos }) => {
    const video = videos.find((item) => !usedVideos.has(item.videoId));
    const subject = subjectById.get(recommendation.subjectId);
    const material = materialById.get(recommendation.materialId);
    if (!video || !subject || !material) return [];
    usedVideos.add(video.videoId);

    return [{
      userId: user.id,
      subjectId: subject.id,
      topic: recommendation.topic,
      rationale: recommendation.rationale,
      searchQuery: recommendation.searchQuery,
      sourceMaterialTitle: material.title,
      averageScore: subject.averageScore,
      youtubeVideoId: video.videoId,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      videoPublishedAt: video.publishedAt,
      model: analysis.model,
      createdAt: generatedAt,
      updatedAt: generatedAt,
    }];
  });

  if (records.length === 0) {
    throw new StudyRecommendationError("NO_RECOMMENDATIONS");
  }

  await db.$transaction(async (transaction) => {
    await transaction.studyVideoRecommendation.deleteMany({
      where: { userId: user.id },
    });
    await transaction.studyVideoRecommendation.createMany({ data: records });
  });

  return { created: records.length };
}

export async function answerCurrentStudyChat(
  message: string,
  history: StudyChatHistoryMessage[],
): Promise<StudyChatResponse> {
  await requireCurrentAiConsent();
  const { googleSubject } = await requireCurrentIdentity();
  const [subjects, classroom] = await Promise.all([
    getCurrentSubjects(),
    getCurrentClassroomOverview(),
  ]);

  if (subjects.length === 0) throw new StudyRecommendationError("NO_SUBJECTS");

  const materialsBySubject = new Map<string, typeof classroom.materials>();
  for (const material of classroom.materials) {
    if (!material.subjectId) continue;
    const existing = materialsBySubject.get(material.subjectId) ?? [];
    existing.push(material);
    materialsBySubject.set(material.subjectId, existing);
  }

  const contextSubjects = [...subjects]
    .sort((left, right) => {
      if (left.averageScore === null && right.averageScore === null) {
        return left.name.localeCompare(right.name, "pt-BR");
      }
      if (left.averageScore === null) return 1;
      if (right.averageScore === null) return -1;
      return left.averageScore - right.averageScore;
    })
    .slice(0, 12)
    .map((subject) => ({
      id: subject.id,
      name: subject.name,
      averageScore: subject.averageScore,
      bimesterGrades: subject.bimesterGrades.map(({ bimester, score }) => ({
        bimester,
        score,
      })),
      materials: (materialsBySubject.get(subject.id) ?? []).slice(0, 6).map((material) => ({
        id: material.id,
        title: material.title.slice(0, 200),
        description: material.description?.slice(0, 800) ?? null,
        attachmentTitles: material.attachments
          .map((attachment) => attachment.title.slice(0, 160))
          .slice(0, 6),
      })),
    }));

  const analysis = await answerStudyChat({
    userIdentifier: googleSubject,
    message,
    history,
    subjects: contextSubjects,
  });

  if (!process.env.YOUTUBE_API_KEY?.trim() || analysis.videoQueries.length === 0) {
    return { status: "success", message: analysis.reply, videos: [] };
  }

  const subjectById = new Map(subjects.map((subject) => [subject.id, subject]));
  const materialById = new Map(
    contextSubjects.flatMap((subject) =>
      subject.materials.map((material) => [material.id, subject.id] as const),
    ),
  );
  const validQueries = analysis.videoQueries.filter((query) =>
    subjectById.has(query.subjectId)
      && materialById.get(query.materialId) === query.subjectId,
  );
  const searchResults = await Promise.allSettled(
    validQueries.map(async (query) => ({
      query,
      videos: await searchEducationalYouTubeVideo(query.searchQuery),
    })),
  );
  const usedVideos = new Set<string>();
  const videos: StudyChatVideoDTO[] = [];

  for (const result of searchResults) {
    if (result.status !== "fulfilled") continue;
    const { query } = result.value;
    const subject = subjectById.get(query.subjectId);
    const video = result.value.videos.find((item) => !usedVideos.has(item.videoId));
    if (!subject || !video) continue;
    usedVideos.add(video.videoId);
    videos.push({
      id: `${query.subjectId}:${video.videoId}`,
      subjectName: subject.name,
      subjectColor: subject.color,
      topic: query.topic,
      rationale: query.rationale,
      videoTitle: video.title,
      channelTitle: video.channelTitle,
      thumbnailUrl: video.thumbnailUrl,
      videoUrl: `https://www.youtube.com/watch?v=${video.videoId}`,
    });
  }

  return { status: "success", message: analysis.reply, videos };
}

export { RecommendationAIError, YouTubeSearchError };
