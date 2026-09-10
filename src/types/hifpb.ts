export const hifpbWeekdays = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
] as const;

export type HifpbWeekday = (typeof hifpbWeekdays)[number];

export type HifpbGroup = "G1" | "G2";

export type HifpbClass = {
  subject: string;
  professor: string;
  professorUrl: string | null;
  room: string | null;
  roomUrl: string | null;
};

export type HifpbScheduleSlot = {
  time: string;
  classes: Record<HifpbWeekday, HifpbClass[]>;
};

export type HifpbProfessor = {
  name: string;
  profileUrl: string | null;
  subjects: string[];
};

export type HifpbSchedule = {
  semester: string;
  course: string;
  className: string;
  sourceUrl: string;
  slots: HifpbScheduleSlot[];
  professors: HifpbProfessor[];
  subjects: string[];
};
