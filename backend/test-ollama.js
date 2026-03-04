/**
 * Quick test script to verify Ollama connection
 */

const { createOllamaClient } = require('./services/chatbot/ollamaClient');

async function testOllama() {
  console.log('🧪 Testing Ollama connection...\n');
  
  try {
    const { client, model } = createOllamaClient();
    
    console.log('✅ Ollama client created successfully');
    console.log(`📝 Model: ${model}\n`);
    
    // Test a simple generation
    console.log('💬 Sending test message...');
    const response = await client.generate({
      model: model,
      prompt: 'Say hello in one short sentence.',
      options: {
        temperature: 0.7,
        num_predict: 50
      }
    });
    
    console.log('✅ Response received:');
    console.log(response.response);
    console.log('\n✨ All tests passed! Ollama is working correctly.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error('\n💡 Make sure:');
    console.error('  1. Ollama is installed: https://ollama.ai/download');
    console.error('  2. Ollama is running: ollama serve');
    console.error(`  3. Model is pulled: ollama pull gemma2:2b`);
    process.exit(1);
  }
}

testOllama();
