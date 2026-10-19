import { config as loadEnv } from "dotenv";
import { z } from "zod";

loadEnv({ quiet: true });

const envSchema = z.object({
  UI_BASE_URL: z.url(),
  API_BASE_URL: z.url(),
  ADMIN_EMAIL: z.email(),
  ADMIN_PASSWORD: z.string().min(1, "Password is required"),
  CUSTOMER_EMAIL: z.email(),
  CUSTOMER_PASSWORD: z.string().min(1, "Password is required"),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  throw new Error(`Invalid .env settings:\n${z.prettifyError(parsed.error)}`);
}

export const config = parsed.data;
