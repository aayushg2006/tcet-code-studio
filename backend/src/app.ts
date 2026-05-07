import cookieParser from "cookie-parser";
import cors from "cors";
import express, { type Express } from "express";
import type { ApplicationDependencies } from "./bootstrap/dependencies";
import { env } from "./config/env";
import { createLeaderboardRouter } from "./modules/leaderboard/leaderboard.routes";
import { createProblemRouter } from "./modules/problem/problem.routes";
import { createSubmissionRouter } from "./modules/submission/submission.routes";
import { createLegacyUserRouter, createUserRouter } from "./modules/user/user.routes";
import { errorHandler, notFoundHandler } from "./shared/middleware/error-handler";

function resolveCorsOrigin(): true | string | string[] {
  if (env.corsOrigins.length === 0) {
    return true;
  }

  if (env.corsOrigins.length === 1) {
    return env.corsOrigins[0];
  }

  return env.corsOrigins;
}

export function createApp(dependencies: ApplicationDependencies): Express {
  const app = express();

  app.disable("x-powered-by");
  app.use(
    cors({
      origin: resolveCorsOrigin(),
      credentials: true,
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "2mb" }));

  app.get("/", (_req, res) => {
    res.json({
      status: "ok",
      service: "tcet-code-studio-backend",
    });
  });

  app.get("/health", (_req, res) => {
    res.json({ ok: true });
  });

  if (dependencies.databaseHealthcheck) {
    app.get("/test-db", async (_req, res, next) => {
      try {
        await dependencies.databaseHealthcheck?.();
        res.send("Database working");
      } catch (error) {
        next(error);
      }
    });
  }

  app.use("/api/users", createUserRouter(dependencies));
  app.use("/api/user", createLegacyUserRouter(dependencies));
  app.use("/api/problems", createProblemRouter(dependencies));
  app.use("/api/submissions", createSubmissionRouter(dependencies));
  app.use("/api/leaderboard", createLeaderboardRouter(dependencies));

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
