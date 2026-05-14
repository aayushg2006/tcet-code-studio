import type { RequestHandler } from "express";
import { AppError } from "../shared/errors/app-error";
import type { UserRepository } from "../modules/user/user.repository";

export function createRequireCompleteProfile(userRepository: UserRepository): RequestHandler {
  return async (req, _res, next) => {
    if (!req.user) {
      return next(new AppError(401, "Authentication required"));
    }

    const user = await userRepository.getByEmail(req.user.email);
    if (!user) {
      return next(new AppError(403, "Profile incomplete"));
    }

    if (!user.isProfileComplete) {
      return next(new AppError(403, "Profile incomplete"));
    }

    return next();
  };
}
