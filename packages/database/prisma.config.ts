import { defineConfig } from '@prisma/config';
import * as dotenv from 'dotenv';
import * as path from 'path';

dotenv.config({ path: path.resolve(__dirname, '.env') });

export default defineConfig({
  datasource: {
    // Use DIRECT_URL (session-mode, port 5432) for schema operations (db push/migrate).
    // PgBouncer transaction-mode (port 6543) blocks DDL — cannot be used here.
    url: process.env.DIRECT_URL ?? process.env.DATABASE_URL,
  },
});
