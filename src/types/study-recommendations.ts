export type StudyVideoRecommendationDTO = {
  id: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  topic: string;
  rationale: string;
  sourceMaterialTitle: string;
  averageScore: number | null;
  videoId: string;
  videoTitle: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoPublishedAt: string | null;
  videoUrl: string;
};

export type StudyRecommendationOverviewDTO = {
  recommendations: StudyVideoRecommendationDTO[];
  generatedAt: string | null;
  classroomConnected: boolean;
  aiConsentGranted: boolean;
  openAIConfigured: boolean;
  youtubeConfigured: boolean;
};

export type StudyRecommendationGenerateState = {
  status: "idle" | "success" | "error";
  message?: string;
};

export type StudyChatHistoryMessage = {
  role: "user" | "assistant";
  content: string;
};

export type StudyChatVideoDTO = {
  id: string;
  subjectName: string;
  subjectColor: string;
  topic: string;
  rationale: string;
  videoTitle: string;
  channelTitle: string;
  thumbnailUrl: string;
  videoUrl: string;
};

export type StudyChatResponse = {
  status: "success" | "error";
  message: string;
  videos: StudyChatVideoDTO[];
};
