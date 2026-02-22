import mysql from 'mysql2/promise';
import { config } from './env';

let pool: mysql.Pool;

export async function initDatabase() {
  pool = mysql.createPool({
    host: config.database.host,
    port: config.database.port,
    user: config.database.user,
    password: config.database.password,
    database: config.database.name,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0
  });

  // Test connection
  const connection = await pool.getConnection();
  console.log('Database connection established');
  connection.release();

  // Create tables if they don't exist
  await createTables();
}

async function createTables() {
  const connection = await pool.getConnection();
  
  try {
    // Create users table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        username VARCHAR(255) PRIMARY KEY,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create vocabulary_entries table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vocabulary_entries (
        id VARCHAR(36) PRIMARY KEY,
        username VARCHAR(255) NOT NULL,
        chinese_character VARCHAR(10) NOT NULL,
        pinyin VARCHAR(255) NOT NULL,
        han_vietnamese TEXT,
        modern_vietnamese TEXT,
        english_meaning TEXT,
        learning_note TEXT,
        chapter INTEGER NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        shared_from VARCHAR(255),
        INDEX idx_username_chapter (username, chapter),
        INDEX idx_chapter (chapter)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create vocabulary_sharing table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS vocabulary_sharing (
        id VARCHAR(36) PRIMARY KEY,
        source_username VARCHAR(255) NOT NULL,
        target_username VARCHAR(255) NOT NULL,
        chapter INTEGER NOT NULL,
        shared_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        vocabulary_count INTEGER NOT NULL,
        UNIQUE KEY unique_share (source_username, target_username, chapter),
        INDEX idx_target_chapter (target_username, chapter)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Create pre_generated_sentences table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS pre_generated_sentences (
        id VARCHAR(36) PRIMARY KEY,
        vocab_group_id INT NOT NULL,
        chinese_text TEXT NOT NULL,
        pinyin TEXT NOT NULL,
        used_characters JSON NOT NULL,
        generation_timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        INDEX idx_vocab_group (vocab_group_id)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
    `);

    // Migrate existing users from vocabulary_entries to users table
    await connection.query(`
      INSERT IGNORE INTO users (username)
      SELECT DISTINCT username FROM vocabulary_entries;
    `);

    console.log('Database tables created successfully');
  } finally {
    connection.release();
  }
}

export function getPool() {
  if (!pool) {
    throw new Error('Database pool not initialized. Call initDatabase() first.');
  }
  return pool;
}

export async function closeDatabase() {
  if (pool) {
    await pool.end();
    console.log('Database connection closed');
  }
}
