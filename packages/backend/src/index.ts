import dotenv from 'dotenv';
import { resolve } from 'path';

// Load environment variables FIRST before any other imports
// Specify the path to .env file explicitly
const envPath = resolve(__dirname, '../.env');
console.log('[ENV] Loading .env from:', envPath);
const result = dotenv.config({ path: envPath });

if (result.error) {
  console.error('[ENV] Error loading .env file:', result.error);
} else {
  console.log('[ENV] .env file loaded successfully');
  console.log('[ENV] GOOGLE_AI_API_KEY:', process.env.GOOGLE_AI_API_KEY ? `${process.env.GOOGLE_AI_API_KEY.substring(0, 10)}...` : 'NOT SET');
}

import express from 'express';
import cors from 'cors';
import { join } from 'path';
import { mkdir } from 'fs/promises';
import { initDatabase } from './config/database';
import flashcardRoutes from './routes/flashcard.routes';
import vocabularyRoutes from './routes/vocabulary.routes';
import comprehensionRoutes from './routes/comprehension.routes';
import ttsRoutes from './routes/tts.routes';
import adminRoutes from './routes/admin.routes';

// Import config AFTER dotenv has loaded
import { config } from './config/env';

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Create temp audio directory if it doesn't exist
const audioDir = join(process.cwd(), 'temp', 'audio');
mkdir(audioDir, { recursive: true }).catch(console.error);

// Serve static audio files
app.use('/audio', express.static(audioDir));

// Log API key status (without revealing the actual key)
console.log('=== API Configuration ===');
console.log('Google Translate API Key:', config.google.translateApiKey ? `Set (${config.google.translateApiKey.substring(0, 10)}...)` : 'NOT SET');
console.log('Google AI API Key:', config.google.aiApiKey ? `Set (${config.google.aiApiKey.substring(0, 10)}...)` : 'NOT SET');
console.log('========================');

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Chinese Learning App API is running' });
});

// API Routes
app.use('/api', flashcardRoutes);
app.use('/api', vocabularyRoutes);
app.use('/api', comprehensionRoutes);
app.use('/api', ttsRoutes);
app.use('/api', adminRoutes);

// Initialize database and start server
async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
