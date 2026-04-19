/**
 * Quick test script to verify Groq connection
 */

require('dotenv').config();
const { createGroqClient, testGroqConnection } = require('./services/chatbot/groqClient');

async function testGroq() {
  console.log('🧪 Testing Groq connection...\n');
  
  try {
    console.log('Creating Groq client...');
    const { client, model } = createGroqClient();
    
    console.log('✅ Groq client created successfully');
    console.log('   Model:', model);
    
    // Test the connection
    console.log('\nTesting API connection...');
    const success = await testGroqConnection();
    
    if (success) {
      console.log('\n✨ All tests passed! Groq is working correctly.');
      console.log('\nConfiguration:');
      console.log('  - GROQ_API_KEY is set ✓');
      console.log('  - Model is accessible ✓');
      console.log('  - API connection works ✓');
    } else {
      console.error('\n⚠️  Groq test failed. Please check:');
      console.error('  1. GROQ_API_KEY environment variable is set');
      console.error('  2. API key is valid: https://console.groq.com');
      console.error('  3. You have internet connection');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Error during test:', error.message);
    console.error('\nSetup instructions:');
    console.error('  1. Get API key: https://console.groq.com');
    console.error('  2. Set GROQ_API_KEY environment variable');
    console.error('  3. Install dependencies: npm install groq-sdk --legacy-peer-deps');
    process.exit(1);
  }
}

testGroq();
