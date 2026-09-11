import { isAndroidWidgetEnabled } from "@/lib/android-widget-feature";

function notFound() {
  return Response.json(
    { error: "not-found" },
    { status: 404, headers: { "Cache-Control": "no-store" } },
  );
}

function unauthorized() {
  return Response.json(
    { error: "unauthorized" },
    {
      status: 401,
      headers: {
        "Cache-Control": "no-store",
        "WWW-Authenticate": "Bearer realm=\"AcadIA Android Widget\"",
      },
    },
  );
}

export async function GET(request: Request) {
  if (!isAndroidWidgetEnabled()) return notFound();

  const authorization = request.headers.get("authorization") ?? "";
  const match = /^Bearer\s+([A-Za-z0-9_-]{43,128})$/i.exec(authorization);
  if (!match) return unauthorized();

  const {
    authenticateAndroidWidgetToken,
    getOpenCommitmentsForAndroidWidget,
  } = await import("@/data/android-widget");
  const identity = await authenticateAndroidWidgetToken(match[1]);
  if (!identity) return unauthorized();
  const commitments = await getOpenCommitmentsForAndroidWidget(identity.userId);

  return Response.json(
    {
      version: 1,
      updatedAt: new Date().toISOString(),
      commitments,
    },
    { headers: { "Cache-Control": "private, no-store" } },
  );
}
