import dotenv from 'dotenv';
import { existsSync } from 'node:fs';

// Directory to load environment files from
let envDir = `${__dirname}/../../..`;

if (process.env.ENV_PATH) {
  // Load environment file from custom path
  const customEnvPath = process.env.ENV_PATH.trim();
  if (!existsSync(customEnvPath)) {
    throw new Error(
      `ENV_PATH is set to '${customEnvPath}' but the folder does not exist.`,
    );
  }
  envDir = customEnvPath;
}

if (process.env.NODE_ENV) {
  // Load environment files with fallback chain
  const envName = process.env.NODE_ENV.trim();
  const envFile = `.env.${envName}`;
  const envLocalFile = `.env.${envName}.local`;
  const defaultEnvFile = '.env';

  const envFilePath = `${envDir}/${envFile}`;
  const envLocalFilePath = `${envDir}/${envLocalFile}`;
  const defaultEnvFilePath = `${envDir}/${defaultEnvFile}`;

  // Try .env.{NODE_ENV}.local first (highest priority)
  if (existsSync(envLocalFilePath)) {
    dotenv.config({ path: envLocalFilePath });
  }
  // Then try .env.{NODE_ENV}
  else if (existsSync(envFilePath)) {
    dotenv.config({ path: envFilePath });
  }
  // Finally fall back to .env
  else if (existsSync(defaultEnvFilePath)) {
    dotenv.config({ path: defaultEnvFilePath });
  } else {
    dotenv.config();
  }
} else {
  const defaultEnvFile = '.env';
  const defaultEnvFilePath = `${envDir}/${defaultEnvFile}`;

  if (existsSync(defaultEnvFilePath)) {
    dotenv.config({ path: defaultEnvFilePath });
  } else {
    dotenv.config();
  }
}

export const defaultEnv = {
  // Node Environment
  NODE_ENV: process.env.NODE_ENV || 'development',
  // Application
  PORT: process.env.PORT ? Number(process.env.PORT) : 3000,
  // JWT
  JWT_SECRET: process.env.JWT_SECRET || 'dummy-jwt-secret',
  JWT_EXPIRES_IN_SEC: process.env.JWT_EXPIRES_IN_SEC
    ? Number(process.env.JWT_EXPIRES_IN_SEC)
    : 900,
  // Database
  DB_HOST: process.env.DB_HOST || 'localhost',
  DB_PORT: process.env.DB_PORT ? Number(process.env.DB_PORT) : 5432,
  DB_USERNAME: process.env.DB_USERNAME || 'postgres',
  DB_PASSWORD: process.env.DB_PASSWORD || 'postgres',
  DB_NAME: process.env.DB_NAME || 'postgres',
  // Logging
  ENABLE_TRACE_LOGS: process.env.ENABLE_TRACE_LOGS === 'true' || false,
  ENABLE_CACHE_TRACE_LOGS:
    process.env.ENABLE_CACHE_TRACE_LOGS === 'true' || false,
};

class Env {
  get<T>(key: keyof typeof defaultEnv, defaultValue?: T): T {
    return (defaultEnv[key] ?? defaultValue) as T;
  }
}

const allowedEnvs = ['development', 'test', 'production'];
if (!allowedEnvs.includes(defaultEnv.NODE_ENV)) {
  throw new Error(`NODE_ENV must be one of: ${allowedEnvs.join(', ')}`);
}

if (!Number.isSafeInteger(defaultEnv.PORT)) {
  throw new Error('PORT must be a valid integer');
}

if (!Number.isSafeInteger(defaultEnv.JWT_EXPIRES_IN_SEC)) {
  throw new Error('JWT_EXPIRES_IN_SEC must be a valid integer');
}

export const env = new Env();
