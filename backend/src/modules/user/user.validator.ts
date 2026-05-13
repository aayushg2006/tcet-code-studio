import { z } from "zod";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Must be a valid URL")
  .transform((value) => (value && value.length > 0 ? value : null));

export const updateProfileSchema = z.object({
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  department: z.enum(["AI&DS", "COMP", "IT", "EXTC"]),
  semester: z.coerce.number().int().min(1).max(8),
  linkedInUrl: optionalUrlSchema,
  githubUrl: optionalUrlSchema,
});
