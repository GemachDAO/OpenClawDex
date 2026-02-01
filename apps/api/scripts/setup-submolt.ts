/**
 * Setup m/openclaw Submolt on Moltbook
 * 
 * One-time script to create the OpenClawDex community on Moltbook.
 * Run this once with a valid Moltbook API key to create the submolt.
 * 
 * Usage:
 *   MOLTBOOK_API_KEY=your_api_key npx tsx scripts/setup-submolt.ts
 * 
 * Or if already set in .env:
 *   npx tsx scripts/setup-submolt.ts
 */

import { createOpenClawSubmolt, getSubmolt, subscribeToSubmolt } from '../src/services/moltbook.service.js';

const MOLTBOOK_API_KEY = process.env.MOLTBOOK_API_KEY;

async function main() {
  console.log('🦞 OpenClawDex Submolt Setup\n');
  console.log('═'.repeat(50));

  // Check for API key
  if (!MOLTBOOK_API_KEY) {
    console.error('❌ Error: MOLTBOOK_API_KEY environment variable is required');
    console.log('\nUsage:');
    console.log('  MOLTBOOK_API_KEY=your_api_key npx tsx scripts/setup-submolt.ts');
    console.log('\nOr add MOLTBOOK_API_KEY to your .env file');
    process.exit(1);
  }

  console.log('📋 API Key: ' + MOLTBOOK_API_KEY.slice(0, 15) + '...\n');

  // Check if submolt already exists
  console.log('🔍 Checking if m/openclaw already exists...');
  const existing = await getSubmolt(MOLTBOOK_API_KEY, 'openclaw');
  
  if (existing) {
    console.log('✅ Submolt m/openclaw already exists!');
    console.log('\n📊 Submolt Info:');
    console.log(`   Name: m/${existing.name}`);
    console.log(`   Display Name: ${existing.display_name}`);
    console.log(`   Description: ${existing.description}`);
    console.log(`   Subscribers: ${existing.subscriber_count}`);
    console.log(`   Posts: ${existing.post_count}`);
    console.log(`   Created: ${existing.created_at}`);
    return;
  }

  // Create the submolt
  console.log('🚀 Creating m/openclaw submolt...');
  const result = await createOpenClawSubmolt(MOLTBOOK_API_KEY);

  if (!result.success) {
    console.error('❌ Failed to create submolt:', result.error);
    process.exit(1);
  }

  console.log('✅ Successfully created m/openclaw!');
  console.log('\n📊 Submolt Info:');
  console.log(`   Name: m/${result.submolt?.name}`);
  console.log(`   Display Name: ${result.submolt?.display_name}`);
  console.log(`   Description: ${result.submolt?.description}`);

  // Auto-subscribe the creating agent
  console.log('\n📫 Subscribing to m/openclaw...');
  const subscribed = await subscribeToSubmolt(MOLTBOOK_API_KEY, 'openclaw');
  
  if (subscribed) {
    console.log('✅ Subscribed to m/openclaw');
  } else {
    console.log('⚠️  Could not auto-subscribe (may already be subscribed)');
  }

  console.log('\n═'.repeat(50));
  console.log('🎉 Setup complete!');
  console.log('\nNext steps:');
  console.log('1. Visit https://www.moltbook.com/m/openclaw');
  console.log('2. Start posting trades with postTrade()');
  console.log('3. Invite other agents to join the community');
}

main().catch((error) => {
  console.error('❌ Unexpected error:', error);
  process.exit(1);
});
