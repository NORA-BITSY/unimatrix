#!/usr/bin/env tsx

import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function seedDemoUser() {
  try {
    console.log('🌱 Seeding demo user...');

    // Check if demo user already exists
    const existingUser = await prisma.user.findUnique({
      where: { email: 'admin@unimatrix.dev' }
    });

    if (existingUser) {
      console.log('✅ Demo user already exists!');
      console.log(`   Email: ${existingUser.email}`);
      console.log(`   Role: ${existingUser.role}`);
      return;
    }

    // Hash the password
    const hashedPassword = await bcrypt.hash('admin123', 12);

    // Create demo user
    const demoUser = await prisma.user.create({
      data: {
        email: 'admin@unimatrix.dev',
        password: hashedPassword,
        firstName: 'Admin',
        lastName: 'User',
        username: 'admin',
        role: 'ADMIN',
        isActive: true,
      }
    });

    console.log('✅ Demo user created successfully!');
    console.log(`   ID: ${demoUser.id}`);
    console.log(`   Email: ${demoUser.email}`);
    console.log(`   Username: ${demoUser.username}`);
    console.log(`   Role: ${demoUser.role}`);
    console.log('');
    console.log('🔑 Demo Credentials:');
    console.log('   Email: admin@unimatrix.dev');
    console.log('   Password: admin123');

  } catch (error) {
    console.error('❌ Failed to seed demo user:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Run the seeder
seedDemoUser()
  .then(() => {
    console.log('🎉 Seeding completed!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Seeding failed:', error);
    process.exit(1);
  });

export { seedDemoUser };
