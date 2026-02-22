import { getPool, initDatabase, closeDatabase } from '../src/config/database';

async function clearSentences() {
  try {
    await initDatabase();
    const pool = getPool();
    
    console.log('Clearing all pre-generated sentences...');
    await pool.query('DELETE FROM pre_generated_sentences');
    console.log('✓ All sentences cleared successfully');
    
    await closeDatabase();
  } catch (error) {
    console.error('Error clearing sentences:', error);
    process.exit(1);
  }
}

clearSentences();
