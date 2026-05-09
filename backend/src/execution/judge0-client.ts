import { Buffer } from "node:buffer";

const REQUEST_TIMEOUT_MS = 15_000;

export interface Judge0Language {
  id: number;
  name: string;
}

export interface Judge0SubmissionRequest {
  source_code: string;
  language_id: number;
  stdin: string;
  expected_output: string;
  cpu_time_limit: number;
  wall_time_limit: number;
  memory_limit: number;
  enable_network: boolean;
  redirect_stderr_to_stdout: boolean;
  base64_encoded?: boolean;
}

interface Judge0Status {
  id: number;
  description: string;
}

export interface Judge0SubmissionResponse {
  stdout: string | null;
  stderr: string | null;
  compile_output: string | null;
  message: string | null;
  time: string | null;
  memory: number | null;
  status: Judge0Status;
}

export class Judge0ClientError extends Error {
  readonly code = "INTERNAL_ERROR" as const;
  readonly response?: { data?: unknown; status?: number };

  constructor(message = "Judge0 request failed.", response?: { data?: unknown; status?: number }) {
    super(message);
    this.name = "Judge0ClientError";
    this.response = response;
  }
}

function isJudge0Language(value: unknown): value is Judge0Language {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Judge0Language>;
  return typeof candidate.id === "number" && typeof candidate.name === "string";
}

function isJudge0SubmissionResponse(value: unknown): value is Judge0SubmissionResponse {
  if (typeof value !== "object" || value === null) {
    return false;
  }

  const candidate = value as Partial<Judge0SubmissionResponse>;
  const status = candidate.status as Partial<Judge0Status> | undefined;

  return (
    (candidate.stdout === null || typeof candidate.stdout === "string") &&
    (candidate.stderr === null || typeof candidate.stderr === "string") &&
    (candidate.compile_output === null || typeof candidate.compile_output === "string") &&
    (candidate.message === null || typeof candidate.message === "string") &&
    (candidate.time === null || typeof candidate.time === "string") &&
    (candidate.memory === null || typeof candidate.memory === "number") &&
    typeof status?.id === "number" &&
    typeof status.description === "string"
  );
}

export class Judge0Client {
  private readonly baseUrl = process.env.JUDGE0_BASE_URL?.trim() ?? "";
  private readonly apiKey = process.env.JUDGE0_API_KEY?.trim() ?? "";
  private languagesPromise: Promise<Judge0Language[]> | null = null;

  usesApiKey(): boolean {
    return this.apiKey.length > 0;
  }

  async getLanguages(): Promise<Judge0Language[]> {
    if (!this.languagesPromise) {
      const request = this.requestJson<Judge0Language[]>("/languages", {
        validate: (value): value is Judge0Language[] => Array.isArray(value) && value.every(isJudge0Language),
      });

      this.languagesPromise = request.catch((error: unknown) => {
        const judge0Error = error as { response?: { data?: unknown }; message?: string };
        console.error("JUDGE0_SYSTEM_ERROR:", judge0Error.response?.data || judge0Error.message);
        this.languagesPromise = null;
        throw error;
      });
    }

    return this.languagesPromise;
  }

  async createSubmission(payload: Judge0SubmissionRequest): Promise<Judge0SubmissionResponse> {
    const encodedPayload: Judge0SubmissionRequest = {
      ...payload,
      source_code: this.encodeBase64(payload.source_code),
      stdin: this.encodeBase64(payload.stdin),
      expected_output: this.encodeBase64(payload.expected_output),
      base64_encoded: true,
    };

    const response = await this.requestJson<Judge0SubmissionResponse>("/submissions?base64_encoded=true&wait=true", {
      method: "POST",
      body: JSON.stringify(encodedPayload),
      validate: isJudge0SubmissionResponse,
    });

    return this.decodeSubmissionResponse(response);
  }

  private async requestJson<T>(
    path: string,
    options: {
      method?: string;
      body?: string;
      validate: (value: unknown) => value is T;
    },
  ): Promise<T> {
    if (!this.baseUrl) {
      throw new Judge0ClientError("Judge0 base URL is not configured.");
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

    try {
      const response = await fetch(this.buildUrl(path), {
        method: options.method ?? "GET",
        headers: this.buildHeaders(),
        body: options.body,
        signal: controller.signal,
      });

      const rawPayload = await response.text();
      const payload = this.parsePayload(rawPayload);

      if (!response.ok) {
        throw new Judge0ClientError(
          this.extractApiErrorMessage(payload, response.status) ??
            `Judge0 request failed with status ${response.status}.`,
          { data: payload, status: response.status },
        );
      }

      if (!options.validate(payload)) {
        throw new Judge0ClientError("Judge0 returned an unexpected response payload.", {
          data: payload,
          status: response.status,
        });
      }

      return payload;
    } catch (error) {
      const judge0Error = error as { response?: { data?: unknown }; message?: string };
      console.error("JUDGE0_SYSTEM_ERROR:", judge0Error.response?.data || judge0Error.message);

      if (error instanceof Judge0ClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new Judge0ClientError("Judge0 request timed out.");
      }

      throw new Judge0ClientError(error instanceof Error ? error.message : "Judge0 request failed.");
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(path: string): string {
    return new URL(path, `${this.baseUrl.replace(/\/+$/, "")}/`).toString();
  }

  private buildHeaders(): Record<string, string> {
    if (!this.usesApiKey()) {
      return {
        "Content-Type": "application/json",
      };
    }

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      "X-RapidAPI-Key": this.apiKey,
    };

    try {
      const hostname = new URL(this.baseUrl).hostname;
      headers["X-RapidAPI-Host"] = hostname;
    } catch (error) {
      const judge0Error = error as { response?: { data?: unknown }; message?: string };
      console.error("JUDGE0_SYSTEM_ERROR:", judge0Error.response?.data || judge0Error.message);
    }

    return headers;
  }

  private parsePayload(rawPayload: string): unknown {
    if (!rawPayload) {
      return null;
    }

    try {
      return JSON.parse(rawPayload) as unknown;
    } catch {
      return rawPayload;
    }
  }

  private extractApiErrorMessage(payload: unknown, status: number): string | null {
    if (typeof payload === "string" && payload.trim().length > 0) {
      return `Judge0 request failed with status ${status}: ${payload}`;
    }

    if (typeof payload === "object" && payload !== null) {
      const candidate = payload as { message?: unknown; error?: unknown };

      if (typeof candidate.message === "string" && candidate.message.trim().length > 0) {
        return `Judge0 request failed with status ${status}: ${candidate.message}`;
      }

      if (typeof candidate.error === "string" && candidate.error.trim().length > 0) {
        return `Judge0 request failed with status ${status}: ${candidate.error}`;
      }
    }

    return null;
  }

  private encodeBase64(value: string): string {
    return Buffer.from(value, "utf8").toString("base64");
  }

  private decodeBase64(value: string | null): string | null {
    if (value === null) {
      return null;
    }

    try {
      return Buffer.from(value, "base64").toString("utf8");
    } catch {
      return value;
    }
  }

  private decodeSubmissionResponse(response: Judge0SubmissionResponse): Judge0SubmissionResponse {
    return {
      ...response,
      stdout: this.decodeBase64(response.stdout),
      stderr: this.decodeBase64(response.stderr),
      compile_output: this.decodeBase64(response.compile_output),
      message: this.decodeBase64(response.message),
    };
  }
}
