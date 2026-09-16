import "server-only";

export function emailBelongsToAllowlist(
  email: string | null | undefined,
  rawAllowlist: string | null | undefined,
) {
  const normalizedEmail = email?.trim().toLowerCase();
  if (!normalizedEmail) return false;

  return (rawAllowlist ?? "")
    .split(",")
    .map((candidate) => candidate.trim().toLowerCase())
    .filter(Boolean)
    .includes(normalizedEmail);
}

export function canManageWhatsApp(email: string | null | undefined) {
  return emailBelongsToAllowlist(email, process.env.WHATSAPP_ADMIN_EMAILS);
}
