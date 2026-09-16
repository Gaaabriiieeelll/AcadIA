import { getServerSession } from "next-auth";

import { authOptions } from "@/lib/auth";
import { EvolutionApiError, getEvolutionConnectionQrCode } from "@/lib/evolution-api";
import { canManageWhatsApp } from "@/lib/whatsapp-admin";

export const dynamic = "force-dynamic";

function jsonError(message: string, status: number) {
  return Response.json({ error: message }, {
    status,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) return jsonError("Não autorizado.", 401);
  if (!canManageWhatsApp(session.user.email)) {
    return jsonError("Acesso restrito ao administrador do WhatsApp.", 403);
  }

  try {
    const image = await getEvolutionConnectionQrCode();
    return new Response(image, {
      status: 200,
      headers: {
        "cache-control": "private, no-store, max-age=0",
        "content-disposition": "inline; filename=acadia-whatsapp-qr.png",
        "content-type": "image/png",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    const message = error instanceof EvolutionApiError
      ? error.message
      : "Não foi possível gerar o QR Code agora.";
    if (!(error instanceof EvolutionApiError)) {
      console.error("Falha ao gerar o QR Code da Evolution API", error);
    }
    return jsonError(message, 502);
  }
}
