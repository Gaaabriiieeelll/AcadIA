import "server-only";

import { db } from "@/lib/db";
import { GOOGLE_CALENDAR_APP_SCOPE } from "@/lib/google-classroom-scopes";
import { decryptServerSecret, encryptServerSecret } from "@/lib/secret-box";

const TOKEN_REFRESH_MARGIN_MS = 60_000;
const TOKEN_REQUEST_TIMEOUT_MS = 12_000;

type GoogleCalendarConnectionErrorCode =
  | "NOT_CONNECTED"
  | "MISSING_PERMISSION"
  | "AUTH_EXPIRED"
  | "UPSTREAM_FAILURE";

export class GoogleCalendarConnectionError extends Error {
  constructor(public readonly code: GoogleCalendarConnectionErrorCode) {
    super(code);
    this.name = "GoogleCalendarConnectionError";
  }
}

export function grantedScopesIncludeGoogleCalendar(
  grantedScopes: string,
  requiredScopes: readonly string[] = [GOOGLE_CALENDAR_APP_SCOPE],
) {
  const scopes = new Set(grantedScopes.split(/\s+/).filter(Boolean));
  return requiredScopes.every((scope) => scopes.has(scope));
}

export async function saveGoogleCalendarCredentials(
  acadiaGoogleSubject: string,
  account: {
    googleSubject: string;
    email: string;
  },
  credentials: {
    accessToken: string;
    refreshToken?: string;
    expiresAt?: Date;
    scope?: string;
  },
) {
  const user = await db.user.upsert({
    where: { googleSubject: acadiaGoogleSubject },
    create: { googleSubject: acadiaGoogleSubject },
    update: {},
    select: {
      id: true,
      googleCalendarCredential: {
        select: { accountGoogleSubject: true },
      },
    },
  });
  const accountChanged = Boolean(
    user.googleCalendarCredential
    && user.googleCalendarCredential.accountGoogleSubject !== account.googleSubject,
  );
  const encryptedRefreshToken = credentials.refreshToken
    ? encryptServerSecret(credentials.refreshToken)
    : undefined;

  await db.$transaction(async (transaction) => {
    if (accountChanged) {
      await transaction.googleCalendarIntegration.deleteMany({
        where: { userId: user.id },
      });
    }

    await transaction.googleCalendarCredential.upsert({
      where: { userId: user.id },
      create: {
        userId: user.id,
        accountGoogleSubject: account.googleSubject,
        accountEmail: account.email,
        encryptedAccessToken: encryptServerSecret(credentials.accessToken),
        encryptedRefreshToken,
        accessTokenExpiresAt: credentials.expiresAt ?? null,
        grantedScopes: credentials.scope ?? "",
      },
      update: {
        accountGoogleSubject: account.googleSubject,
        accountEmail: account.email,
        encryptedAccessToken: encryptServerSecret(credentials.accessToken),
        ...(encryptedRefreshToken
          ? { encryptedRefreshToken }
          : accountChanged
            ? { encryptedRefreshToken: null }
            : {}),
        accessTokenExpiresAt: credentials.expiresAt ?? null,
        grantedScopes: credentials.scope ?? "",
      },
    });
  });
}

async function refreshAccessToken(
  credentialId: string,
  encryptedRefreshToken: string,
) {
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!clientId || !clientSecret) {
    throw new GoogleCalendarConnectionError("AUTH_EXPIRED");
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
    throw new GoogleCalendarConnectionError("UPSTREAM_FAILURE");
  }

  if (!response.ok) {
    throw new GoogleCalendarConnectionError("AUTH_EXPIRED");
  }

  const token = await response.json() as {
    access_token?: string;
    expires_in?: number;
    scope?: string;
  };
  if (!token.access_token) {
    throw new GoogleCalendarConnectionError("AUTH_EXPIRED");
  }

  await db.googleCalendarCredential.update({
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

export async function getGoogleCalendarAccessToken(
  acadiaGoogleSubject: string,
) {
  const credential = await db.googleCalendarCredential.findFirst({
    where: { user: { googleSubject: acadiaGoogleSubject } },
    select: {
      id: true,
      encryptedAccessToken: true,
      encryptedRefreshToken: true,
      accessTokenExpiresAt: true,
      grantedScopes: true,
    },
  });
  if (!credential) {
    throw new GoogleCalendarConnectionError("NOT_CONNECTED");
  }
  if (!grantedScopesIncludeGoogleCalendar(credential.grantedScopes)) {
    throw new GoogleCalendarConnectionError("MISSING_PERMISSION");
  }

  const expiresAt = credential.accessTokenExpiresAt?.getTime();
  if (!expiresAt || expiresAt > Date.now() + TOKEN_REFRESH_MARGIN_MS) {
    return decryptServerSecret(credential.encryptedAccessToken);
  }
  if (!credential.encryptedRefreshToken) {
    throw new GoogleCalendarConnectionError("AUTH_EXPIRED");
  }

  return refreshAccessToken(credential.id, credential.encryptedRefreshToken);
}
