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

  constructor(message = "Judge0 request failed.") {
    super(message);
    this.name = "Judge0ClientError";
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

  async getLanguages(): Promise<Judge0Language[]> {
    if (!this.languagesPromise) {
      const request = this.requestJson<Judge0Language[]>("/languages", {
        validate: (value): value is Judge0Language[] => Array.isArray(value) && value.every(isJudge0Language),
      });

      this.languagesPromise = request.catch((error: unknown) => {
        this.languagesPromise = null;
        throw error;
      });
    }

    return this.languagesPromise;
  }

  async createSubmission(payload: Judge0SubmissionRequest): Promise<Judge0SubmissionResponse> {
    return this.requestJson<Judge0SubmissionResponse>("/submissions?wait=true", {
      method: "POST",
      body: JSON.stringify(payload),
      validate: isJudge0SubmissionResponse,
    });
  }

  private async requestJson<T>(
    path: string,
    options: {
      method?: string;
      body?: string;
      validate: (value: unknown) => value is T;
    },
  ): Promise<T> {
    if (!this.baseUrl || !this.apiKey) {
      throw new Judge0ClientError("Judge0 credentials are not configured.");
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

      const payload = (await response.json().catch(() => null)) as unknown;

      if (!response.ok || !options.validate(payload)) {
        throw new Judge0ClientError();
      }

      return payload;
    } catch (error) {
      if (error instanceof Judge0ClientError) {
        throw error;
      }

      if (error instanceof Error && error.name === "AbortError") {
        throw new Judge0ClientError("Judge0 request timed out.");
      }

      throw new Judge0ClientError();
    } finally {
      clearTimeout(timeout);
    }
  }

  private buildUrl(path: string): string {
    return new URL(path, `${this.baseUrl.replace(/\/+$/, "")}/`).toString();
  }

  private buildHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      Accept: "application/json",
      "Content-Type": "application/json",
      "X-Auth-Token": this.apiKey,
    };

    try {
      const hostname = new URL(this.baseUrl).hostname;

      if (hostname.endsWith(".rapidapi.com")) {
        headers["X-RapidAPI-Key"] = this.apiKey;
        headers["X-RapidAPI-Host"] = hostname;
      }
    } catch {
      // Invalid URLs are handled as request failures by fetch.
    }

    return headers;
  }
}
