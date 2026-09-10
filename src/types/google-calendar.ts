export type GoogleCalendarConnectionStatus =
  | "not-connected"
  | "permission-required"
  | "connected"
  | "error";

export type GoogleCalendarStatusDTO = {
  status: GoogleCalendarConnectionStatus;
  accountEmail: string | null;
  calendarName: string | null;
  eventCount: number;
  lastSyncedAt: string | null;
  lastError: string | null;
};

export type GoogleCalendarSyncResult = {
  status: "success" | "permission-required" | "error";
  message: string;
  calendarName: string | null;
  eventCount: number;
  createdCount: number;
  updatedCount: number;
  deletedCount: number;
  unchangedCount: number;
};

export type GoogleCalendarSyncFormState = {
  status: "idle" | "success" | "error";
  message?: string;
};
