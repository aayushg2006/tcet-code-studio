import { toCsv } from "../../shared/utils/csv";
import { paginateArray, type PaginationInput, type PaginatedResult } from "../../shared/utils/pagination";
import {
  compareLeaderboardEntries,
  isRankedLeaderboardEntry,
  toLeaderboardListItem,
  type LeaderboardListItem,
} from "./leaderboard.model";
import type { LeaderboardRepository } from "./leaderboard.repository";

export interface LeaderboardService {
  listLeaderboard(pagination: PaginationInput): Promise<PaginatedResult<LeaderboardListItem>>;
  exportLeaderboardCsv(): Promise<string>;
}

interface LeaderboardServiceDependencies {
  leaderboardRepository: LeaderboardRepository;
}

export function createLeaderboardService(dependencies: LeaderboardServiceDependencies): LeaderboardService {
  return {
    async listLeaderboard(pagination) {
      const sortedEntries = (await dependencies.leaderboardRepository.list())
        .filter(isRankedLeaderboardEntry)
        .sort(compareLeaderboardEntries)
        .map((entry, index) => toLeaderboardListItem(entry, index + 1));

      return paginateArray(sortedEntries, pagination);
    },

    async exportLeaderboardCsv() {
      const rows = (await dependencies.leaderboardRepository.list())
        .filter(isRankedLeaderboardEntry)
        .sort(compareLeaderboardEntries)
        .map((entry, index) => ({
          rank: index + 1,
          email: entry.email,
          name: entry.name ?? "",
          role: entry.role,
          rating: entry.rating,
          score: entry.rating,
          problemsSolved: entry.problemsSolved,
          submissionCount: entry.submissionCount,
          acceptedSubmissionCount: entry.acceptedSubmissionCount,
          accuracy: entry.accuracy,
        }));

      return toCsv(rows);
    },
  };
}
