/**
 * Gemini Model Discovery Utility
 *
 * Lists all available Gemini models from the Google AI API
 * Run with: npx tsx lib/gemini/utils/listModels.ts
 *
 * This script helps identify the correct model names to use in constants.ts
 */

// Load environment variables from .env file
import { config } from 'dotenv';
import { resolve } from 'path';

// Load .env from project root
config({ path: resolve(__dirname, '../../../.env') });

interface ModelInfo {
  name: string;
  displayName: string;
  description: string;
  supportedGenerationMethods: string[];
  inputTokenLimit?: number;
  outputTokenLimit?: number;
}

interface ModelsResponse {
  models: Array<{
    name: string;
    displayName: string;
    description?: string;
    supportedGenerationMethods?: string[];
    inputTokenLimit?: number;
    outputTokenLimit?: number;
  }>;
}

async function listAvailableModels(): Promise<void> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in environment');
    console.error('   Make sure your .env file contains GEMINI_API_KEY');
    process.exit(1);
  }

  console.log('🔍 Fetching available Gemini models...\n');

  try {
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      throw new Error(`API request failed: ${response.status} ${response.statusText}`);
    }

    const data = (await response.json()) as ModelsResponse;

    console.log('📋 Available Gemini Models:\n');
    console.log('Models supporting generateContent:');
    console.log('═'.repeat(100));

    // Filter models that support generateContent
    const relevantModels = data.models
      .filter((m) => m.supportedGenerationMethods?.includes('generateContent'))
      .map((m) => ({
        name: m.name.replace('models/', ''),
        displayName: m.displayName,
        description: m.description?.substring(0, 80) || 'No description',
        inputLimit: m.inputTokenLimit,
        outputLimit: m.outputTokenLimit,
      }));

    if (relevantModels.length === 0) {
      console.log('❌ No models found that support generateContent');
      return;
    }

    // Display all models
    relevantModels.forEach((model) => {
      console.log(`\n🔹 ${model.name}`);
      console.log(`   Display: ${model.displayName}`);
      console.log(`   Info: ${model.description}...`);
      if (model.inputLimit) {
        console.log(`   Input Limit: ${model.inputLimit.toLocaleString()} tokens`);
      }
      if (model.outputLimit) {
        console.log(`   Output Limit: ${model.outputLimit.toLocaleString()} tokens`);
      }
    });

    console.log('\n' + '═'.repeat(100));
    console.log(`\nTotal models found: ${relevantModels.length}`);

    // Highlight specific model families
    const gemini3Models = relevantModels.filter((m) => m.name.includes('gemini-3'));
    const gemini25Models = relevantModels.filter((m) =>
      m.name.includes('gemini-2.5') || m.name.includes('gemini-2-5')
    );
    const flashModels = relevantModels.filter((m) => m.name.includes('flash'));

    if (gemini3Models.length > 0) {
      console.log('\n🎯 Gemini 3 Models:');
      gemini3Models.forEach((m) => console.log(`   ✓ ${m.name}`));
    } else {
      console.log('\n⚠️  No Gemini 3 models found');
      console.log('   Gemini 3 may not be available for your API key yet');
    }

    if (gemini25Models.length > 0) {
      console.log('\n🎯 Gemini 2.5 Models:');
      gemini25Models.forEach((m) => console.log(`   ✓ ${m.name}`));
    }

    if (flashModels.length > 0) {
      console.log('\n⚡ Flash Models (Fast & Cost-Effective):');
      flashModels.forEach((m) => console.log(`   ✓ ${m.name}`));
    }

    console.log('\n' + '─'.repeat(100));
    console.log('\n💡 Tips:');
    console.log('   • Copy the exact model name (e.g., "gemini-2.5-flash") to use in constants.ts');
    console.log('   • Preview/experimental models may have "-preview" or "-exp" suffixes');
    console.log('   • Flash models are faster and cheaper than Pro models');
    console.log('   • Check rate limits at: https://ai.google.dev/pricing\n');

  } catch (error) {
    console.error('\n❌ Error fetching models:');
    if (error instanceof Error) {
      console.error('  ', error.message);
    } else {
      console.error('  ', error);
    }
    process.exit(1);
  }
}

// Run the script
listAvailableModels().catch((error) => {
  console.error('Unexpected error:', error);
  process.exit(1);
});
