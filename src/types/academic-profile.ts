export type AcademicProfileValues = {
  registrationNumber: string;
  campus: string;
  course: string;
  classGroup: string | null;
  academicStage: string;
};

export type AcademicProfileField = keyof AcademicProfileValues;

export type AcademicProfileFormState = {
  status: "idle" | "error";
  message?: string;
  fieldErrors?: Partial<Record<AcademicProfileField, string[]>>;
};
