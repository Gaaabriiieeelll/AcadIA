import "server-only";

import { requireCurrentIdentity } from "@/data/current-user";
import {
  ClassroomConnectionError,
  getGoogleClassroomAccessToken,
  grantedScopesIncludeClassroom,
} from "@/lib/google-classroom-credentials";
import { db } from "@/lib/db";
import { GOOGLE_CLASSROOM_SCOPES } from "@/lib/google-classroom-scopes";
import type {
  ClassroomAttachmentDTO,
  ClassroomCourseDTO,
  ClassroomMaterialDTO,
  ClassroomOverviewDTO,
  ClassroomTaskSyncDTO,
} from "@/types/google-classroom";

const CLASSROOM_API_URL = "https://classroom.googleapis.com/v1";
const CLASSROOM_REQUEST_TIMEOUT_MS = 12_000;
const TASK_SYNC_INTERVAL_MS = 10 * 60 * 1000;

type ClassroomApiErrorCode = "FORBIDDEN" | "UPSTREAM_FAILURE";

export class ClassroomApiError extends Error {
  constructor(public readonly code: ClassroomApiErrorCode) {
    super(code);
    this.name = "ClassroomApiError";
  }
}

type GoogleCourse = {
  id: string;
  name: string;
  section?: string;
  alternateLink?: string;
};

type GoogleTeacher = {
  userId: string;
  profile?: {
    emailAddress?: string;
    name?: {
      fullName?: string;
      givenName?: string;
      familyName?: string;
    };
  };
};

type CurrentSubject = {
  id: string;
  name: string;
  academicCode: string | null;
};

type GoogleCourseWork = {
  id: string;
  title: string;
  description?: string;
  alternateLink?: string;
  updateTime?: string;
  dueDate?: {
    year?: number;
    month?: number;
    day?: number;
  };
  dueTime?: {
    hours?: number;
    minutes?: number;
    seconds?: number;
  };
};

type GoogleStudentSubmission = {
  courseWorkId: string;
  state?: "NEW" | "CREATED" | "TURNED_IN" | "RETURNED" | "RECLAIMED_BY_STUDENT";
  late?: boolean;
  updateTime?: string;
};

type GoogleMaterial = {
  driveFile?: {
    driveFile?: {
      title?: string;
      alternateLink?: string;
    };
  };
  youtubeVideo?: {
    title?: string;
    alternateLink?: string;
  };
  link?: {
    title?: string;
    url?: string;
  };
  form?: {
    title?: string;
    formUrl?: string;
  };
};

type GoogleCourseWorkMaterial = {
  id: string;
  title: string;
  description?: string;
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  materials?: GoogleMaterial[];
};

type GoogleAnnouncement = {
  id: string;
  text?: string;
  alternateLink?: string;
  creationTime?: string;
  updateTime?: string;
  materials?: GoogleMaterial[];
};

