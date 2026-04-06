import { execSync } from 'node:child_process';

process.env.NODE_ENV = 'test';
process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || process.env.DATABASE_URL;

try {
  execSync('npx prisma migrate deploy', {
    stdio: 'inherit',
    cwd: process.cwd(),
  });
} catch (error) {
  console.error('Failed to run prisma migrations for e2e tests', error);
}
