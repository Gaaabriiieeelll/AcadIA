import { getServerSession } from "next-auth";
import { NextResponse } from "next/server";

import { authOptions } from "@/lib/auth";
import { getCurrentAcademicProfile } from "@/data/academic-profile";
import { extractPdfTextLines, PdfReportError } from "@/lib/pdf-report";
import { parseSuapReport } from "@/lib/suap-report";

export const runtime = "nodejs";

const MAX_PDF_BYTES = 4 * 1024 * 1024;
const NO_STORE = { "Cache-Control": "private, no-store" };

function json(body: object, status = 200) {
  return NextResponse.json(body, { status, headers: NO_STORE });
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return json({ error: "Entre na sua conta para enviar o boletim." }, 401);
  }
  const profile = await getCurrentAcademicProfile();
  if (!profile) {
    return json({ error: "Complete seu perfil acadêmico antes de importar o boletim." }, 403);
  }

  const contentLength = Number(request.headers.get("content-length"));
  if (contentLength > MAX_PDF_BYTES + 64 * 1024) {
    return json({ error: "O PDF deve ter no máximo 4 MB." }, 413);
  }
  if (!request.headers.get("content-type")?.startsWith("multipart/form-data")) {
    return json({ error: "Envie um arquivo PDF." }, 400);
  }

  try {
    const form = await request.formData();
    const file = form.get("report");
    if (!(file instanceof File) || !file.name.toLowerCase().endsWith(".pdf")) {
      return json({ error: "Selecione um boletim em formato PDF." }, 400);
    }
    if (file.size === 0 || file.size > MAX_PDF_BYTES) {
      return json({ error: "O PDF deve ter entre 1 byte e 4 MB." }, 413);
    }

    const data = await file.arrayBuffer();
    const header = new TextDecoder("ascii").decode(data.slice(0, 1024));
    if (!header.includes("%PDF-")) {
      return json({ error: "O arquivo selecionado não é um PDF válido." }, 400);
    }

    const lines = await extractPdfTextLines(data);
    const documentText = lines.map((line) => line.text).join(" ")
      .normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
    if (!documentText.includes("BOLETIM DE NOTAS INDIVIDUAL") || !documentText.includes("SUAP")) {
      return json({ error: "Envie o boletim de notas individual gerado pelo SUAP." }, 422);
    }
    const preview = parseSuapReport(lines);
    if (!preview.registrationNumber) {
      return json({ error: "Não consegui identificar a matrícula no boletim." }, 422);
    }
    if (
      preview.registrationNumber !== profile.registrationNumber.replace(/\D/g, "")
    ) {
      return json({
        error: "A matrícula do boletim não corresponde à matrícula do seu perfil acadêmico.",
      }, 422);
    }
    if (preview.rows.length === 0) {
      return json({
        error: "Não encontrei disciplinas no PDF. Use o boletim original de notas do SUAP com texto selecionável.",
      }, 422);
    }
    if (preview.rows.length > 50) {
      return json({ error: "O boletim tem disciplinas demais para uma importação." }, 422);
    }

    return json({
      rows: preview.rows,
      skippedRows: preview.skippedRows,
      period: preview.period,
    });
  } catch (error) {
    if (error instanceof PdfReportError) {
      return json({ error: error.message }, 422);
    }
    console.error("Falha ao ler boletim PDF", error instanceof Error ? error.name : "Erro desconhecido");
    return json({ error: "Não foi possível ler o PDF. Confira se ele foi gerado pelo SUAP." }, 422);
  }
}
