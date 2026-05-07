import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "../../shared/constants/domain";
import { normalizeSubmissionStatus, normalizeSupportedLanguage } from "../../shared/utils/normalize";

const supportedLanguageSchema = z
  .string()
  .min(1)
  .transform((value) => normalizeSupportedLanguage(value))
  .refine((value) => SUPPORTED_LANGUAGES.includes(value), "Unsupported language");

export const submissionRequestSchema = z.object({
  problemId: z.string().min(1),
  code: z.string().trim().min(1, "Code cannot be empty"),
  language: supportedLanguageSchema,
});

export const submissionQuerySchema = z.object({
  problemId: z.string().optional(),
  userEmail: z.string().email().optional(),
  status: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeSubmissionStatus(value) : undefined)),
  language: z
    .string()
    .optional()
    .transform((value) => (value ? normalizeSupportedLanguage(value) : undefined)),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});
