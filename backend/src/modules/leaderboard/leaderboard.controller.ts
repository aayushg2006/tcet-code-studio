import type { Request, Response } from "express";
import type { LeaderboardService } from "./leaderboard.service";

export function createLeaderboardController(leaderboardService: LeaderboardService) {
  return {
    async listLeaderboard(req: Request, res: Response): Promise<void> {
      const pageSize = req.query.pageSize ? Number(req.query.pageSize) : undefined;
      const cursor = typeof req.query.cursor === "string" ? req.query.cursor : undefined;
      const leaderboard = await leaderboardService.listLeaderboard({ pageSize, cursor });
      res.json(leaderboard);
    },

    async exportLeaderboard(req: Request, res: Response): Promise<void> {
      const csv = await leaderboardService.exportLeaderboardCsv();
      res.setHeader("Content-Type", "text/csv; charset=utf-8");
      res.setHeader("Content-Disposition", 'attachment; filename="leaderboard.csv"');
      res.send(csv);
    },
  };
}
