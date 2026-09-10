import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

function contentSecurityPolicy(nonce: string) {
  const developmentScriptPolicy = process.env.NODE_ENV === "development"
    ? " 'unsafe-eval'"
    : "";
  const developmentConnectPolicy = process.env.NODE_ENV === "development"
    ? " ws: wss:"
    : "";

  return `
    default-src 'self';
    script-src 'self' 'nonce-${nonce}' 'strict-dynamic'${developmentScriptPolicy};
    script-src-attr 'none';
    style-src 'self' 'unsafe-inline';
    img-src 'self' blob: data:;
    font-src 'self';
    connect-src 'self'${developmentConnectPolicy};
    object-src 'none';
    base-uri 'self';
    form-action 'self';
    frame-ancestors 'none';
    frame-src 'none';
    worker-src 'self' blob:;
    manifest-src 'self';
  `.replace(/\s{2,}/g, " ").trim();
}

export function proxy(request: NextRequest) {
  const nonce = Buffer.from(crypto.randomUUID()).toString("base64");
  const policy = contentSecurityPolicy(nonce);
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("Content-Security-Policy", policy);
  requestHeaders.set("x-nonce", nonce);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  response.headers.set("Content-Security-Policy", policy);
  return response;
}

export const config = {
  matcher: [{
    source: "/((?!api|_next/static|_next/image|acadia-logo.jpeg|icon.jpeg|apple-icon.jpeg|favicon.ico|manifest.webmanifest|sw.js|sitemap.xml|robots.txt).*)",
    missing: [
      { type: "header", key: "next-router-prefetch" },
      { type: "header", key: "purpose", value: "prefetch" },
    ],
  }],
};
