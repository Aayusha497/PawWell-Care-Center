/**
 * Seed Script - Create Default Services
 * 
 * Creates the core services offered by PawWell
 */

const { Service } = require('../models');

const seedServices = async () => {
  try {
    console.log('🌱 Starting services seed...\n');

    const services = [
      {
        name: 'Pet Boarding',
        description: 'Full-time boarding service for your pets with proper care and supervision',
        base_price: 2000
      },
      {
        name: 'Daycation/Pet Sitting',
        description: 'Day care service for your pets with play and socialization',
        base_price: 2000
      },
      {
        name: 'Grooming',
        description: 'Professional grooming services including bathing, trimming, and styling',
        base_price: 3500
      }
    ];

    for (const serviceData of services) {
      const existingService = await Service.findOne({
        where: { name: serviceData.name }
      });

      if (existingService) {
        console.log(`⚠️  Service already exists: ${serviceData.name}`);
        
        // Update price if different
        if (existingService.base_price !== serviceData.base_price) {
          existingService.base_price = serviceData.base_price;
          await existingService.save();
          console.log(`   ✅ Updated price to: NPR ${serviceData.base_price}`);
        }
      } else {
        await Service.create(serviceData);
        console.log(`✅ Created service: ${serviceData.name}`);
        console.log(`   Base Price: NPR ${serviceData.base_price}`);
        console.log(`   Description: ${serviceData.description}\n`);
      }
    }

    console.log('\n📋 Services Summary:');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('1️⃣  Pet Boarding      - NPR 2000/night');
    console.log('2️⃣  Daycation/Pet Sitting - NPR 2000/day');
    console.log('3️⃣  Grooming         - NPR 3500/session');
    console.log('═══════════════════════════════════════════════════════════');
    console.log('✨ Services seed completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('❌ Services seed failed:', error);
    process.exit(1);
  }
};

// Run seed
seedServices();
