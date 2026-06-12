import { cleanEnv, str, bool, num } from 'envalid';
import * as dotenv from 'dotenv';
import path from 'path';

// Cargar variables desde el archivo .env
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

export const env = cleanEnv(process.env, {
  SIGCENTER_USER: str(),
  SIGCENTER_PASSWORD: str(),
  GETSOFT_USER: str(),
  GETSOFT_PASSWORD: str(),
  HEADLESS: bool({ default: true }),
  TIMEOUT: num({ default: 30000 }),
  LOG_LEVEL: str({ default: 'info' })
});
