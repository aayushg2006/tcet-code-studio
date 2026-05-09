import "dotenv/config";
import path from "node:path";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  AUTH_MODE: z.enum(["mock", "jwt"]).default("mock"),
  COE_SHARED_TOKEN_SECRET: z.string().min(1).default("SECRET_FROM_COE"),
  FIREBASE_SERVICE_ACCOUNT_PATH: z.string().min(1).default("./firebase-key.json"),
  FIRESTORE_TEST_COLLECTION: z.string().min(1).default("test"),
  CORS_ORIGIN: z.string().min(1).default("http://localhost:5173"),
  EXECUTION_PROVIDER: z.enum(["stub", "judge0"]).default("stub"),
  JUDGE0_BASE_URL: z.string().optional().transform((value) => value?.trim() ?? ""),
  JUDGE0_API_KEY: z.string().optional().transform((value) => value?.trim() ?? ""),
  MOCK_AUTH_DEFAULT_EMAIL: z.string().email().default("student1@tcetmumbai.in"),
  MOCK_AUTH_DEFAULT_ROLE: z.enum(["STUDENT", "FACULTY"]).default("STUDENT"),
  MOCK_AUTH_DEFAULT_NAME: z.string().min(1).default("Mock Student"),
  MOCK_AUTH_DEFAULT_UID: z.string().min(1).default("TCET-MOCK-001"),
  MOCK_AUTH_DEFAULT_DEPARTMENT: z.string().min(1).default("Computer Engineering"),
  DEFAULT_PROBLEM_TIME_LIMIT_SECONDS: z.coerce.number().int().positive().default(1),
  DEFAULT_PROBLEM_MEMORY_LIMIT_MB: z.coerce.number().int().positive().default(256),
  RATING_POINTS_EASY: z.coerce.number().int().nonnegative().default(100),
  RATING_POINTS_MEDIUM: z.coerce.number().int().nonnegative().default(200),
  RATING_POINTS_HARD: z.coerce.number().int().nonnegative().default(300),
});

const parsedEnv = envSchema.parse(process.env);

export const env = {
  ...parsedEnv,
  corsOrigins: parsedEnv.CORS_ORIGIN.split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  firebaseServiceAccountPath: path.resolve(process.cwd(), parsedEnv.FIREBASE_SERVICE_ACCOUNT_PATH),
} as const;
