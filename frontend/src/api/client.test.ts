import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, apiRequest, getApiBaseUrl, getMockHeadersForPath } from "@/api/client";

describe("api client", () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("resolves API base url", () => {
    expect(getApiBaseUrl()).toBeTruthy();
  });

  it("builds route-based mock headers", () => {
    const studentHeaders = getMockHeadersForPath("/student/problems");
    const facultyHeaders = getMockHeadersForPath("/faculty/dashboard");

    expect(studentHeaders["x-mock-role"]).toBe("STUDENT");
    expect(facultyHeaders["x-mock-role"]).toBe("FACULTY");
  });

  it("adds route-based headers and parses json response", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ ok: true }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );

    const response = await apiRequest<{ ok: boolean }>("/health", {
      pathname: "/student/dashboard",
    });

    expect(response.ok).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(1);

    const [, options] = fetchMock.mock.calls[0];
    const requestHeaders = options?.headers as Record<string, string>;
    expect(requestHeaders["x-mock-role"]).toBe("STUDENT");
  });

  it("normalizes backend error payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ message: "Validation failed" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      }),
    );

    let caughtError: unknown;
    try {
      await apiRequest("/api/submissions");
    } catch (error) {
      caughtError = error;
    }

    expect(caughtError).toBeInstanceOf(ApiError);
    expect(caughtError).toMatchObject({ status: 400, message: "Validation failed" });
  });
});
