import { getServerSession } from "next-auth";

import { getCurrentAccountExport } from "@/data/privacy";
import { authOptions } from "@/lib/auth";

export const dynamic = "force-dynamic";

function jsonResponse(body: unknown, status: number) {
  return Response.json(body, {
    status,
    headers: {
      "cache-control": "private, no-store, max-age=0",
      "x-content-type-options": "nosniff",
    },
  });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return jsonResponse({ error: "Não autorizado." }, 401);
  }

  try {
    const accountExport = await getCurrentAccountExport();
    const body = JSON.stringify({
      ...accountExport,
      sessionIdentity: {
        name: session.user.name ?? null,
        email: session.user.email ?? null,
      },
    }, null, 2);
    const date = new Date().toISOString().slice(0, 10);

    return new Response(body, {
      status: 200,
      headers: {
        "cache-control": "private, no-store, max-age=0",
        "content-disposition": `attachment; filename="acadia-dados-${date}.json"`,
        "content-type": "application/json; charset=utf-8",
        "x-content-type-options": "nosniff",
      },
    });
  } catch (error) {
    console.error("Falha ao exportar os dados da conta", error);
    return jsonResponse({ error: "Não foi possível gerar a exportação agora." }, 500);
  }
}
