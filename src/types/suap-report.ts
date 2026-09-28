import type { SuapReportRow } from "@/lib/suap-report";

export type SuapReportImportRow = SuapReportRow & {
  targetSubjectId: string | null;
};

export type SuapReportImportResult = {
  status: "success" | "error";
  message: string;
  created?: number;
  updated?: number;
};
