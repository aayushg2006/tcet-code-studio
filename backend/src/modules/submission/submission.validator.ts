import { z } from "zod";
import { SUPPORTED_LANGUAGES } from "../../shared/constants/domain";
import type { ExecutableLanguage, SupportedLanguage } from "../../shared/types/domain";
import {
  isExecutableLanguage,
  normalizeSubmissionStatus,
  tryNormalizeSupportedLanguage,
} from "../../shared/utils/normalize";

const supportedLanguageSchema = z
  .string()
  .min(1)
  .transform((value, ctx) => {
    const normalized = tryNormalizeSupportedLanguage(value);
    if (!normalized || !SUPPORTED_LANGUAGES.includes(normalized)) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Unsupported language",
      });
      return z.NEVER;
    }

    return normalized;
  });

const executableLanguageSchema = supportedLanguageSchema.refine(
  (value) => isExecutableLanguage(value),
  "Language is editor-only right now and cannot be executed by the backend",
).transform((value) => value as ExecutableLanguage);

export const submissionRequestSchema = z.object({
  problemId: z.string().min(1),
  code: z.string().trim().min(1, "Code cannot be empty"),
  language: executableLanguageSchema,
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
    .transform((value, ctx) => {
      if (!value) {
        return undefined;
      }

      const normalized = tryNormalizeSupportedLanguage(value);
      if (!normalized || !SUPPORTED_LANGUAGES.includes(normalized)) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: "Unsupported language",
        });
        return z.NEVER;
      }

      return normalized;
    }),
  cursor: z.string().optional(),
  pageSize: z.coerce.number().int().positive().optional(),
});
