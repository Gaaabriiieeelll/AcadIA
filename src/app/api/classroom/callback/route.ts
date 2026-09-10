import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { syncGoogleCalendarForGoogleSubject } from "@/data/google-calendar";
import { authOptions } from "@/lib/auth";
import { isAuthorizedAcademicEmail } from "@/lib/google-account-policy";
import { saveGoogleCalendarCredentials } from "@/lib/google-calendar-credentials";
import { saveGoogleClassroomCredentials } from "@/lib/google-classroom-credentials";
import {
  GOOGLE_AUTH_SCOPE,
  GOOGLE_CALENDAR_AUTH_SCOPE,
} from "@/lib/google-classroom-scopes";

const OAUTH_STATE_COOKIE = "acadia_classroom_oauth_state";
const OAUTH_TARGET_COOKIE = "acadia_google_oauth_target";
const TOKEN_REQUEST_TIMEOUT_MS = 12_000;

function classroomCallbackUrl(request: NextRequest) {
  const applicationUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  return new URL("/api/classroom/callback", applicationUrl).toString();
}

function materialsRedirect(request: NextRequest, status: string) {
  return new URL(`/materiais?classroom=${status}`, request.nextUrl.origin);
}

function calendarRedirect(request: NextRequest, status: string) {
  return new URL(`/calendario?googleCalendar=${status}`, request.nextUrl.origin);
}

function oauthRedirect(request: NextRequest, target: string, status: string) {
  return target === "calendar"
    ? calendarRedirect(request, status)
    : materialsRedirect(request, status);
}

function clearStateCookie(response: NextResponse) {
  response.cookies.set(OAUTH_STATE_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/api/classroom/callback",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(OAUTH_TARGET_COOKIE, "", {
    httpOnly: true,
    maxAge: 0,
    path: "/api/classroom/callback",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}

export async function GET(request: NextRequest) {
  const target = request.cookies.get(OAUTH_TARGET_COOKIE)?.value ?? "classroom";
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return clearStateCookie(NextResponse.redirect(new URL("/login", request.url)));
  }

  const searchParams = request.nextUrl.searchParams;
  const state = searchParams.get("state");
  const expectedState = request.cookies.get(OAUTH_STATE_COOKIE)?.value;

  if (!state || !expectedState || state !== expectedState) {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "invalid-state")),
    );
  }

  if (searchParams.get("error")) {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "denied")),
    );
  }

  const code = searchParams.get("code");
  const clientId = process.env.AUTH_GOOGLE_ID;
  const clientSecret = process.env.AUTH_GOOGLE_SECRET;
  if (!code || !clientId || !clientSecret) {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "not-configured")),
    );
  }

  let tokenResponse: Response;
  try {
    tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code,
        grant_type: "authorization_code",
        redirect_uri: classroomCallbackUrl(request),
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "token-timeout")),
    );
  }

  if (!tokenResponse.ok) {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "token-error")),
    );
  }

  const tokens = await tokenResponse.json() as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    scope?: string;
  };

  if (!tokens.access_token) {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "token-error")),
    );
  }

  let userInfoResponse: Response;
  try {
    userInfoResponse = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
      headers: { Authorization: `Bearer ${tokens.access_token}` },
      cache: "no-store",
      signal: AbortSignal.timeout(TOKEN_REQUEST_TIMEOUT_MS),
    });
  } catch {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "identity-error")),
    );
  }
  const userInfo = await userInfoResponse.json().catch(() => null) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
  } | null;
  const authorizedEmail = userInfo?.email?.trim().toLocaleLowerCase("pt-BR");
  if (
    !userInfoResponse.ok
    || !userInfo?.sub
    || !authorizedEmail
    || userInfo.email_verified === false
  ) {
    return clearStateCookie(
      NextResponse.redirect(oauthRedirect(request, target, "identity-error")),
    );
  }

  if (target === "calendar") {
    if (!isAuthorizedAcademicEmail(authorizedEmail)) {
      return clearStateCookie(
        NextResponse.redirect(calendarRedirect(request, "account-mismatch")),
      );
    }

    await saveGoogleCalendarCredentials(
      session.user.id,
      {
        googleSubject: userInfo.sub,
        email: authorizedEmail,
      },
      {
        accessToken: tokens.access_token,
        refreshToken: tokens.refresh_token,
        expiresAt: tokens.expires_in
          ? new Date(Date.now() + tokens.expires_in * 1000)
          : undefined,
        scope: tokens.scope ?? GOOGLE_CALENDAR_AUTH_SCOPE,
      },
    );
    const result = await syncGoogleCalendarForGoogleSubject(session.user.id);
    return clearStateCookie(
      NextResponse.redirect(calendarRedirect(
        request,
        result.status === "success" ? "connected" : "sync-error",
      )),
    );
  }

  if (!isAuthorizedAcademicEmail(authorizedEmail)) {
    return clearStateCookie(
      NextResponse.redirect(materialsRedirect(request, "account-mismatch")),
    );
  }

  await saveGoogleClassroomCredentials(session.user.id, {
    accessToken: tokens.access_token,
    refreshToken: tokens.refresh_token,
    expiresAt: tokens.expires_in
      ? new Date(Date.now() + tokens.expires_in * 1000)
      : undefined,
    scope: tokens.scope ?? GOOGLE_AUTH_SCOPE,
  });

  return clearStateCookie(
    NextResponse.redirect(materialsRedirect(request, "connected")),
  );
}
