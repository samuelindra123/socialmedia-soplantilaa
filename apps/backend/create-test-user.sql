-- Create test user for video upload testing
-- Run: psql $DATABASE_URL -f create-test-user.sql

-- Delete if exists
DELETE FROM "User" WHERE email = 'test-video@example.com';

-- Create verified test user
INSERT INTO "User" (
  id,
  email,
  "namaLengkap",
  password,
  "isEmailVerified",
  "createdAt",
  "updatedAt"
) VALUES (
  gen_random_uuid(),
  'test-video@example.com',
  'Test Video User',
  '$2b$10$YourHashedPasswordHere', -- You need to hash 'Test123456!'
  true,
  NOW(),
  NOW()
);

-- Show created user
SELECT id, email, "namaLengkap", "isEmailVerified" 
FROM "User" 
WHERE email = 'test-video@example.com';
