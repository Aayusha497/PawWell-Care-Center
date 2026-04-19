/**
 * Groq Client Configuration
 * 
 * Configures the Groq SDK for cloud-based LLM inference
 * Uses mixtral-8x7b-32768 by default or your configured model
 */

const { Groq } = require("groq-sdk");

/**
 * Create and configure Groq client
 * @returns {Object} Configured Groq client with metadata
 */
function createGroqClient() {
  const apiKey = process.env.GROQ_API_KEY;
  
  if (!apiKey) {
    throw new Error('GROQ_API_KEY environment variable is not set');
  }

  const model = process.env.GROQ_MODEL || "mixtral-8x7b-32768";
  const temperature = parseFloat(process.env.GROQ_TEMPERATURE) || 0.7;

  console.log('🚀 Initializing Groq client:', {
    model: model,
    temperature: temperature
  });

  // Create and return the Groq client instance
  const client = new Groq({
    apiKey: apiKey
  });
  
  return {
    client,
    model,
    temperature
  };
}

/**
 * Test Groq connection
 * @returns {Promise<boolean>} True if Groq is accessible
 */
async function testGroqConnection() {
  try {
    const { client, model } = createGroqClient();
    
    const testMessage = await client.chat.completions.create({
      messages: [
        { role: "user", content: "Say 'Hi' and nothing else" }
      ],
      model: model,
      max_tokens: 10,
      temperature: 0.5
    });

    if (testMessage.choices && testMessage.choices.length > 0) {
      console.log('✅ Groq connection successful');
      console.log('   Model:', model);
      console.log('   Response:', testMessage.choices[0].message.content.substring(0, 50) + '...');
      return true;
    } else {
      console.error('❌ Groq returned empty response');
      return false;
    }
  } catch (error) {
    console.error('❌ Groq connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  createGroqClient,
  testGroqConnection
};
