export type AcademicAlertSeverity = "critical" | "warning" | "info";

export type AcademicAlertCategory =
  | "grades"
  | "attendance"
  | "tasks"
  | "calendar";

export type AcademicAlertDTO = {
  id: string;
  severity: AcademicAlertSeverity;
  category: AcademicAlertCategory;
  eyebrow: string;
  title: string;
  description: string;
  actionLabel: string;
  href: string;
  dateKey: string | null;
  dateLabel: string | null;
  accentColor: string | null;
  read: boolean;
};

export type AcademicAlertSummaryDTO = {
  total: number;
  critical: number;
  warning: number;
  info: number;
  academic: number;
  planning: number;
  unread: number;
  snoozed: number;
  hidden: number;
};

export type AcademicAlertPreferencesDTO = {
  targetAverage: number;
  minimumAttendance: number;
  gradesEnabled: boolean;
  attendanceEnabled: boolean;
  tasksEnabled: boolean;
  calendarEnabled: boolean;
  browserNotifications: boolean;
};

export type AcademicWhatsAppSettingsDTO = {
  enabled: boolean;
  phoneLastFour: string | null;
  consentAt: string | null;
  verifiedAt: string | null;
  lastTestAt: string | null;
  serviceConfigured: boolean;
};

export type AcademicBrowserPushSettingsDTO = {
  activeDeviceCount: number;
  publicKey: string | null;
  serviceConfigured: boolean;
};

export type BrowserPushSubscriptionInput = {
  endpoint: string;
  expirationTime: number | null;
  keys: {
    auth: string;
    p256dh: string;
  };
};

export type AcademicAlertHistoryStatus = "dismissed" | "snoozed" | "resolved";

export type AcademicAlertHistoryItemDTO = {
  id: string;
  alertKey: string;
  category: AcademicAlertCategory;
  severity: AcademicAlertSeverity;
  title: string;
  description: string;
  status: AcademicAlertHistoryStatus;
  occurredAt: string;
  snoozedUntil: string | null;
  href: string;
};

export type AcademicAlertCenterDTO = {
  alerts: AcademicAlertDTO[];
  summary: AcademicAlertSummaryDTO;
  todayDateKey: string;
  preferences: AcademicAlertPreferencesDTO;
  history: AcademicAlertHistoryItemDTO[];
};

export type AcademicAlertPreferenceFormField =
  | "targetAverage"
  | "minimumAttendance";

export type AcademicAlertPreferenceFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<AcademicAlertPreferenceFormField, string[]>>;
};

export type AcademicWhatsAppFormField = "phone" | "consent";

export type AcademicWhatsAppFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: Partial<Record<AcademicWhatsAppFormField, string[]>>;
};
