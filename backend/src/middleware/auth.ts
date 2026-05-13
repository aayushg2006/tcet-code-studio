import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import { db } from "../firebase";
import type { UserRecord } from "../modules/user/user.model";
import { FirestoreUserRepository } from "../modules/user/user.repository";
import type { AuthenticatedUser, UserRole } from "../shared/types/auth";

type JwtPayload = {
  email?: string;
  role?: string;
  name?: string;
  uid?: string;
  department?: string;
  status?: string;
  exp?: number;
};

type CoeRole = "ADMIN" | "FACULTY" | "STUDENT" | "INDUSTRY";

const DEFAULT_FRONTEND_HOME = "http://localhost:5173";
const TOKEN_COOKIE_NAME = "coe_shared_token";
const ALLOWED_ROLES = new Set<CoeRole>(["ADMIN", "FACULTY", "STUDENT", "INDUSTRY"]);
const userRepository = new FirestoreUserRepository(db);

function normalizeRole(role: string | undefined): CoeRole | null {
  const normalized = role?.trim().toUpperCase();
  if (!normalized || !ALLOWED_ROLES.has(normalized as CoeRole)) {
    return null;
  }
  return normalized as CoeRole;
}

function getRequestUrl(req: Parameters<RequestHandler>[0]): string {
  const host = req.get("host");
  if (!host) {
    return req.originalUrl;
  }

  return `${req.protocol}://${host}${req.originalUrl}`;
}

function normalizeOrigin(origin: string): string {
  return origin.trim().toLowerCase().replace(/\/$/, "");
}

function resolveFrontendOrigin(req: Parameters<RequestHandler>[0]): string {
  const requestOrigin = req.get("origin");
  if (!requestOrigin) {
    return DEFAULT_FRONTEND_HOME;
  }

  const configuredOrigins = env.corsOrigins.map(normalizeOrigin);
  const allowedOrigins = new Set<string>([
    ...configuredOrigins,
    ...configuredOrigins
      .filter((origin) => origin.includes("localhost"))
      .map((origin) => origin.replace("localhost", "127.0.0.1")),
    normalizeOrigin(DEFAULT_FRONTEND_HOME),
    normalizeOrigin(DEFAULT_FRONTEND_HOME.replace("localhost", "127.0.0.1")),
  ]);

  const normalizedOrigin = normalizeOrigin(requestOrigin);
  if (!allowedOrigins.has(normalizedOrigin)) {
    return DEFAULT_FRONTEND_HOME;
  }

  return normalizedOrigin;
}

function buildApiSsoCallbackUrl(req: Parameters<RequestHandler>[0]): string {
  const host = req.get("host") ?? `${req.hostname || "localhost"}:3001`;
  const backendBaseUrl = `${req.protocol}://${host}`;
  const frontendOrigin = resolveFrontendOrigin(req);
  return `${backendBaseUrl}/api/auth/sso/callback?frontendOrigin=${encodeURIComponent(frontendOrigin)}`;
}

function buildLoginUrl(req: Parameters<RequestHandler>[0]): string {
  const loginHost = req.hostname || "localhost";
  const loginUrl = `${req.protocol}://${loginHost}:4000/login`;
  const callbackTarget = req.originalUrl.startsWith("/api/")
    ? buildApiSsoCallbackUrl(req)
    : getRequestUrl(req);
  return `${loginUrl}?callbackUrl=${encodeURIComponent(callbackTarget)}`;
}

function redirectToLogin(req: Parameters<RequestHandler>[0], res: Parameters<RequestHandler>[1]): void {
  const loginUrl = buildLoginUrl(req);
  const isSsoCallback = req.originalUrl.startsWith("/api/auth/sso/callback");

  if (req.originalUrl.startsWith("/api/") && !isSsoCallback) {
    res.status(401).json({
      message: "Authentication required.",
      loginUrl,
    });
    return;
  }

  res.redirect(302, loginUrl);
}

function buildJwtUser(payload: JwtPayload): AuthenticatedUser {
  if (!payload.email) {
    throw new Error("Invalid token payload");
  }

  const role = normalizeRole(payload.role);
  if (!role) {
    throw new Error("Invalid token role");
  }

  return {
    email: payload.email.trim().toLowerCase(),
    role: role as UserRole,
    name: payload.name,
    uid: payload.uid,
    department: payload.department,
    status: payload.status?.trim().toUpperCase() ?? "ACTIVE",
  };
}

function createDefaultUser(authUser: AuthenticatedUser, now: Date): UserRecord {
  return {
    email: authUser.email,
    role: authUser.role,
    name: authUser.name ?? null,
    uid: authUser.uid ?? null,
    isProfileComplete: false,
    rollNumber: null,
    department: authUser.department ?? null,
    semester: null,
    linkedInUrl: null,
    githubUrl: null,
    skills: [],
    rating: 0,
    score: 0,
    problemsSolved: 0,
    submissionCount: 0,
    acceptedSubmissionCount: 0,
    accuracy: 0,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
    lastAcceptedAt: null,
  };
}

export const authMiddleware: RequestHandler = async (req, res, next) => {
  try {
    const token = req.cookies?.[TOKEN_COOKIE_NAME];
    if (!token) {
      redirectToLogin(req, res);
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, env.COE_SHARED_TOKEN_SECRET, {
        algorithms: ["HS256"],
      }) as JwtPayload;
    } catch (verificationError) {
      if (verificationError instanceof jwt.TokenExpiredError) {
        res.clearCookie(TOKEN_COOKIE_NAME, { path: "/" });
        redirectToLogin(req, res);
        return;
      }

      if (
        verificationError instanceof jwt.JsonWebTokenError ||
        verificationError instanceof jwt.NotBeforeError
      ) {
        // Stale/corrupt cookies should trigger a clean re-login, not leave user stuck.
        res.clearCookie(TOKEN_COOKIE_NAME, { path: "/" });
        redirectToLogin(req, res);
        return;
      }

      throw verificationError;
    }

    const user = buildJwtUser(decoded);

    if (user.status === "PENDING") {
      res.status(403).json({ message: "Your account is pending approval." });
      return;
    }

    if (user.status === "REJECTED") {
      res.status(403).json({ message: "Your account has been rejected." });
      return;
    }

    const existingUser = await userRepository.getByEmail(user.email);
    const now = new Date();
    const resolvedUser =
      existingUser === null
        ? createDefaultUser(user, now)
        : {
            ...existingUser,
            role: user.role,
            updatedAt: now,
            lastLoginAt: now,
          };

    await userRepository.save(resolvedUser);
    req.user = {
      email: resolvedUser.email,
      role: resolvedUser.role,
      name: resolvedUser.name ?? undefined,
      uid: resolvedUser.uid ?? undefined,
      department: resolvedUser.department ?? undefined,
      status: user.status,
    };

    return next();
  } catch (error) {
    if (error instanceof Error && error.message.startsWith("Invalid token")) {
      res.status(403).json({ message: "Invalid authentication token." });
      return;
    }

    return next(error);
  }
};
