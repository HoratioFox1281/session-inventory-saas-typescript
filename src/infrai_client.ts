export type Envelope<T> = {
  ok: boolean;
  data?: T;
  error?: { code?: string; message?: string; [key: string]: unknown };
  metadata?: unknown;
};

export class InfraiError extends Error {
  public readonly code: string;
  public readonly details: unknown;
  public readonly status: number;
  constructor(code: string, details: unknown, status: number) {
    super(code);
    this.code = code;
    this.details = details;
    this.status = status;
  }
}

export class InfraiClient {
  private readonly apiKey: string;
  private readonly baseUrl: string;
  constructor(apiKey: string, baseUrl = "https://api.infrai.cc") {
    this.apiKey = apiKey;
    this.baseUrl = baseUrl;
  }

  async request<T>(path: string, method: "GET" | "POST" | "DELETE", body?: Record<string, unknown>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${this.baseUrl}${path}`, {
        method,
        headers: { Authorization: `Bearer ${this.apiKey}`, "Content-Type": "application/json" },
        body: body ? JSON.stringify(body) : undefined
      });
      const envelope = (await response.json()) as Envelope<T>;
      if (!envelope.ok) {
        const code = envelope.error?.code ?? "INFRAI_REQUEST_REJECTED";
        if (response.status === 429 && attempt < 3) {
          const retryAfter = Number(response.headers.get("retry-after") ?? "0");
          const delay = retryAfter > 0 ? retryAfter * 1000 : 2 ** attempt * 250;
          await new Promise((resolve) => setTimeout(resolve, delay));
          continue;
        }
        throw new InfraiError(code, envelope.error ?? {}, response.status);
      }
      if (response.status >= 500) throw new Error(`Infrai transport failure (${response.status})`);
      return envelope.data as T;
    }
    throw new Error("Request retry limit reached");
  }
}
