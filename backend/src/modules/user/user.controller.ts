import { Buffer } from "node:buffer";
import type { Request, Response } from "express";
import jwt from "jsonwebtoken";
import { env } from "../../config/env";
import { firebaseAuth } from "../../firebase";
import type { UserRecord } from "./user.model";
import type { UserRepository } from "./user.repository";
import type { UserService } from "./user.service";
import { toUserProfileResponse } from "./user.model";
import {
  buildAuthenticatedUserFromCoePayload,
  COE_SHARED_TOKEN_COOKIE_NAME,
  verifyCoeSharedToken,
} from "./coe-sso";
import { parseUpdateProfilePayload } from "./user.validator";

const DEFAULT_FRONTEND_HOME = "http://localhost:5173";
const FIREBASE_CUSTOM_TOKEN_COOKIE_NAME = "firebase_custom_token";

function normalizeOrigin(origin: string): string {
  return origin.trim().toLowerCase().replace(/\/$/, "");
}

function resolveAllowedOrigins(): Set<string> {
  const configuredOrigins = env.corsOrigins.map(normalizeOrigin);
  return new Set<string>([
    normalizeOrigin(DEFAULT_FRONTEND_HOME),
    ...configuredOrigins,
    ...configuredOrigins
      .filter((origin) => origin.includes("localhost"))
      .map((origin) => origin.replace("localhost", "127.0.0.1")),
    normalizeOrigin(DEFAULT_FRONTEND_HOME.replace("localhost", "127.0.0.1")),
  ]);
}

function resolveSafeFrontendOrigin(candidateOrigin: unknown): string {
  if (typeof candidateOrigin !== "string" || candidateOrigin.trim() === "") {
    return DEFAULT_FRONTEND_HOME;
  }

  const normalizedOrigin = normalizeOrigin(candidateOrigin);
  return resolveAllowedOrigins().has(normalizedOrigin) ? normalizedOrigin : DEFAULT_FRONTEND_HOME;
}

function getDashboardPathForRole(role: "STUDENT" | "FACULTY"): string {
  return role === "FACULTY" ? "/faculty/dashboard" : "/student/dashboard";
}

function hasInvalidStudentUid(uid: string | null): boolean {
  const normalizedUid = uid?.trim() ?? "";
  return normalizedUid === "" || normalizedUid.toLowerCase().includes("mock");
}

function shouldRedirectToCompleteProfile(user: Pick<UserRecord, "role" | "isProfileComplete" | "uid">): boolean {
  if (user.role !== "STUDENT") {
    return !user.isProfileComplete;
  }

  return !user.isProfileComplete || hasInvalidStudentUid(user.uid);
}

function buildFirebaseUid(email: string): string {
  return `coe-${Buffer.from(email).toString("base64url").slice(0, 100)}`;
}

async function ensureFirebaseAuthUser(params: {
  email: string;
  role: "STUDENT" | "FACULTY";
}): Promise<string> {
  const firebaseUid = buildFirebaseUid(params.email);
  const userPayload = {
    email: params.email,
    disabled: false,
  };

  try {
    await firebaseAuth.updateUser(firebaseUid, userPayload);
  } catch (error) {
    const code = (error as { code?: string }).code;
    if (code !== "auth/user-not-found") {
      throw error;
    }

    await firebaseAuth.createUser({
      uid: firebaseUid,
      ...userPayload,
    });
  }

  return firebaseAuth.createCustomToken(firebaseUid, {
    role: params.role,
    email: params.email,
  });
}

interface UserControllerDependencies {
  userService: UserService;
  userRepository: UserRepository;
}

