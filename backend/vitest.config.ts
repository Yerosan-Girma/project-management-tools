import { defineConfig } from 'vitest/config';
import path from 'path';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL = 'postgresql://postgres:yero12345@localhost:5432/teamflow_test_db?schema=public';
process.env.JWT_ACCESS_SECRET = 'teamflow_super_secure_access_token_secret_key_32bytes_long_ok';
process.env.JWT_REFRESH_SECRET = 'teamflow_super_secure_refresh_token_secret_key_32bytes_long_ok';

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    testTimeout: 30000,
    hookTimeout: 30000,
    include: ['tests/**/*.test.ts'],
    alias: {
      '@': path.resolve(__dirname, './src')
    },
    fileParallelism: false // Sequential run for clean test DB isolation
  }
});
