import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import type { AuthenticatedUser, UserRole } from "../../shared/types/auth";

export const COE_SHARED_TOKEN_COOKIE_NAME = "coe_shared_token";

export type CoeJwtPayload = {
  email?: string;
  role?: string;
  status?: string;
  exp?: number;
};

type PortalRole = "ADMIN" | "FACULTY" | "STUDENT" | "INDUSTRY";

const ALLOWED_ROLES = new Set<PortalRole>(["ADMIN", "FACULTY", "STUDENT", "INDUSTRY"]);

function mapPortalRoleToPlatformRole(role: PortalRole): UserRole {
  return role === "FACULTY" || role === "ADMIN" ? "FACULTY" : "STUDENT";
}

function normalizePortalRole(role: string | undefined): PortalRole | null {
  const normalized = role?.trim().toUpperCase();
  if (!normalized || !ALLOWED_ROLES.has(normalized as PortalRole)) {
    return null;
  }

  return normalized as PortalRole;
}

export function verifyCoeSharedToken(token: string): CoeJwtPayload {
  return jwt.verify(token, env.COE_SHARED_TOKEN_SECRET, {
    algorithms: ["HS256"],
  }) as CoeJwtPayload;
}

export function buildAuthenticatedUserFromCoePayload(payload: CoeJwtPayload): AuthenticatedUser {
  if (!payload.email) {
    throw new Error("Invalid token payload");
  }

  const portalRole = normalizePortalRole(payload.role);
  if (!portalRole) {
    throw new Error("Invalid token role");
  }

  return {
    email: payload.email.trim().toLowerCase(),
    role: mapPortalRoleToPlatformRole(portalRole),
    status: payload.status?.trim().toUpperCase() ?? "ACTIVE",
  };
}
