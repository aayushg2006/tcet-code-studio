import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { AppError } from "../shared/errors/app-error";
import type { AuthenticatedUser, UserRole } from "../shared/types/auth";

type JwtPayload = {
  email?: string;
  role?: string;
  name?: string;
  uid?: string;
  department?: string;
  status?: string;
};

const DEFAULT_MOCK_USER: AuthenticatedUser = {
  email: env.MOCK_AUTH_DEFAULT_EMAIL,
  role: env.MOCK_AUTH_DEFAULT_ROLE,
  name: env.MOCK_AUTH_DEFAULT_NAME,
  uid: env.MOCK_AUTH_DEFAULT_UID,
  department: env.MOCK_AUTH_DEFAULT_DEPARTMENT,
  status: "ACTIVE",
};

function normalizeRole(role: string | undefined): UserRole {
  return role?.toUpperCase() === "FACULTY" ? "FACULTY" : "STUDENT";
}

function firstHeaderValue(value: string | string[] | undefined): string | undefined {
  if (Array.isArray(value)) {
    return value[0];
  }

  return value;
}

function buildMockUser(headers: Record<string, string | string[] | undefined>): AuthenticatedUser {
  return {
    email: firstHeaderValue(headers["x-mock-email"])?.trim() || DEFAULT_MOCK_USER.email,
    role: normalizeRole(firstHeaderValue(headers["x-mock-role"])),
    name: firstHeaderValue(headers["x-mock-name"])?.trim() || DEFAULT_MOCK_USER.name,
    uid: firstHeaderValue(headers["x-mock-uid"])?.trim() || DEFAULT_MOCK_USER.uid,
    department: firstHeaderValue(headers["x-mock-department"])?.trim() || DEFAULT_MOCK_USER.department,
    status: "ACTIVE",
  };
}

function buildJwtUser(payload: JwtPayload): AuthenticatedUser {
  if (!payload.email) {
    throw new AppError(403, "Invalid token payload");
  }

  return {
    email: payload.email,
    role: normalizeRole(payload.role),
    name: payload.name,
    uid: payload.uid,
    department: payload.department,
    status: payload.status ?? "ACTIVE",
  };
}

export const authMiddleware: RequestHandler = (req, _res, next) => {
  try {
    const authMode = env.AUTH_MODE;

    if (authMode === "mock") {
      req.user = buildMockUser(req.headers);
      return next();
    }

    const token = req.cookies?.coe_shared_token;
    if (!token) {
      throw new AppError(401, "Not logged in");
    }

    const decoded = jwt.verify(token, env.COE_SHARED_TOKEN_SECRET) as JwtPayload;
    const user = buildJwtUser(decoded);

    if (user.status !== "ACTIVE") {
      throw new AppError(403, "Inactive user");
    }

    req.user = user;
    return next();
  } catch (error) {
    return next(error);
  }
};
