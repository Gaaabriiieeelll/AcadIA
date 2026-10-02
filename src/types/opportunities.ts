export const OPPORTUNITY_KINDS = ["internship", "job", "trainee", "academic"] as const;
export const OPPORTUNITY_MODALITIES = ["unspecified", "onsite", "hybrid", "remote"] as const;

export type OpportunityKind = (typeof OPPORTUNITY_KINDS)[number];
export type OpportunityModality = (typeof OPPORTUNITY_MODALITIES)[number];

export type OpportunityValues = {
  title: string;
  organization: string;
  kind: OpportunityKind;
  acceptedCourses: string | null;
  modality: OpportunityModality;
  location: string | null;
  deadline: string | null;
  sourceUrl: string;
  requirements: string | null;
  documents: string | null;
  notes: string | null;
  reminder: boolean;
};

export type OpportunityDTO = Omit<OpportunityValues, "reminder"> & {
  id: string;
  favorite: boolean;
  hasReminder: boolean;
  createdAt: string;
};

export type OpportunityFormState = {
  status: "idle" | "error" | "success";
  message?: string;
  fieldErrors?: Partial<Record<keyof OpportunityValues, string[]>>;
};