export function createUserController({ userService, userRepository }: UserControllerDependencies) {
  return {
    async handleSsoCallback(req: Request, res: Response): Promise<void> {
      try {
        const token = req.cookies?.[COE_SHARED_TOKEN_COOKIE_NAME];
        if (!token) {
          res.status(401).json({ message: "Authentication required." });
          return;
        }

        let decodedToken: ReturnType<typeof verifyCoeSharedToken>;
        try {
          decodedToken = verifyCoeSharedToken(token);
        } catch (error) {
          if (
            error instanceof jwt.TokenExpiredError ||
            error instanceof jwt.JsonWebTokenError ||
            error instanceof jwt.NotBeforeError
          ) {
            res.clearCookie(COE_SHARED_TOKEN_COOKIE_NAME, { path: "/" });
            res.status(401).json({ message: "Invalid or expired SSO token." });
            return;
          }

          throw error;
        }

        const email = typeof decodedToken.email === "string" ? decodedToken.email.trim().toLowerCase() : "";
        const role = typeof decodedToken.role === "string" ? decodedToken.role.trim().toUpperCase() : "";
        const status = typeof decodedToken.status === "string" ? decodedToken.status.trim().toUpperCase() : "";

        if (!email || !role) {
          res.status(400).json({
            message: "SSO token missing required fields.",
            missing: [
              ...(!email ? ["email"] : []),
              ...(!role ? ["role"] : []),
            ],
          });
          return;
        }

        if (status !== "ACTIVE") {
          res.status(403).json({ message: `Account is ${status || "NOT_ACTIVE"}.` });
          return;
        }

        const authUser = buildAuthenticatedUserFromCoePayload({
          email,
          role,
          status,
        });

        const existingUser = await userRepository.findByEmail(email);
        const syncedUser = existingUser ?? (await userService.syncAuthenticatedUser(authUser));
        const firebaseCustomToken = await ensureFirebaseAuthUser({
          email: syncedUser.email,
          role: syncedUser.role,
        });
        const frontendOrigin = resolveSafeFrontendOrigin(req.query.frontendOrigin);
        const destinationPath = shouldRedirectToCompleteProfile(syncedUser)
          ? "/complete-profile"
          : getDashboardPathForRole(syncedUser.role);

        res.cookie(FIREBASE_CUSTOM_TOKEN_COOKIE_NAME, firebaseCustomToken, {
          httpOnly: false,
          sameSite: "lax",
          secure: env.NODE_ENV === "production",
          path: "/",
          maxAge: 5 * 60 * 1000,
        });

        if (req.method === "POST") {
          res.json({
            ok: true,
            user: toUserProfileResponse(syncedUser, null),
            firebaseCustomToken,
          });
          return;
        }

        const redirectUrl = new URL(destinationPath, `${frontendOrigin}/`);
        redirectUrl.searchParams.set("sso", "success");
        res.redirect(302, redirectUrl.toString());
      } catch (error) {
        console.error("[SSO AUTH FATAL ERROR]:", error);
        res.status(500).json({
          message: "SSO authentication failed. Check backend logs for the exact cause.",
        });
      }
    },

    async getCurrentUser(req: Request, res: Response): Promise<void> {
      const profile = await userService.getCurrentUser(req.user!);
      res.json({ user: profile });
    },

    async getUserByEmail(req: Request, res: Response): Promise<void> {
      const email = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
      const profile = await userService.getUserByEmail(email);
      res.json({ user: profile });
    },

    async getCurrentUserAnalytics(req: Request, res: Response): Promise<void> {
      const analytics = await userService.getCurrentUserAnalytics(req.user!);
      res.json({ analytics });
    },

    async getUserAnalyticsByEmail(req: Request, res: Response): Promise<void> {
      const email = Array.isArray(req.params.email) ? req.params.email[0] : req.params.email;
      const analytics = await userService.getUserAnalyticsByEmail(req.user!, email);
      res.json({ analytics });
    },

    async getLegacyProfile(req: Request, res: Response): Promise<void> {
      const profile = await userService.getCurrentUser(req.user!);
      res.json(profile);
    },

    async updateCurrentUserProfile(req: Request, res: Response): Promise<void> {
      const payload = parseUpdateProfilePayload(req.user!.role, req.body);
      const baseUser = (await userRepository.findByEmail(req.user!.email)) ?? (await userService.syncAuthenticatedUser(req.user!));

      if (req.user!.role === "STUDENT") {
        const updatedStudent = await userRepository.update(req.user!.email, {
          name: payload.name,
          uid: payload.uid ?? null,
          rollNumber: payload.rollNumber ?? null,
          department: payload.department,
          semester: payload.semester ?? null,
          linkedInUrl: payload.linkedInUrl,
          githubUrl: payload.githubUrl,
          isProfileComplete: true,
          updatedAt: new Date(),
        });

        req.user = {
          ...req.user!,
          name: updatedStudent.name ?? undefined,
          uid: updatedStudent.uid ?? undefined,
          department: updatedStudent.department ?? undefined,
        };

        const profile = await userService.getCurrentUser(req.user);
        res.json({ user: profile });
        return;
      }

      const updatedFaculty = await userRepository.update(req.user!.email, {
        name: payload.name,
        designation: payload.designation ?? baseUser.designation,
        department: payload.department,
        linkedInUrl: payload.linkedInUrl,
        githubUrl: payload.githubUrl,
        isProfileComplete: true,
        updatedAt: new Date(),
      });

      req.user = {
        ...req.user!,
        name: updatedFaculty.name ?? undefined,
        uid: updatedFaculty.uid ?? undefined,
        department: updatedFaculty.department ?? undefined,
      };

      const profile = await userService.getCurrentUser(req.user);
      res.json({ user: profile });
    },
  };
}
