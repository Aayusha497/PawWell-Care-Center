const { PrismaClient } = require('@prisma/client');
const { Pool } = require('pg');
const { PrismaPg } = require('@prisma/adapter-pg');

// Ensure dotenv is loaded if not already
if (!process.env.DATABASE_URL) {
  require('dotenv').config();
}

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ Emergency Service: DATABASE_URL is missing!');
} else {
  console.log('✅ Emergency Service: Using Database URL from env');
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const createEmergencyRequest = async ({
  userId,
  petId,
  emergencyType,
  description,
  contactInfo
}) => {
  try {
    return await prisma.emergency_requests.create({
      data: {
        user_id: userId,
        pet_id: petId,
        emergency_type: emergencyType,
        description,
        contact_info: contactInfo,
        date: new Date(),
        status: 'pending',
        created_at: new Date(),
        updated_at: new Date()
      }
    });
  } catch (error) {
    console.error('Error creating emergency request in DB:', error);
    throw error;
  }
};

const getUserEmergencyRequests = async (userId) => {
  return prisma.emergency_requests.findMany({
    where: { user_id: userId },
    include: {
      pets: true
    },
    orderBy: { created_at: 'desc' }
  });
};

const getAllEmergencyRequests = async () => {
  return prisma.emergency_requests.findMany({
    include: {
      pets: true,
      users: true
    },
    orderBy: { created_at: 'desc' }
  });
};

const updateEmergencyStatus = async (emergencyId, status) => {
  return prisma.emergency_requests.update({
    where: { emergency_id: emergencyId },
    data: {
      status,
      updated_at: new Date()
    },
    include: {
      pets: true,
      users: true
    }
  });
};

const getUserPet = async (userId, petId) => {
  try {
    // console.log(`Looking for pet: ${petId} for user: ${userId}`);
    const pet = await prisma.pets.findFirst({
      where: {
        pet_id: petId,
        user_id: userId
      }
    });
    // console.log('Found pet:', pet);
    return pet;
  } catch (error) {
    console.error('Error fetching user pet:', error);
    return null;
  }
};

const getAdmins = async () => {
  try {
    return await prisma.users.findMany({
      where: { user_type: 'admin' }
    });
  } catch (error) {
    console.error('Error fetching admins:', error);
    return []; // Return empty array on error to prevent crash
  }
};

const createAdminNotifications = async (adminIds, message) => {
  if (!adminIds.length) {
    return [];
  }

  const createPayload = adminIds.map((adminId) => ({
    user_id: adminId,
    message,
    is_read: false,
    created_at: new Date()
  }));

  return prisma.notifications.createMany({
    data: createPayload
  });
};

module.exports = {
  createEmergencyRequest,
  getUserEmergencyRequests,
  getAllEmergencyRequests,
  updateEmergencyStatus,
  getUserPet,
  getAdmins,
  createAdminNotifications
};
