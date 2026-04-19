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
        base_price: 2600
      },
      {
        name: 'Pet Sitting',
        description: 'Day care and sitting service for your pets with play and socialization',
        base_price: 3250
      },
      {
        name: 'Grooming',
        description: 'Professional grooming services for your pets including bathing, trimming, and styling',
        base_price: 3900
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
        console.log(`Created service: ${serviceData.name}`);
        console.log(` Base Price: NPR ${serviceData.base_price}`);
        console.log(` Description: ${serviceData.description}\n`);
      }
    }

    console.log('\nServices Summary:');
    
    console.log('Pet Boarding      - NPR 2,600/night');
    console.log('Pet Sitting       - NPR 3,250/day');
    console.log('Grooming          - NPR 3,900/session');

    console.log('Services seed completed!');
    
    process.exit(0);
  } catch (error) {
    console.error('Services seed failed:', error);
    process.exit(1);
  }
};

// Run seed
seedServices();
