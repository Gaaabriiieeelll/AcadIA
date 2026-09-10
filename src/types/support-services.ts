export const SUPPORT_SERVICE_CATEGORIES = [
  "student-support",
  "academic",
  "accessibility-health",
  "library-career",
] as const;

export type SupportServiceCategory = (typeof SUPPORT_SERVICE_CATEGORIES)[number];

export type SupportServiceDTO = {
  id: string;
  acronym: string;
  name: string;
  category: SupportServiceCategory;
  summary: string;
  helpsWith: string[];
  email: string | null;
  phones: string[];
  whatsapp: string | null;
  location: string;
  hours: string;
  officialUrl: string;
  verifiedAt: string;
  featured?: boolean;
};
