import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/**
 * Load `.env` with override so file values win over empty or stale OS/IDE environment
 * variables (e.g. `S3_PUBLIC_BASE_URL=`). Must be imported before `main.ts` bootstraps Nest.
 */
const envPath = resolve(process.cwd(), '.env');
if (existsSync(envPath)) {
  config({ path: envPath, override: true });
}
