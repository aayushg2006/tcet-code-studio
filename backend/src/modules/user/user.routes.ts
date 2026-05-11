import { Router } from "express";
import type { ApplicationDependencies } from "../../bootstrap/dependencies";
import { requireRole } from "../../middleware/require-role";
import { asyncHandler } from "../../shared/middleware/async-handler";
import { createUserController } from "./user.controller";

export function createUserRouter(dependencies: ApplicationDependencies): Router {
  const router = Router();
  const controller = createUserController(dependencies.userService);

  router.use(dependencies.authMiddleware);
  router.get("/me", asyncHandler(controller.getCurrentUser));
  router.get("/:email", requireRole("FACULTY"), asyncHandler(controller.getUserByEmail));

  return router;
}

export function createLegacyUserRouter(dependencies: ApplicationDependencies): Router {
  const router = Router();
  const controller = createUserController(dependencies.userService);

  router.use(dependencies.authMiddleware);
  router.get("/profile", asyncHandler(controller.getLegacyProfile));

  return router;
}
