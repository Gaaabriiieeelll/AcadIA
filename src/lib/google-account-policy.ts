const ACADEMIC_DOMAIN = "@academico.ifpb.edu.br";

export function normalizeGoogleEmail(email: string) {
  return email.trim().toLocaleLowerCase("pt-BR");
}

export function isAcademicGoogleEmail(email: string) {
  return normalizeGoogleEmail(email).endsWith(ACADEMIC_DOMAIN);
}

function getAllowedGoogleEmails() {
  return new Set(
    (process.env.ALLOWED_EMAILS ?? "")
      .split(",")
      .map(normalizeGoogleEmail)
      .filter(Boolean),
  );
}

export function isGoogleEmailAllowed(email: string) {
  return getAllowedGoogleEmails().has(normalizeGoogleEmail(email));
}

export function isAnyGoogleEmailAllowed() {
  return process.env.ALLOW_ANY_GOOGLE_EMAIL === "true";
}

export function isGoogleAccessPolicyConfigured() {
  return isAnyGoogleEmailAllowed()
    || Boolean(process.env.ALLOWED_EMAILS?.trim());
}

export function isAuthorizedGoogleEmail(email: string) {
  if (isAnyGoogleEmailAllowed()) return true;
  if (
    isAcademicGoogleEmail(email)
    && process.env.ALLOW_ACADEMIC_EMAIL !== "true"
  ) {
    return false;
  }

  return isGoogleEmailAllowed(email);
}

export function isAuthorizedAcademicEmail(email: string) {
  return isAcademicGoogleEmail(email) && isAuthorizedGoogleEmail(email);
}
