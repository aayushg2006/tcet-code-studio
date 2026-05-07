import { Router } from "express";
import type { ApplicationDependencies } from "../../bootstrap/dependencies";
import { asyncHandler } from "../../shared/middleware/async-handler";
import { createUserController } from "./user.controller";

export function createUserRouter(dependencies: ApplicationDependencies): Router {
  const router = Router();
  const controller = createUserController(dependencies.userService);

  router.use(dependencies.authMiddleware);
  router.get("/me", asyncHandler(controller.getCurrentUser));

  return router;
}

export function createLegacyUserRouter(dependencies: ApplicationDependencies): Router {
  const router = Router();
  const controller = createUserController(dependencies.userService);

  router.use(dependencies.authMiddleware);
  router.get("/profile", asyncHandler(controller.getLegacyProfile));

  return router;
}
