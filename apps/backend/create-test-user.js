#!/usr/bin/env node

/**
 * Create test user directly in database
 * Run: node create-test-user.js
 */

const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');

const prisma = new PrismaClient();

async function main() {
  const email = 'test-video@example.com';
  const password = 'Test123456!';
  const namaLengkap = 'Test Video User';

  console.log('🔧 Creating test user...');

  // Delete if exists
  await prisma.user.deleteMany({
    where: { email },
  });

  // Hash password
  const hashedPassword = await bcrypt.hash(password, 10);

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      namaLengkap,
      password: hashedPassword,
      isEmailVerified: true,
    },
  });

  console.log('✅ Test user created:');
  console.log(`   Email: ${email}`);
  console.log(`   Password: ${password}`);
  console.log(`   ID: ${user.id}`);
  console.log('');
  console.log('You can now use these credentials for testing.');

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error('❌ Error:', e.message);
  process.exit(1);
});
