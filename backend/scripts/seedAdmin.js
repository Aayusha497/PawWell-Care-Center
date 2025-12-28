const { User } = require('../models');
const { ROLES } = require('../utils/rbac');

/**
 * Seed Script - Create Default Admin User
 * 
 * This script creates a default admin user for initial system access.
 * Run this once after database initialization.
 */
const seedAdmin = async () => {
  try {
    console.log('🌱 Starting admin user seed...');

    // Default admin credentials
    const adminData = {
      email: 'admin@pawwell.com',
      password: 'Admin@123456',  // Change this in production!
      firstName: 'Admin',
      lastName: 'User',
      userType: ROLES.ADMIN,
      phoneNumber: '+1234567890',
      emailVerified: true,
      isActive: true
    };

    // Check if admin already exists
    const existingAdmin = await User.findOne({
      where: { email: adminData.email }
    });

    if (existingAdmin) {
      console.log('⚠️  Admin user already exists');
      console.log('   Email:', existingAdmin.email);
      console.log('   User Type:', existingAdmin.userType);
      
      // Update to admin if not already
      if (existingAdmin.userType !== ROLES.ADMIN) {
        existingAdmin.userType = ROLES.ADMIN;
        await existingAdmin.save();
        console.log('✅ Updated existing user to admin role');
      }
    } else {
      // Create new admin user
      const admin = await User.create(adminData);
      console.log('✅ Admin user created successfully!');
      console.log('\n📧 Admin Login Credentials:');
      console.log('   Email:', adminData.email);
      console.log('   Password:', adminData.password);
      console.log('\n⚠️  IMPORTANT: Change the admin password after first login!');
    }

    console.log('\n✨ Admin seed completed!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Admin seed failed:', error);
    process.exit(1);
  }
};

// Run seed
seedAdmin();
