import { randomBytes } from "node:crypto";

import { getServerSession } from "next-auth";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import {
  GOOGLE_AUTH_SCOPE,
  GOOGLE_CALENDAR_AUTH_SCOPE,
} from "@/lib/google-classroom-scopes";

const OAUTH_STATE_COOKIE = "acadia_classroom_oauth_state";
const OAUTH_TARGET_COOKIE = "acadia_google_oauth_target";

function classroomCallbackUrl(request: NextRequest) {
  const applicationUrl = process.env.NEXTAUTH_URL ?? request.nextUrl.origin;
  return new URL("/api/classroom/callback", applicationUrl).toString();
}

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const googleCalendarTarget = request.nextUrl.searchParams.get("target") === "calendar";
  const clientId = process.env.AUTH_GOOGLE_ID;
  if (!clientId) {
    const path = googleCalendarTarget
      ? "/calendario?googleCalendar=not-configured"
      : "/materiais?classroom=not-configured";
    return NextResponse.redirect(new URL(path, request.url));
  }

  const state = randomBytes(32).toString("base64url");
  const authorizationUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authorizationUrl.search = new URLSearchParams({
    access_type: "offline",
    client_id: clientId,
    include_granted_scopes: "true",
    prompt: "consent select_account",
    redirect_uri: classroomCallbackUrl(request),
    response_type: "code",
    scope: googleCalendarTarget ? GOOGLE_CALENDAR_AUTH_SCOPE : GOOGLE_AUTH_SCOPE,
    state,
    hd: "academico.ifpb.edu.br",
  }).toString();

  const response = NextResponse.redirect(authorizationUrl);
  response.cookies.set(OAUTH_STATE_COOKIE, state, {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/classroom/callback",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  response.cookies.set(OAUTH_TARGET_COOKIE, googleCalendarTarget ? "calendar" : "classroom", {
    httpOnly: true,
    maxAge: 10 * 60,
    path: "/api/classroom/callback",
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
  return response;
}
