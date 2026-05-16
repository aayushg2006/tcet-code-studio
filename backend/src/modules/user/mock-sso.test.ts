import { describe, expect, it } from "vitest";
import { buildAuthenticatedUserFromMockSsoPayload } from "./mock-sso";

describe("mock SSO auth mapping", () => {
  it.each([
    ["ADMIN", "FACULTY"],
    ["FACULTY", "FACULTY"],
    ["INDUSTRY", "FACULTY"],
    ["STUDENT", "STUDENT"],
  ] as const)("maps %s to %s", (mockSsoRole, platformRole) => {
    const authUser = buildAuthenticatedUserFromMockSsoPayload({
      email: `${mockSsoRole.toLowerCase()}@tcetmumbai.in`,
      role: mockSsoRole,
      status: "ACTIVE",
    });

    expect(authUser.role).toBe(platformRole);
  });
});
