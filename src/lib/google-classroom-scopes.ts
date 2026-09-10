export const GOOGLE_CLASSROOM_CORE_SCOPES = [
  "https://www.googleapis.com/auth/classroom.courses.readonly",
  "https://www.googleapis.com/auth/classroom.courseworkmaterials.readonly",
  "https://www.googleapis.com/auth/classroom.announcements.readonly",
  "https://www.googleapis.com/auth/classroom.student-submissions.me.readonly",
] as const;

export const GOOGLE_CLASSROOM_TEACHER_EMAIL_SCOPE =
  "https://www.googleapis.com/auth/classroom.profile.emails";

export const GOOGLE_CALENDAR_APP_SCOPE =
  "https://www.googleapis.com/auth/calendar.app.created";

export const GOOGLE_CLASSROOM_SCOPES = [
  ...GOOGLE_CLASSROOM_CORE_SCOPES,
  GOOGLE_CLASSROOM_TEACHER_EMAIL_SCOPE,
] as const;

export const GOOGLE_AUTH_SCOPE = [
  "openid",
  "email",
  "profile",
  ...GOOGLE_CLASSROOM_SCOPES,
].join(" ");

export const GOOGLE_CALENDAR_AUTH_SCOPE = [
  "openid",
  "email",
  "profile",
  GOOGLE_CALENDAR_APP_SCOPE,
].join(" ");
