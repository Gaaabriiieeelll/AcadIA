import { timingSafeEqual } from "node:crypto";

function secureEquals(left: string, right: string) {
  const leftBuffer = Buffer.from(left);
  const rightBuffer = Buffer.from(right);

  return leftBuffer.length === rightBuffer.length
    && timingSafeEqual(leftBuffer, rightBuffer);
}

export function hasConfiguredJobSecret(secrets: Array<string | undefined>) {
  return secrets.some((secret) => Boolean(secret?.trim()));
}

export function isBearerRequestAuthorized(
  request: Request,
  secrets: Array<string | undefined>,
) {
  const authorization = request.headers.get("authorization") ?? "";

  return secrets.some((secret) => {
    const normalized = secret?.trim();
    return normalized ? secureEquals(authorization, `Bearer ${normalized}`) : false;
  });
}
