const { User } = require('../models');
const { ROLES } = require('../utils/rbac');

/**
 * Comprehensive Seed Script - Create Test Users
 * 
 * Creates admin and test users for development/testing
 */
const seedUsers = async () => {
  try {
    console.log('🌱 Starting user seed...\n');

    const users = [
      {
        email: 'admin@gmail.com',
        password: 'Admin@123456',
        firstName: 'Admin',
        lastName: 'User',
        userType: ROLES.ADMIN,
        phoneNumber: '+1234567890',
        emailVerified: true,
        isActive: true
      },
      {
        email: 'john@example.com',
        password: 'User@123456',
        firstName: 'John',
        lastName: 'Doe',
        userType: ROLES.PET_OWNER,
        phoneNumber: '+1234567891',
        emailVerified: true,
        isActive: true
      },
      {
        email: 'jane@example.com',
        password: 'User@123456',
        firstName: 'Jane',
        lastName: 'Smith',
        userType: ROLES.PET_OWNER,
        phoneNumber: '+1234567892',
        emailVerified: true,
        isActive: true
      }
    ];

    for (const userData of users) {
      const existingUser = await User.findOne({
        where: { email: userData.email }
      });

      if (existingUser) {
        console.log(`⚠️  User already exists: ${userData.email}`);
        
        // Update to correct role if needed
        if (existingUser.userType !== userData.userType) {
          existingUser.userType = userData.userType;
          await existingUser.save();
          console.log(`   ✅ Updated role to: ${userData.userType}`);
        }
      } else {
        await User.create(userData);
        console.log(`✅ Created user: ${userData.email}`);
        console.log(`   Role: ${userData.userType}`);
        console.log(`   Password: ${userData.password}\n`);
      }
    }

    console.log('\n📋 Login Credentials Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('\n🔑 ADMIN ACCOUNT:');
    console.log('   Email:    admin@gmail.com');
    console.log('   Password: Admin@123456');
    console.log('   Role:     admin');
    console.log('\n👤 TEST USER 1:');
    console.log('   Email:    john@example.com');
    console.log('   Password: User@123456');
    console.log('   Role:     pet_owner');
    console.log('\n👤 TEST USER 2:');
    console.log('   Email:    jane@example.com');
    console.log('   Password: User@123456');
    console.log('   Role:     pet_owner');
    console.log('\n═══════════════════════════════════════════════════════════');
    console.log('⚠️  IMPORTANT: Change passwords in production!');
    console.log('\n✨ User seed completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ User seed failed:', error);
    process.exit(1);
  }
};

// Run seed
seedUsers();
