export type AndroidWidgetCredentialDTO = {
  id: string;
  deviceName: string;
  pairingExpiresAt: string;
  activatedAt: string | null;
  lastUsedAt: string | null;
  createdAt: string;
  status: "connected" | "pending" | "expired";
};

export type AndroidWidgetPairingFormState = {
  status: "idle" | "success" | "error";
  message?: string;
  pairingCode?: string;
  expiresAt?: string;
};

export type AndroidWidgetCommitmentDTO = {
  id: string;
  title: string;
  description: string | null;
  eventType: string;
  startDate: string;
  startTime: string | null;
  subjectName: string | null;
  color: string;
  href: string;
};
