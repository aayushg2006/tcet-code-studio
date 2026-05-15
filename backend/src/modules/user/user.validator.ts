import { z } from "zod";
import { DEPARTMENTS } from "../../shared/constants/domain";
import type { UserRole } from "../../shared/types/auth";
import type { Department } from "../../shared/types/domain";

const optionalUrlSchema = z
  .string()
  .trim()
  .optional()
  .refine((value) => !value || /^https?:\/\/.+/i.test(value), "Must be a valid URL")
  .transform((value) => (value && value.length > 0 ? value : null));

const baseProfileSchema = z.object({
  name: z.string().trim().min(1, "Name is required"),
  department: z.enum(DEPARTMENTS),
  linkedInUrl: optionalUrlSchema,
  githubUrl: optionalUrlSchema,
});

const studentProfileSchema = baseProfileSchema.extend({
  rollNumber: z.string().trim().min(1, "Roll number is required"),
  semester: z.coerce.number().int().min(1).max(8),
});

const facultyProfileSchema = baseProfileSchema.extend({
  designation: z.string().trim().min(1, "Designation is required"),
});

export function parseUpdateProfilePayload(
  role: UserRole,
  payload: unknown,
): {
  name: string;
  department: Department;
  linkedInUrl: string | null;
  githubUrl: string | null;
  rollNumber?: string;
  semester?: number;
  designation?: string;
} {
  return role === "FACULTY"
    ? facultyProfileSchema.parse(payload)
    : studentProfileSchema.parse(payload);
}
