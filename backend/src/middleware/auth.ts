import type { RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { env } from "../config/env";
import {
  buildAuthenticatedUserFromMockSsoPayload,
  MOCK_SSO_TOKEN_COOKIE_NAME,
  verifyMockSsoToken,
} from "../modules/user/mock-sso";
import type { UserService } from "../modules/user/user.service";

type MiddlewareRequest = Parameters<RequestHandler>[0];
type MiddlewareResponse = Parameters<RequestHandler>[1];

const DEFAULT_FRONTEND_HOME = "http://localhost:5173";

function getRequestUrl(req: MiddlewareRequest): string {
  const host = req.get("host");
  if (!host) {
    return req.originalUrl;
  }

  return `${req.protocol}://${host}${req.originalUrl}`;
}

function normalizeOrigin(origin: string): string {
  return origin.trim().toLowerCase().replace(/\/$/, "");
}

function resolveFrontendOrigin(req: MiddlewareRequest): string {
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

function buildApiSsoCallbackUrl(req: MiddlewareRequest): string {
  const host = req.get("host") ?? `${req.hostname || "localhost"}:3001`;
  const backendBaseUrl = `${req.protocol}://${host}`;
  const frontendOrigin = resolveFrontendOrigin(req);
  return `${backendBaseUrl}/api/auth/sso/callback?frontendOrigin=${encodeURIComponent(frontendOrigin)}`;
}

function buildLoginUrl(req: MiddlewareRequest): string {
  const loginUrl = new URL("/login", env.COE_AUTH_BASE_URL).toString();
  const callbackTarget = req.originalUrl.startsWith("/api/") ? buildApiSsoCallbackUrl(req) : getRequestUrl(req);
  return `${loginUrl}?callbackUrl=${encodeURIComponent(callbackTarget)}`;
}

function redirectToLogin(req: MiddlewareRequest, res: MiddlewareResponse): void {
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

export function createAuthMiddleware(userService: Pick<UserService, "syncAuthenticatedUser">): RequestHandler {
  return async (req, res, next) => {
    try {
      const token = req.cookies?.[MOCK_SSO_TOKEN_COOKIE_NAME];
      if (!token) {
        redirectToLogin(req, res);
        return;
      }

      let authUser;
      try {
        authUser = buildAuthenticatedUserFromMockSsoPayload(verifyMockSsoToken(token));
      } catch (verificationError) {
        if (
          verificationError instanceof jwt.TokenExpiredError ||
          verificationError instanceof jwt.JsonWebTokenError ||
          verificationError instanceof jwt.NotBeforeError
        ) {
          res.clearCookie(MOCK_SSO_TOKEN_COOKIE_NAME, { path: "/" });
          redirectToLogin(req, res);
          return;
        }

        throw verificationError;
      }

      if (authUser.status !== "ACTIVE") {
        res.status(403).json({ message: `Account is ${authUser.status ?? "NOT_ACTIVE"}.` });
        return;
      }

      const resolvedUser = await userService.syncAuthenticatedUser(authUser);
      req.user = {
        email: resolvedUser.email,
        role: resolvedUser.role,
        name: resolvedUser.name ?? undefined,
        uid: resolvedUser.uid ?? undefined,
        department: resolvedUser.department ?? undefined,
        status: authUser.status,
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
}
