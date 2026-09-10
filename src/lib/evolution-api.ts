import "server-only";

type EvolutionConfiguration = {
  baseUrl: string;
  apiKey: string;
  instanceName: string;
};

type EvolutionSendResponse = {
  key?: {
    id?: string;
  };
  status?: string;
};

type EvolutionQrResponse = {
  base64?: string;
  qrcode?: {
    base64?: string;
  };
};

export class EvolutionApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "EvolutionApiError";
  }
}

function optionalConfiguration(): EvolutionConfiguration | null {
  const baseUrl = process.env.EVOLUTION_API_URL?.trim().replace(/\/+$/, "");
  const apiKey = process.env.EVOLUTION_API_KEY?.trim();
  const instanceName = process.env.EVOLUTION_INSTANCE_NAME?.trim();

  if (!baseUrl || !apiKey || !instanceName) return null;

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(baseUrl);
  } catch {
    return null;
  }

  if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") return null;
  return { baseUrl, apiKey, instanceName };
}

function requiredConfiguration() {
  const configuration = optionalConfiguration();
  if (!configuration) {
    throw new EvolutionApiError(
      "A Evolution API ainda não foi configurada no servidor.",
    );
  }
  return configuration;
}

function responseErrorMessage(payload: unknown, status: number) {
  if (!payload || typeof payload !== "object") {
    return `A Evolution API respondeu com o status ${status}.`;
  }

  const body = payload as Record<string, unknown>;
  const nestedResponse = body.response;
  const nestedMessage = nestedResponse && typeof nestedResponse === "object"
    ? (nestedResponse as Record<string, unknown>).message
    : null;
  const candidate = nestedMessage ?? body.message ?? body.error;

  if (Array.isArray(candidate)) {
    return candidate.filter((item): item is string => typeof item === "string").join(" ").slice(0, 300)
      || `A Evolution API respondeu com o status ${status}.`;
  }
  if (typeof candidate === "string" && candidate.trim()) return candidate.trim().slice(0, 300);
  return `A Evolution API respondeu com o status ${status}.`;
}

async function parseJson(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return null;
  }
}

export function isEvolutionApiConfigured() {
  return optionalConfiguration() !== null;
}

export async function getEvolutionConnectionQrCode() {
  const configuration = requiredConfiguration();
  const endpoint = `${configuration.baseUrl}/instance/connect/${encodeURIComponent(configuration.instanceName)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      headers: { apikey: configuration.apiKey },
      cache: "no-store",
      signal: AbortSignal.timeout(30_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new EvolutionApiError("A Evolution API demorou demais para gerar o QR Code.");
    }
    throw new EvolutionApiError("Não foi possível conectar à Evolution API.");
  }

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new EvolutionApiError(responseErrorMessage(payload, response.status));
  }

  const result = (payload ?? {}) as EvolutionQrResponse;
  const dataUrl = result.base64 ?? result.qrcode?.base64;
  const match = dataUrl?.match(/^data:image\/png;base64,([A-Za-z0-9+/=]+)$/);
  if (!match?.[1]) {
    throw new EvolutionApiError(
      "A instância já pode estar conectada ou o QR Code ainda não foi gerado.",
    );
  }

  const image = Buffer.from(match[1], "base64");
  if (image.length === 0 || image.length > 1_000_000) {
    throw new EvolutionApiError("A Evolution API retornou um QR Code inválido.");
  }
  return image;
}

export async function sendEvolutionTextMessage({
  number,
  text,
}: {
  number: string;
  text: string;
}) {
  const configuration = requiredConfiguration();
  const endpoint = `${configuration.baseUrl}/message/sendText/${encodeURIComponent(configuration.instanceName)}`;

  let response: Response;
  try {
    response = await fetch(endpoint, {
      method: "POST",
      headers: {
        apikey: configuration.apiKey,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        number,
        text,
        linkPreview: false,
      }),
      cache: "no-store",
      signal: AbortSignal.timeout(15_000),
    });
  } catch (error) {
    if (error instanceof Error && error.name === "TimeoutError") {
      throw new EvolutionApiError("A Evolution API demorou demais para responder.");
    }
    throw new EvolutionApiError("Não foi possível conectar à Evolution API.");
  }

  const payload = await parseJson(response);
  if (!response.ok) {
    throw new EvolutionApiError(responseErrorMessage(payload, response.status));
  }

  const result = (payload ?? {}) as EvolutionSendResponse;
  return {
    messageId: result.key?.id ?? null,
    status: result.status ?? "accepted",
  };
}
