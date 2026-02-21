# Chinese Learning App

A multi-platform web application for learning Chinese vocabulary through interactive flashcards, AI-generated text comprehension exercises, and comprehensive vocabulary management.

## Project Structure

This is a monorepo containing:

- `packages/backend` - Express.js API server with TypeScript
- `packages/frontend` - React web application with TypeScript

## Prerequisites

- Node.js 18+ and npm
- MySQL 8.0+ or PostgreSQL 14+
- Google Cloud API credentials (Translate API and AI Studio API)

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Configure Backend

```bash
cd packages/backend
cp .env.example .env
```

Edit `.env` and configure:
- Database connection details (MySQL)
- Google Translate API key
- Google AI Studio API key
- Admin password for database backup/restore

### 3. Configure Frontend

```bash
cd packages/frontend
cp .env.example .env
```

Edit `.env` if you need to change the API URL.

### 4. Set Up Database

Create a MySQL database:

```sql
CREATE DATABASE chinese_learning_app CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

The application will automatically create the required tables on first run.

### 5. Run Development Servers

From the root directory:

```bash
# Run both frontend and backend
npm run dev
```

Or run them separately:

```bash
# Backend (from packages/backend)
npm run dev

# Frontend (from packages/frontend)
npm run dev
```

The backend will run on http://localhost:3000 and the frontend on http://localhost:5173.

## API Endpoints

- Health check: `GET /health`
- More endpoints will be added as features are implemented

## Technology Stack

### Backend
- Express.js - Web framework
- TypeScript - Type safety
- MySQL2 - Database client
- Google Cloud Translate - Translation service
- Google Generative AI - AI text generation
- edge-tts - Text-to-speech
- dotenv - Environment configuration

### Frontend
- React 18 - UI framework
- TypeScript - Type safety
- Vite - Build tool and dev server
- React Router - Routing
- Axios - HTTP client

## Development

- Backend source: `packages/backend/src/`
- Frontend source: `packages/frontend/src/`
- Build output: `packages/*/dist/`

## License

Private project
