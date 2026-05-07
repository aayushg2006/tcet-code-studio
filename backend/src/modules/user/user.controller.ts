import type { Request, Response } from "express";
import type { UserService } from "./user.service";

export function createUserController(userService: UserService) {
  return {
    async getCurrentUser(req: Request, res: Response): Promise<void> {
      const profile = await userService.getCurrentUser(req.user!);
      res.json({ user: profile });
    },

    async getLegacyProfile(req: Request, res: Response): Promise<void> {
      const profile = await userService.getCurrentUser(req.user!);
      res.json(profile);
    },
  };
}
