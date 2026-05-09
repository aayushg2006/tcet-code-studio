import { Worker } from "bullmq";
import { env } from "../config/env";
import { createRedisConnection, type SubmissionJobData } from "./submission-queue";
import type { SubmissionService } from "../modules/submission/submission.service";

export function createSubmissionWorker(submissionService: SubmissionService): Worker<SubmissionJobData> {
  return new Worker<SubmissionJobData>(
    env.SUBMISSION_QUEUE_NAME,
    async (job) => {
      await submissionService.processQueuedSubmission(job.data.submissionId, String(job.id ?? ""));
    },
    {
      connection: createRedisConnection(),
      concurrency: env.SUBMISSION_WORKER_CONCURRENCY,
    },
  );
}
