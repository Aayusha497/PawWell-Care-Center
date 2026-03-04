/**
 * Ollama Client Configuration
 * 
 * Configures the Ollama client for local model inference using gemma2:2b or gemma3:12b
 */

const { Ollama } = require("ollama");

/**
 * Create and configure Ollama client
 * @returns {Ollama} Configured Ollama instance
 */
function createOllamaClient() {
  const ollamaConfig = {
    host: process.env.OLLAMA_BASE_URL || "http://localhost:11434",
  };

  console.log('🤖 Initializing Ollama client:', {
    host: ollamaConfig.host,
    model: process.env.OLLAMA_MODEL || "gemma3:12b",
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7
  });

  // Return the Ollama client instance
  const client = new Ollama(ollamaConfig);
  
  return {
    client,
    model: process.env.OLLAMA_MODEL || "gemma3:12b",
    temperature: parseFloat(process.env.OLLAMA_TEMPERATURE) || 0.7
  };
}

/**
 * Test Ollama connection
 * @returns {Promise<boolean>} True if Ollama is accessible
 */
async function testOllamaConnection() {
  try {
    const response = await fetch(
      `${process.env.OLLAMA_BASE_URL || "http://localhost:11434"}/api/tags`
    );
    
    if (!response.ok) {
      throw new Error(`Ollama API returned status ${response.status}`);
    }
    
    const data = await response.json();
    const modelName = process.env.OLLAMA_MODEL || "gemma2:2b";
    const hasModel = data.models.some(m => m.name.includes(modelName.split(':')[0]));
    
    if (!hasModel) {
      console.warn(`⚠️  Model ${modelName} not found. Available models:`, 
        data.models.map(m => m.name));
    }
    
    return true;
  } catch (error) {
    console.error('❌ Ollama connection test failed:', error.message);
    return false;
  }
}

module.exports = {
  createOllamaClient,
  testOllamaConnection
};
