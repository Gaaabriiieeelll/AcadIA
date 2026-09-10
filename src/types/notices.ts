export const NOTICE_CATEGORIES = ["assistance", "research"] as const;
export const NOTICE_STATUSES = ["open", "action", "review", "result", "active", "closed"] as const;

export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number];
export type NoticeStatus = (typeof NOTICE_STATUSES)[number];

export type NoticeScheduleItemDTO = {
  label: string;
  dateLabel: string;
  startDate: string;
  endDate?: string;
  highlighted?: boolean;
};

export type NoticeChecklistItemDTO = {
  id: string;
  label: string;
  detail?: string;
};

export type NoticeDTO = {
  id: string;
  number: string;
  title: string;
  category: NoticeCategory;
  status: NoticeStatus;
  statusLabel: string;
  statusDetail: string;
  statusDate: string | null;
  summary: string;
  audience: string;
  benefit: string;
  eligibility: string[];
  documents: string[];
  steps: string[];
  schedule: NoticeScheduleItemDTO[];
  checklist: NoticeChecklistItemDTO[];
  caution: string;
  officialUrl: string;
  publishedAt: string;
  verifiedAt: string;
};

export type NoticeChecklistStateDTO = Record<string, string[]>;