async function classroomFetch<T>(path: string, accessToken: string) {
  let response: Response;
  try {
    response = await fetch(`${CLASSROOM_API_URL}${path}`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
      signal: AbortSignal.timeout(CLASSROOM_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ClassroomApiError("UPSTREAM_FAILURE");
  }

  if (response.status === 401) {
    throw new ClassroomConnectionError("AUTH_EXPIRED");
  }

  if (response.status === 403) {
    throw new ClassroomApiError("FORBIDDEN");
  }

  if (!response.ok) {
    throw new ClassroomApiError("UPSTREAM_FAILURE");
  }

  return response.json() as Promise<T>;
}

async function listActiveCourses(accessToken: string) {
  const courses: GoogleCourse[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({
      studentId: "me",
      courseStates: "ACTIVE",
      pageSize: "100",
    });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await classroomFetch<{
      courses?: GoogleCourse[];
      nextPageToken?: string;
    }>(`/courses?${query}`, accessToken);
    courses.push(...(response.courses ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return courses;
}

async function listCourseTeachers(courseId: string, accessToken: string) {
  const teachers: GoogleTeacher[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100" });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await classroomFetch<{
      teachers?: GoogleTeacher[];
      nextPageToken?: string;
    }>(`/courses/${encodeURIComponent(courseId)}/teachers?${query}`, accessToken);
    teachers.push(...(response.teachers ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return teachers;
}

function teacherName(teacher: GoogleTeacher) {
  const profileName = teacher.profile?.name;
  const fullName = profileName?.fullName?.trim();
  if (fullName) return fullName;

  const composedName = [profileName?.givenName, profileName?.familyName]
    .filter(Boolean)
    .join(" ")
    .trim();
  return composedName || "Professor(a) da turma";
}

function normalizeCourseLabel(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLocaleLowerCase("pt-BR")
    .replace(/\bii\b/g, "2")
    .replace(/\bi\b/g, "1")
    .replace(/[^a-z0-9]+/g, " ")
    .trim()
    .replace(/\s+/g, " ");
}

function subjectLabels(subject: CurrentSubject) {
  const nameWithoutGroup = subject.name.replace(/\s*[\u00b7-]\s*g[12]\s*$/iu, "");
  const normalizedName = normalizeCourseLabel(nameWithoutGroup);
  const withoutInstrumental = normalizedName
    .replace(/\binstrumental\b/g, "")
    .replace(/\s+/g, " ")
    .trim();

  return normalizedName === withoutInstrumental
    ? [normalizedName]
    : [normalizedName, withoutInstrumental];
}

function findCurrentSubjectForCourse(
  course: GoogleCourse,
  subjects: CurrentSubject[],
) {
  const normalizedCourse = normalizeCourseLabel(course.name);

  return subjects.find((subject) => {
    const normalizedCode = subject.academicCode
      ? normalizeCourseLabel(subject.academicCode)
      : null;

    if (normalizedCode && normalizedCourse.includes(normalizedCode)) return true;
    return subjectLabels(subject).some((label) =>
      label.length >= 4 && normalizedCourse.includes(label),
    );
  });
}

async function listCourseWork(courseId: string, accessToken: string) {
  const courseWork: GoogleCourseWork[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({
      courseWorkStates: "PUBLISHED",
      orderBy: "dueDate asc,updateTime desc",
      pageSize: "100",
    });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await classroomFetch<{
      courseWork?: GoogleCourseWork[];
      nextPageToken?: string;
    }>(`/courses/${encodeURIComponent(courseId)}/courseWork?${query}`, accessToken);
    courseWork.push(...(response.courseWork ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return courseWork;
}

async function listOwnStudentSubmissions(courseId: string, accessToken: string) {
  const submissions: GoogleStudentSubmission[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({ userId: "me", pageSize: "100" });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await classroomFetch<{
      studentSubmissions?: GoogleStudentSubmission[];
      nextPageToken?: string;
    }>(
      `/courses/${encodeURIComponent(courseId)}/courseWork/-/studentSubmissions?${query}`,
      accessToken,
    );
    submissions.push(...(response.studentSubmissions ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return submissions;
}

async function listCourseWorkMaterials(courseId: string, accessToken: string) {
  const materials: GoogleCourseWorkMaterial[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100", orderBy: "updateTime desc" });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await classroomFetch<{
      courseWorkMaterial?: GoogleCourseWorkMaterial[];
      nextPageToken?: string;
    }>(
      `/courses/${encodeURIComponent(courseId)}/courseWorkMaterials?${query}`,
      accessToken,
    );
    materials.push(...(response.courseWorkMaterial ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return materials;
}

async function listAnnouncements(courseId: string, accessToken: string) {
  const announcements: GoogleAnnouncement[] = [];
  let pageToken: string | undefined;

  do {
    const query = new URLSearchParams({ pageSize: "100", orderBy: "updateTime desc" });
    if (pageToken) query.set("pageToken", pageToken);

    const response = await classroomFetch<{
      announcements?: GoogleAnnouncement[];
      nextPageToken?: string;
    }>(
      `/courses/${encodeURIComponent(courseId)}/announcements?${query}`,
      accessToken,
    );
    announcements.push(...(response.announcements ?? []));
    pageToken = response.nextPageToken;
  } while (pageToken);

  return announcements;
}

function toAttachments(materials: GoogleMaterial[] | undefined): ClassroomAttachmentDTO[] {
  return (materials ?? []).flatMap<ClassroomAttachmentDTO>((material) => {
    if (material.driveFile?.driveFile?.alternateLink) {
      return [{
        type: "drive" as const,
        title: material.driveFile.driveFile.title ?? "Arquivo do Google Drive",
        url: material.driveFile.driveFile.alternateLink,
      }];
    }
    if (material.youtubeVideo?.alternateLink) {
      return [{
        type: "youtube" as const,
        title: material.youtubeVideo.title ?? "Vídeo do YouTube",
        url: material.youtubeVideo.alternateLink,
      }];
    }
    if (material.link?.url) {
      return [{
        type: "link" as const,
        title: material.link.title ?? "Link",
        url: material.link.url,
      }];
    }
    if (material.form?.formUrl) {
      return [{
        type: "form" as const,
        title: material.form.title ?? "Formulário",
        url: material.form.formUrl,
      }];
    }
    return [];
  });
}

function announcementTitle(text: string | undefined) {
  if (!text?.trim()) return "Aviso da turma";
  const firstLine = text.trim().split(/\r?\n/)[0];
  return firstLine.length > 90 ? `${firstLine.slice(0, 87)}…` : firstLine;
}

function materialTimestamp(material: ClassroomMaterialDTO) {
  return Date.parse(material.updatedAt ?? material.publishedAt ?? "") || 0;
}

function saoPauloDateKey(date = new Date()) {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(date);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${value.year}-${value.month}-${value.day}`;
}

function classroomDeadline(
  dueDate: NonNullable<GoogleCourseWork["dueDate"]>,
  dueTime: GoogleCourseWork["dueTime"],
) {
  const year = dueDate.year;
  const month = dueDate.month;
  const day = dueDate.day;
  if (!year || !month || !day) return null;

  const rawDateKey = [year, month, day]
    .map((part, index) => index === 0 ? String(part) : String(part).padStart(2, "0"))
    .join("-");
  if (!dueTime) return { dateKey: rawDateKey, time: null };

  const instant = new Date(Date.UTC(
    year,
    month - 1,
    day,
    dueTime.hours ?? 0,
    dueTime.minutes ?? 0,
    dueTime.seconds ?? 0,
  ));
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Sao_Paulo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
  }).formatToParts(instant);
  const value = Object.fromEntries(parts.map((part) => [part.type, part.value]));

  return {
    dateKey: `${value.year}-${value.month}-${value.day}`,
    time: `${value.hour}:${value.minute}`,
  };
}

function importedTaskPriority(dateKey: string, late: boolean | undefined) {
  if (late || dateKey <= saoPauloDateKey()) return "HIGH" as const;

  const today = Date.parse(`${saoPauloDateKey()}T12:00:00.000Z`);
  const deadline = Date.parse(`${dateKey}T12:00:00.000Z`);
  return (deadline - today) / 86400000 <= 7 ? "MEDIUM" as const : "LOW" as const;
}

function validTimestamp(value: string | undefined) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

async function classroomTaskCount(userId: string) {
  return db.academicTask.count({
    where: {
      source: "GOOGLE_CLASSROOM",
      subject: { userId },
    },
  });
}

function syncErrorStatus(error: unknown): ClassroomTaskSyncDTO["status"] {
  if (error instanceof ClassroomConnectionError) {
    if (error.code === "NOT_CONNECTED") return "not-connected";
    if (error.code === "UPSTREAM_FAILURE") return "unavailable";
    return "permission-required";
  }
  return "unavailable";
}

export async function getCurrentClassroomTaskSyncStatus(): Promise<ClassroomTaskSyncDTO> {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      id: true,
      classroomCredential: {
        select: {
          grantedScopes: true,
          lastTaskSyncAt: true,
        },
      },
    },
  });

  if (!user) {
    return {
      status: "unavailable",
      taskCount: 0,
      synchronizedCount: 0,
      synchronizedAt: null,
    };
  }

  const taskCount = await classroomTaskCount(user.id);
  const credential = user.classroomCredential;
  if (!credential) {
    return {
      status: "not-connected",
      taskCount,
      synchronizedCount: 0,
      synchronizedAt: null,
    };
  }

  return {
    status: grantedScopesIncludeClassroom(credential.grantedScopes)
      ? "fresh"
      : "permission-required",
    taskCount,
    synchronizedCount: 0,
    synchronizedAt: credential.lastTaskSyncAt?.toISOString() ?? null,
  };
}

export async function syncCurrentClassroomTasks(
  { force = false }: { force?: boolean } = {},
): Promise<ClassroomTaskSyncDTO> {
  const { googleSubject } = await requireCurrentIdentity();
  const user = await db.user.findUnique({
    where: { googleSubject },
    select: {
      id: true,
      classroomCredential: {
        select: { lastTaskSyncAt: true },
      },
      subjects: {
        select: { id: true, name: true, academicCode: true },
      },
    },
  });

  if (!user) {
    return {
      status: "unavailable",
      taskCount: 0,
      synchronizedCount: 0,
      synchronizedAt: null,
    };
  }

  const existingTaskCount = await classroomTaskCount(user.id);
  const lastSyncAt = user.classroomCredential?.lastTaskSyncAt ?? null;

  let accessToken: string;
  try {
    accessToken = await getGoogleClassroomAccessToken(googleSubject);
  } catch (error) {
    console.error("Falha ao sincronizar atividades do Google Classroom", error);
    return {
      status: syncErrorStatus(error),
      taskCount: existingTaskCount,
      synchronizedCount: 0,
      synchronizedAt: lastSyncAt?.toISOString() ?? null,
    };
  }

  if (
    !force
    && lastSyncAt
    && lastSyncAt.getTime() > Date.now() - TASK_SYNC_INTERVAL_MS
  ) {
    return {
      status: "fresh",
      taskCount: existingTaskCount,
      synchronizedCount: 0,
      synchronizedAt: lastSyncAt.toISOString(),
    };
  }

  try {
    const activeCourses = await listActiveCourses(accessToken);
    const currentCourses = activeCourses.flatMap((course) => {
      const subject = findCurrentSubjectForCourse(course, user.subjects);
      return subject ? [{ course, subject }] : [];
    });
    const courseItems = await Promise.all(
      currentCourses.map(async ({ course, subject }) => {
        const [courseWork, submissions] = await Promise.all([
          listCourseWork(course.id, accessToken),
          listOwnStudentSubmissions(course.id, accessToken),
        ]);
        const submissionsByCourseWork = new Map(
          submissions.map((submission) => [submission.courseWorkId, submission]),
        );

        return courseWork.flatMap((item) => {
          if (!item.dueDate) return [];
          const deadline = classroomDeadline(item.dueDate, item.dueTime);
          if (!deadline) return [];

          const submission = submissionsByCourseWork.get(item.id);
          const completed = submission?.state === "TURNED_IN"
            || submission?.state === "RETURNED";

          return [{
            subjectId: subject.id,
            courseId: course.id,
            courseWorkId: item.id,
            title: item.title.trim().slice(0, 140),
            description: item.description?.trim().slice(0, 500) || null,
            dueDate: new Date(`${deadline.dateKey}T12:00:00.000Z`),
            dueDateKey: deadline.dateKey,
            dueTime: deadline.time,
            priority: importedTaskPriority(deadline.dateKey, submission?.late),
            completedAt: completed
              ? validTimestamp(submission?.updateTime) ?? validTimestamp(item.updateTime)
              : null,
            sourceUrl: item.alternateLink ?? course.alternateLink ?? null,
            sourceUpdatedAt: validTimestamp(item.updateTime),
          }];
        });
      }),
    );
    const items = courseItems.flat();
    const synchronizedAt = new Date();

    await db.$transaction(
      [
        ...items.map((item) => db.academicTask.upsert({
          where: {
            subjectId_classroomCourseId_classroomCourseWorkId: {
              subjectId: item.subjectId,
              classroomCourseId: item.courseId,
              classroomCourseWorkId: item.courseWorkId,
            },
          },
          create: {
            subjectId: item.subjectId,
            title: item.title,
            description: item.description,
            dueDate: item.dueDate,
            dueTime: item.dueTime,
            priority: item.priority,
            completedAt: item.completedAt,
            source: "GOOGLE_CLASSROOM",
            classroomCourseId: item.courseId,
            classroomCourseWorkId: item.courseWorkId,
            sourceUrl: item.sourceUrl,
            sourceUpdatedAt: item.sourceUpdatedAt,
          },
          update: {
            title: item.title,
            description: item.description,
            dueDate: item.dueDate,
            dueTime: item.dueTime,
            priority: item.priority,
            completedAt: item.completedAt,
            sourceUrl: item.sourceUrl,
            sourceUpdatedAt: item.sourceUpdatedAt,
          },
          select: { id: true },
        })),
        db.googleClassroomCredential.update({
          where: { userId: user.id },
          data: { lastTaskSyncAt: synchronizedAt },
          select: { id: true },
        }),
      ],
      { maxWait: 10_000, timeout: 30_000 },
    );

    return {
      status: "synced",
      taskCount: await classroomTaskCount(user.id),
      synchronizedCount: items.length,
      synchronizedAt: synchronizedAt.toISOString(),
    };
  } catch (error) {
    console.error("Falha ao sincronizar atividades do Google Classroom", error);
    return {
      status: syncErrorStatus(error),
      taskCount: existingTaskCount,
      synchronizedCount: 0,
      synchronizedAt: lastSyncAt?.toISOString() ?? null,
    };
  }
}

export async function getCurrentClassroomOverview(): Promise<ClassroomOverviewDTO> {
  const { googleSubject } = await requireCurrentIdentity();
  const accessToken = await getGoogleClassroomAccessToken(
    googleSubject,
    GOOGLE_CLASSROOM_SCOPES,
  );
  const [activeCourses, academicUser] = await Promise.all([
    listActiveCourses(accessToken),
    db.user.findUnique({
      where: { googleSubject },
      select: {
        subjects: {
          select: { id: true, name: true, academicCode: true },
        },
      },
    }),
  ]);
  const currentSubjects = academicUser?.subjects ?? [];
  const googleCourses = currentSubjects.length > 0
    ? activeCourses.flatMap((course) => {
        const subject = findCurrentSubjectForCourse(course, currentSubjects);
        return subject ? [{ course, subjectId: subject.id }] : [];
      })
    : activeCourses.map((course) => ({ course, subjectId: null }));
  const courseContent = await Promise.all(
    googleCourses.map(async ({ course, subjectId }) => {
      const [courseMaterials, announcements, teacherContacts] = await Promise.all([
        listCourseWorkMaterials(course.id, accessToken),
        listAnnouncements(course.id, accessToken),
        listCourseTeachers(course.id, accessToken)
          .then((teachers) => ({ teachers, restricted: false }))
          .catch((error: unknown) => {
            if (error instanceof ClassroomApiError && error.code === "FORBIDDEN") {
              return { teachers: [], restricted: true };
            }
            throw error;
          }),
      ]);

      const materials: ClassroomMaterialDTO[] = [
        ...courseMaterials.map((material) => ({
          id: `material:${course.id}:${material.id}`,
          courseId: course.id,
          courseName: course.name,
          subjectId,
          source: "material" as const,
          title: material.title,
          description: material.description?.trim() || null,
          alternateLink: material.alternateLink ?? course.alternateLink ?? null,
          publishedAt: material.creationTime ?? null,
          updatedAt: material.updateTime ?? null,
          attachments: toAttachments(material.materials),
        })),
        ...announcements.map((announcement) => ({
          id: `announcement:${course.id}:${announcement.id}`,
          courseId: course.id,
          courseName: course.name,
          subjectId,
          source: "announcement" as const,
          title: announcementTitle(announcement.text),
          description: announcement.text?.trim() || null,
          alternateLink: announcement.alternateLink ?? course.alternateLink ?? null,
          publishedAt: announcement.creationTime ?? null,
          updatedAt: announcement.updateTime ?? null,
          attachments: toAttachments(announcement.materials),
        })),
      ];

      return {
        courseId: course.id,
        materials,
        teachers: teacherContacts.teachers.map((teacher) => ({
          id: teacher.userId,
          name: teacherName(teacher),
          email: teacher.profile?.emailAddress?.trim().toLocaleLowerCase("pt-BR") || null,
        })),
        teacherContactsRestricted: teacherContacts.restricted,
      };
    }),
  );
  const contentByCourse = new Map(
    courseContent.map((content) => [content.courseId, content]),
  );
  const courses: ClassroomCourseDTO[] = googleCourses.map(({ course, subjectId }) => ({
    id: course.id,
    name: course.name,
    section: course.section?.trim() || null,
    subjectId,
    alternateLink: course.alternateLink ?? null,
    teachers: contentByCourse.get(course.id)?.teachers ?? [],
    teacherContactsRestricted:
      contentByCourse.get(course.id)?.teacherContactsRestricted ?? false,
  }));

  return {
    courses,
    materials: courseContent.flatMap((content) => content.materials).sort((left, right) =>
      materialTimestamp(right) - materialTimestamp(left),
    ),
    synchronizedAt: new Date().toISOString(),
  };
}
