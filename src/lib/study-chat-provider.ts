export type StudyChatProvider = "groq" | "openai" | "none";

export const DEFAULT_GROQ_CHAT_MODEL = "openai/gpt-oss-120b";

export function studyChatProvider(configuration: {
  GROQ_API_KEY?: string;
  OPENAI_API_KEY?: string;
}): StudyChatProvider {
  if (configuration.GROQ_API_KEY?.trim()) return "groq";
  if (configuration.OPENAI_API_KEY?.trim()) return "openai";
  return "none";
}

export function compactGroqStudyContext<Subject extends {
  materials: Array<{
    title: string;
    description: string | null;
    attachmentTitles: string[];
  }>;
}>(history: Array<{ role: "user" | "assistant"; content: string }>, subjects: Subject[]) {
  return {
    history: history.slice(-6),
    subjects: subjects.slice(0, 8).map((subject) => ({
      ...subject,
      materials: subject.materials.slice(0, 3).map((material) => ({
        ...material,
        title: material.title.slice(0, 160),
        description: material.description?.slice(0, 220) ?? null,
        attachmentTitles: material.attachmentTitles.slice(0, 3)
          .map((title) => title.slice(0, 80)),
      })),
    })),
  };
}
