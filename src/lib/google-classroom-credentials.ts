import "server-only";

import { db } from "@/lib/db";
import { GOOGLE_CLASSROOM_CORE_SCOPES } from "@/lib/google-classroom-scopes";
import { decryptServerSecret, encryptServerSecret } from "@/lib/secret-box";

const TOKEN_REFRESH_MARGIN_MS = 60_000;
const TOKEN_REQUEST_TIMEOUT_MS = 12_000;

type ClassroomConnectionErrorCode =
  | "NOT_CONNECTED"
  | "MISSING_PERMISSION"
  | "AUTH_EXPIRED"
  | "UPSTREAM_FAILURE";

export class ClassroomConnectionError extends Error {
  constructor(public readonly code: ClassroomConnectionErrorCode) {
    super(code);
    this.name = "ClassroomConnectionError";
  }
}

export function grantedScopesIncludeClassroom(
  grantedScopes: string,
  requiredScopes: readonly string[] = GOOGLE_CLASSROOM_CORE_SCOPES,
) {
  const scopes = new Set(grantedScopes.split(/\s+/).filter(Boolean));
  return requiredScopes.every((scope) => scopes.has(scope));
}

export async function saveGoogleClassroomCredentials(
  googleSubject: string,
  credentials: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
  },
) {
  const user = await db.user.upsert({
    where: { googleSubject },
    create: { googleSubject },
    update: {},
    select: {
      id: true,
      classroomCredential: { select: { grantedScopes: true } },
    },
  });
  const encryptedRefreshToken = credentials.refreshToken
    ? encryptServerSecret(credentials.refreshToken)
    : undefined;
  const grantedScopes = [
    ...(user.classroomCredential?.grantedScopes.split(/\s+/).filter(Boolean) ?? []),
    ...(credentials.scope?.split(/\s+/).filter(Boolean) ?? []),
  ];
  const mergedGrantedScopes = [...new Set(grantedScopes)].join(" ");

  await db.googleClassroomCredential.upsert({
    where: { userId: user.id },
    create: {
      userId: user.id,
      encryptedAccessToken: encryptServerSecret(credentials.accessToken),
      encryptedRefreshToken,
      accessTokenExpiresAt: credentials.expiresAt ?? null,
      grantedScopes: mergedGrantedScopes,
    },
    update: {
      encryptedAccessToken: encryptServerSecret(credentials.accessToken),
      ...(encryptedRefreshToken ? { encryptedRefreshToken } : {}),
      accessTokenExpiresAt: credentials.expiresAt ?? null,
      grantedScopes: mergedGrantedScopes,
    },
  });
}

async function refreshAccessToken(
  credentialId: string,
  encryptedRefreshToken: string,
) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;

  if (!clientId || !clientSecret) {
    throw new ClassroomConnectionError("AUTH_EXPIRED");
  }

  let response: Response;
  try {
    response = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "refresh_token",
        refresh_token: decryptServerSecret(encryptedRefreshToken),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch {
    throw new ClassroomConnectionError("UPSTREAM_FAILURE");
  }

  if (!response.ok) {
    throw new ClassroomConnectionError("AUTH_EXPIRED");
  }

  const token = await response.json() as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };

  if (!token.access_token) {
    throw new ClassroomConnectionError("AUTH_EXPIRED");
  }

  await db.googleClassroomCredential.update({
    where: { id: credentialId },
    data: {
      encryptedAccessToken: encryptServerSecret(token.access_token),
      accessTokenExpiresAt: token.expires_in
        ? new Date(Date.now() + token.expires_in * 1000)
        : null,
      ...(token.scope ? { grantedScopes: token.scope } : {}),
    },
  });

  return token.access_token;
}

export async function getGoogleClassroomAccessToken(
  googleSubject: string,
  requiredScopes: readonly string[] = GOOGLE_CLASSROOM_CORE_SCOPES,
) {
  const credential = await db.googleClassroomCredential.findFirst({
    where: { user: { googleSubject } },
    select: {
      id: true,
      encryptedAccessToken: true,
      encryptedRefreshToken: true,
      accessTokenExpiresAt: true,
      grantedScopes: true,
    },
  });

  if (!credential) {
    throw new ClassroomConnectionError("NOT_CONNECTED");
  }

  if (!grantedScopesIncludeClassroom(credential.grantedScopes, requiredScopes)) {
    throw new ClassroomConnectionError("MISSING_PERMISSION");
  }

  const expiresAt = credential.accessTokenExpiresAt?.getTime();
  if (!expiresAt || expiresAt > Date.now() + TOKEN_REFRESH_MARGIN_MS) {
    return decryptServerSecret(credential.encryptedAccessToken);
  }

  if (!credential.encryptedRefreshToken) {
    throw new ClassroomConnectionError("AUTH_EXPIRED");
  }

  return refreshAccessToken(credential.id, credential.encryptedRefreshToken);
}
