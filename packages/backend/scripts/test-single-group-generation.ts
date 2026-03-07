/**
 * Test script to generate phrases for a single vocab group
 * and verify exponential weighting is working
 */

import { PhraseGeneratorService } from '../src/services/PhraseGeneratorService';
import { initDatabase } from '../src/config/database';

async function testSingleGroupGeneration() {
  console.log('===== SINGLE GROUP GENERATION TEST =====\n');
  
  try {
    // Initialize database
    console.log('Initializing database...');
    await initDatabase();
    console.log('✓ Database initialized\n');
    
    const service = new PhraseGeneratorService();
    
    // Get vocab groups
    console.log('Step 1: Fetching vocab groups...');
    const groups = await service.getVocabGroups();
    
    if (groups.length === 0) {
      console.log('❌ No vocab groups found');
      return;
    }
    
    console.log(`✓ Found ${groups.length} vocab groups`);
    console.log('Groups:', groups.map(g => `Group ${g.id}: Chapters ${g.chapterStart}-${g.chapterEndpoint}`).join(', '));
    
    // Test with first group
    const testGroup = groups[0];
    console.log(`\nStep 2: Generating sentences for Group ${testGroup.id} (Chapters ${testGroup.chapterStart}-${testGroup.chapterEndpoint})...`);
    console.log('Watch for exponential weighting logs above...\n');
    
    const sentences = await service.generateSentencesForGroup(testGroup);
    
    console.log(`\n✓ Generated ${sentences.length} sentences`);
    console.log('\nSample sentences:');
    sentences.slice(0, 5).forEach((s, i) => {
      console.log(`  ${i + 1}. ${s.chineseText}`);
      console.log(`     Used: ${s.usedCharacters.slice(0, 10).join(', ')}${s.usedCharacters.length > 10 ? '...' : ''}`);
    });
    
    console.log('\n✓ Test completed successfully');
    
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    process.exit(0);
  }
}

testSingleGroupGeneration();
