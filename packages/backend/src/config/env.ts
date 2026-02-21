export const config = {
  database: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '3306'),
    user: process.env.DB_USER || 'root',
    password: process.env.DB_PASSWORD || '',
    name: process.env.DB_NAME || 'chinese_learning_app'
  },
  google: {
    translateApiKey: process.env.GOOGLE_TRANSLATE_API_KEY || '',
    aiApiKey: process.env.GOOGLE_AI_API_KEY || ''
  },
  server: {
    port: parseInt(process.env.PORT || '3000'),
    nodeEnv: process.env.NODE_ENV || 'development'
  },
  admin: {
    password: process.env.ADMIN_PASSWORD || 'BoyaChineseBach'
  }
};

export function validateConfig() {
  const errors: string[] = [];

  if (!config.google.translateApiKey) {
    errors.push('GOOGLE_TRANSLATE_API_KEY is not set');
  }

  if (!config.google.aiApiKey) {
    errors.push('GOOGLE_AI_API_KEY is not set');
  }

  if (!config.database.password && config.server.nodeEnv === 'production') {
    errors.push('DB_PASSWORD should be set in production');
  }

  return {
    valid: errors.length === 0,
    errors
  };
}
