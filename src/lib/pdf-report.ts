import "server-only";

import { getDocument } from "pdfjs-dist/legacy/build/pdf.mjs";

export type PdfTextLine = {
  page: number;
  y: number;
  text: string;
  items: Array<{ x: number; width: number; text: string }>;
};

export class PdfReportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "PdfReportError";
  }
}

const MAX_PAGES = 8;

export async function extractPdfTextLines(data: ArrayBuffer): Promise<PdfTextLine[]> {
  const loadingTask = getDocument({
    data: new Uint8Array(data),
    useSystemFonts: true,
  });

  try {
    const document = await loadingTask.promise;
    if (document.numPages > MAX_PAGES) {
      throw new PdfReportError(`O boletim deve ter no máximo ${MAX_PAGES} páginas.`);
    }

    const lines: PdfTextLine[] = [];
    for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber++) {
      const page = await document.getPage(pageNumber);
      const content = await page.getTextContent();
      const rows: Array<{ y: number; items: Array<{ x: number; width: number; text: string }> }> = [];

      for (const item of content.items) {
        if (!("str" in item) || !item.str.trim()) continue;
        const x = item.transform[4];
        const y = item.transform[5];
        const row = rows.find((candidate) => Math.abs(candidate.y - y) <= 2);
        const textItem = { x, width: item.width, text: item.str };
        if (row) row.items.push(textItem);
        else rows.push({ y, items: [textItem] });
      }

      rows.sort((left, right) => right.y - left.y);
      for (const row of rows) {
        row.items.sort((left, right) => left.x - right.x);
        let text = "";
        let previousEnd = Number.NEGATIVE_INFINITY;
        for (const item of row.items) {
          if (text && item.x - previousEnd > 1.5) text += " ";
          text += item.text;
          previousEnd = Math.max(previousEnd, item.x + item.width);
        }
        const normalized = text.replace(/\s+/g, " ").trim();
        if (normalized) {
          lines.push({ page: pageNumber, y: row.y, text: normalized, items: row.items });
        }
      }

      page.cleanup();
    }

    if (lines.length === 0) {
      throw new PdfReportError(
        "O PDF não contém texto selecionável. Envie o boletim original gerado pelo SUAP.",
      );
    }

    return lines;
  } finally {
    await loadingTask.destroy();
  }
}
