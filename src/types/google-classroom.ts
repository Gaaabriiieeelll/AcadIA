export type ClassroomAttachmentType = "drive" | "youtube" | "link" | "form";

export type ClassroomAttachmentDTO = {
  type: ClassroomAttachmentType;
  title: string;
  url: string;
};

export type ClassroomCourseDTO = {
  id: string;
  name: string;
  section: string | null;
  subjectId: string | null;
  alternateLink: string | null;
  teachers: ClassroomTeacherDTO[];
  teacherContactsRestricted: boolean;
};

export type ClassroomTeacherDTO = {
  id: string;
  name: string;
  email: string | null;
};

export type ClassroomMaterialDTO = {
  id: string;
  courseId: string;
  courseName: string;
  subjectId: string | null;
  source: "material" | "announcement";
  title: string;
  description: string | null;
  alternateLink: string | null;
  publishedAt: string | null;
  updatedAt: string | null;
  attachments: ClassroomAttachmentDTO[];
};

export type ClassroomOverviewDTO = {
  courses: ClassroomCourseDTO[];
  materials: ClassroomMaterialDTO[];
  synchronizedAt: string;
};

export type ClassroomTaskSyncStatus =
  | "synced"
  | "fresh"
  | "not-connected"
  | "permission-required"
  | "unavailable";

export type ClassroomTaskSyncDTO = {
  status: ClassroomTaskSyncStatus;
  taskCount: number;
  synchronizedCount: number;
  synchronizedAt: string | null;
};
