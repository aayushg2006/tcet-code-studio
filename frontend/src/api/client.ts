import type { ApiErrorPayload } from "@/api/types";

const DEFAULT_API_BASE_URL = "http://localhost:3000";
const DEFAULT_STUDENT_PROFILE = "student1";

const API_BASE_URL =
  (import.meta.env.VITE_API_BASE_URL as string | undefined)?.trim() || DEFAULT_API_BASE_URL;

const STUDENT_PROFILE =
  ((import.meta.env.VITE_MOCK_STUDENT as string | undefined)?.trim().toLowerCase() || DEFAULT_STUDENT_PROFILE) ===
  "student2"
    ? "student2"
    : "student1";

export class ApiError extends Error {
  status: number;
  details?: unknown;

  constructor(payload: ApiErrorPayload) {
    super(payload.message);
    this.name = "ApiError";
    this.status = payload.status;
    this.details = payload.details;
  }
}

function resolveRoleFromPath(pathname: string): "STUDENT" | "FACULTY" | null {
  if (pathname.startsWith("/faculty")) {
    return "FACULTY";
  }

  if (pathname.startsWith("/student")) {
    return "STUDENT";
  }

  return null;
}

function buildDevMockHeaders(pathname: string): Record<string, string> {
  const role = resolveRoleFromPath(pathname);

  if (role === "FACULTY") {
    return {
      "x-mock-role": "FACULTY",
      "x-mock-email": "faculty1@tcetmumbai.in",
      "x-mock-name": "Prof. Mehta",
    };
  }

  if (role === "STUDENT") {
    if (STUDENT_PROFILE === "student2") {
      return {
        "x-mock-role": "STUDENT",
        "x-mock-email": "student2@tcetmumbai.in",
        "x-mock-name": "Student Two",
      };
    }

    return {
      "x-mock-role": "STUDENT",
      "x-mock-email": "student1@tcetmumbai.in",
      "x-mock-name": "Student One",
    };
  }

  return {};
}

export type ApiRequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  query?: Record<string, string | number | undefined | null>;
  body?: unknown;
  pathname?: string;
  headers?: Record<string, string>;
  responseType?: "json" | "text";
};

function buildQueryString(query?: ApiRequestOptions["query"]): string {
  if (!query) {
    return "";
  }

  const params = new URLSearchParams();
  Object.entries(query).forEach(([key, value]) => {
    if (value !== undefined && value !== null && String(value).trim() !== "") {
      params.set(key, String(value));
    }
  });

  const encoded = params.toString();
  return encoded ? `?${encoded}` : "";
}

async function parseErrorPayload(response: Response): Promise<ApiErrorPayload> {
  try {
    const data = await response.json();

    if (data && typeof data === "object") {
      const message =
        typeof (data as { message?: unknown }).message === "string"
          ? (data as { message: string }).message
          : `Request failed with status ${response.status}`;
      return {
        status: response.status,
        message,
        details: data,
      };
    }
  } catch {
    // ignore parse error
  }

  return {
    status: response.status,
    message: `Request failed with status ${response.status}`,
  };
}

export async function apiRequest<T>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  const queryString = buildQueryString(options.query);
  const pathname =
    options.pathname ||
    (typeof window !== "undefined" && typeof window.location?.pathname === "string"
      ? window.location.pathname
      : "/");

  const devHeaders =
    import.meta.env.DEV || import.meta.env.MODE === "development" ? buildDevMockHeaders(pathname) : {};

  const headers: Record<string, string> = {
    ...devHeaders,
    ...(options.headers ?? {}),
  };

  const isJsonBody = options.body !== undefined;
  if (isJsonBody) {
    headers["Content-Type"] = "application/json";
  }

  const response = await fetch(`${API_BASE_URL}${path}${queryString}`, {
    method: options.method ?? "GET",
    credentials: "include",
    headers,
    body: isJsonBody ? JSON.stringify(options.body) : undefined,
  });

  if (!response.ok) {
    throw new ApiError(await parseErrorPayload(response));
  }

  if (options.responseType === "text") {
    return (await response.text()) as T;
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return (await response.json()) as T;
}

export function getApiBaseUrl(): string {
  return API_BASE_URL;
}

export function getMockHeadersForPath(pathname: string): Record<string, string> {
  return buildDevMockHeaders(pathname);
}
