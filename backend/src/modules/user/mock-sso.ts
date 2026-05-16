import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { AuthenticatedUser, UserRole } from "../../shared/types/auth";

export const MOCK_SSO_TOKEN_COOKIE_NAME = "coe_shared_token";

export type MockSsoJwtPayload = {
  email?: string;
  role?: string;
  status?: string;
  exp?: number;
};

type MockSsoRole = "ADMIN" | "FACULTY" | "STUDENT" | "INDUSTRY";

const ALLOWED_ROLES = new Set<MockSsoRole>(["ADMIN", "FACULTY", "STUDENT", "INDUSTRY"]);

function mapMockSsoRoleToPlatformRole(role: MockSsoRole): UserRole {
  return role === "STUDENT" ? "STUDENT" : "FACULTY";
}

function normalizeMockSsoRole(role: string | undefined): MockSsoRole | null {
  const normalized = role?.trim().toUpperCase();
  if (!normalized || !ALLOWED_ROLES.has(normalized as MockSsoRole)) {
    return null;
  }

  return normalized as MockSsoRole;
}

export function verifyMockSsoToken(token: string): MockSsoJwtPayload {
  return jwt.verify(token, env.COE_SHARED_TOKEN_SECRET, {
    algorithms: ["HS256"],
  }) as MockSsoJwtPayload;
}

export function buildAuthenticatedUserFromMockSsoPayload(payload: MockSsoJwtPayload): AuthenticatedUser {
  if (!payload.email) {
    throw new Error("Invalid token payload");
  }

  const mockSsoRole = normalizeMockSsoRole(payload.role);
  if (!mockSsoRole) {
    throw new Error("Invalid token role");
  }

  return {
    email: payload.email.trim().toLowerCase(),
    role: mapMockSsoRoleToPlatformRole(mockSsoRole),
    status: payload.status?.trim().toUpperCase() ?? "ACTIVE",
  };
}
