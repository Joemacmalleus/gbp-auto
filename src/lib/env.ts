/**
 * Environment variable validation.
 * Validates that all required env vars are present at startup.
 * Call validateEnv() in middleware or layout to catch misconfigs early.
 */

const REQUIRED_ENV_VARS = [
  "DATABASE_URL",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_REDIRECT_URI",
  "ANTHROPIC_API_KEY",
] as const;

const OPTIONAL_ENV_VARS = [
  "STRIPE_SECRET_KEY",
  "STRIPE_WEBHOOK_SECRET",
  "NEXT_PUBLIC_APP_URL",
  "SENTRY_DSN",
  "ENCRYPTION_KEY",
] as const;

export interface EnvValidationResult {
  valid: boolean;
  missing: string[];
  warnings: string[];
}

/**
 * Validate that all required environment variables are set.
 * Returns a result object; does not throw.
 */
export function validateEnv(): EnvValidationResult {
  const missing: string[] = [];
  const warnings: string[] = [];

  for (const key of REQUIRED_ENV_VARS) {
    if (!process.env[key]) {
      missing.push(key);
    }
  }

  for (const key of OPTIONAL_ENV_VARS) {
    if (!process.env[key]) {
      warnings.push(`Optional env var ${key} is not set`);
    }
  }

  return {
    valid: missing.length === 0,
    missing,
    warnings,
  };
}

/**
 * Validate env on first import. Logs errors but doesn't crash
 * (allows build to complete even without env vars).
 */
if (typeof window === "undefined" && process.env.NODE_ENV === "production") {
  const result = validateEnv();
  if (!result.valid) {
    console.error(
      `[ENV] Missing required environment variables: ${result.missing.join(", ")}`
    );
  }
  if (result.warnings.length > 0) {
    console.warn(`[ENV] ${result.warnings.join("; ")}`);
  }
}
