# Setup Guide

## Quick Start

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up MySQL Database

#### Option A: Automatic Setup (Recommended)
The application will automatically create tables when you first run it. Just create the database:

```sql
CREATE DATABASE chinese_learning_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

#### Option B: Manual Setup
Run the SQL script:

```bash
mysql -u root -p < packages/backend/database/setup.sql
```

### 3. Configure Environment Variables

#### Backend Configuration
```bash
cd packages/backend
cp .env.example .env
```

Edit `packages/backend/.env`:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=chinese_learning_app

GOOGLE_TRANSLATE_API_KEY=your_google_translate_api_key
GOOGLE_AI_API_KEY=your_google_ai_studio_api_key

PORT=3000
NODE_ENV=development

ADMIN_PASSWORD=BoyaChineseBach
```

#### Frontend Configuration
```bash
cd packages/frontend
cp .env.example .env
```

The default configuration should work for local development.

### 4. Get API Keys

#### Google Translate API
1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Enable "Cloud Translation API"
4. Create credentials (API Key)
5. Copy the API key to `GOOGLE_TRANSLATE_API_KEY` in `.env`

#### Google AI Studio API
1. Go to [Google AI Studio](https://makersuite.google.com/app/apikey)
2. Create an API key
3. Copy the API key to `GOOGLE_AI_API_KEY` in `.env`

### 5. Run the Application

#### Development Mode
From the root directory:
```bash
npm run dev
```

This will start both frontend and backend servers.

Or run them separately:

```bash
# Terminal 1 - Backend
cd packages/backend
npm run dev

# Terminal 2 - Frontend
cd packages/frontend
npm run dev
```

#### Access the Application
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000
- Health Check: http://localhost:3000/health

### 6. Verify Setup

Check the backend health endpoint:
```bash
curl http://localhost:3000/health
```

Expected response:
```json
{
  "status": "ok",
  "message": "Chinese Learning App API is running"
}
```

## Troubleshooting

### Database Connection Issues
- Verify MySQL is running: `mysql -u root -p`
- Check database exists: `SHOW DATABASES;`
- Verify credentials in `.env` file
- Check MySQL port (default: 3306)

### API Key Issues
- Ensure API keys are correctly copied (no extra spaces)
- Verify APIs are enabled in Google Cloud Console
- Check API key restrictions/permissions

### Port Conflicts
If ports 3000 or 5173 are already in use:
- Backend: Change `PORT` in `packages/backend/.env`
- Frontend: Change port in `packages/frontend/vite.config.ts`

## Next Steps

After successful setup:
1. Create your first vocabulary entry via the Admin Interface
2. Set up chapter ranges for practice
3. Start learning with flashcards!

For more information, see [README.md](README.md)
