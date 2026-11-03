import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";
import { z } from "zod";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables from root .env or local .env with multi-path resolution
dotenv.config({ path: path.resolve(process.cwd(), ".env") });
dotenv.config({ path: path.resolve(process.cwd(), "../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../.env") });
dotenv.config({ path: path.resolve(__dirname, "../../../.env") });

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().default(5001),
  CLIENT_URL: z.string().default("http://localhost:5173"),
  API_PREFIX: z.string().default("/api/v1"),
  MONGODB_URI: z.string().default("mongodb://127.0.0.1:27017/ai-mystery-room"),
  GEMINI_API_KEY: z
    .string()
    .optional()
    .default(() => (process.env.GOOGLE_API_KEY || "").trim().replace(/^[\"']|[\"']$/g, ""))
    .transform((val) => (val || process.env.GOOGLE_API_KEY || "").trim().replace(/^[\"']|[\"']$/g, "")),
  GEMINI_MODEL: z.string().default("gemini-3.5-flash"),
  HF_TOKEN: z.string().optional().default(""),
  IMAGE_GENERATION_ENABLED: z.coerce.boolean().default(true),
  JWT_SECRET: z.string().min(16).default("development_jwt_secret_key_at_least_16_chars"),
  SESSION_SECRET: z.string().min(16).default("development_session_secret_key_at_least_16_chars"),
  MEDIA_STORAGE_PROVIDER: z.enum(["local", "s3", "gcs"]).default("local"),
  MEDIA_STORAGE_PATH: z.string().default("./uploads"),
  MAX_SCENARIO_LENGTH: z.coerce.number().default(3000),
  MAX_CONCURRENT_GENERATION_JOBS: z.coerce.number().default(3),
  MAX_GENERATION_RETRIES: z.coerce.number().default(1),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error("Invalid environment variables:", parsed.error.format());
  throw new Error("Invalid environment configuration");
}

export const env = parsed.data;

