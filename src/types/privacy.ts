export type PrivacyActionState = {
  status: "idle" | "success" | "error";
  message?: string;
  fieldErrors?: {
    email?: string[];
    confirmation?: string[];
  };
};

export type AccountPrivacyOverviewDTO = {
  accountCreatedAt: string;
  aiConsent: {
    granted: boolean;
    grantedAt: string | null;
    version: string;
  };
  classroom: {
    connected: boolean;
    lastSyncAt: string | null;
  };
  whatsapp: {
    enabled: boolean;
    phoneLastFour: string | null;
  };
};
