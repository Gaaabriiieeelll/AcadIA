import { z } from "zod";

import { normalizeAndroidPairingCode } from "@/lib/android-widget-auth";
import { isAndroidWidgetEnabled } from "@/lib/android-widget-feature";

const pairingSchema = z.object({
  code: z.string().transform(normalizeAndroidPairingCode).pipe(z.string().length(8)),
  deviceName: z.string().trim().min(1).max(80),
  token: z.string().regex(/^[A-Za-z0-9_-]{43,128}$/),
});

function json(body: unknown, status = 200) {
  return Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(request: Request) {
  if (!isAndroidWidgetEnabled()) return json({ error: "not-found" }, 404);

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return json({ error: "invalid-request" }, 400);
  }

  const parsed = pairingSchema.safeParse(body);
  if (!parsed.success) return json({ error: "invalid-request" }, 400);

  const { activateAndroidWidgetCredential } = await import("@/data/android-widget");
  const activated = await activateAndroidWidgetCredential(parsed.data);
  if (!activated) return json({ error: "invalid-or-expired-code" }, 409);
  return json({ status: "connected" });
}
