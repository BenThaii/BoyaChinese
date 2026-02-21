# Frontend Setup Guide

This guide covers setting up both the web admin interface and iOS mobile app.

## Prerequisites

- Node.js 18+ and npm
- For iOS app: Expo CLI and iOS Simulator (macOS) or Android Studio (any OS)
- Backend API running on `http://localhost:3000`

## Web Admin Interface

### Installation

```bash
# Install dependencies for the entire monorepo
npm install

# Or install just for frontend
cd packages/frontend
npm install
```

### Development

```bash
# From root directory
npm run dev:frontend

# Or from packages/frontend
npm run dev
```

The web admin will be available at `http://localhost:5173`

### Features

1. **Vocabulary Management** (`/:username/admin`)
   - View all vocabulary entries
   - Edit any field inline
   - Delete entries with confirmation

2. **Vocabulary Upload** (`/:username/upload`)
   - Add new vocabulary entries
   - Preview automatic translations before saving
   - All fields editable

3. **Vocabulary Sharing** (`/:username/share`)
   - Browse other users' vocabulary
   - Preview entries before importing
   - Import entire chapters

4. **Database Admin** (`/database-admin`)
   - Password protected (password: `BoyaChineseBach`)
   - Export complete database backup
   - Import and restore from backup file

### Usage Example

1. Navigate to `http://localhost:5173`
2. Click on "User1 - Vocabulary Management"
3. Add, edit, or delete vocabulary entries
4. Use the upload page to add new entries with translation preview

## iOS Mobile App

### Installation

```bash
# Install Expo CLI globally (if not already installed)
npm install -g expo-cli

# Install dependencies
cd packages/ios-app
npm install
```

### Development

```bash
# From root directory
npm run dev:ios

# Or from packages/ios-app
npm start
```

Then:
- Press `i` for iOS simulator (macOS only)
- Press `a` for Android emulator
- Scan QR code with Expo Go app on physical device

### Configuration

Update the API URL in `packages/ios-app/src/api/client.ts`:

```typescript
// For iOS simulator on macOS
const API_BASE_URL = 'http://localhost:3000/api';

// For Android emulator
const API_BASE_URL = 'http://10.0.2.2:3000/api';

// For physical device (use your computer's IP)
const API_BASE_URL = 'http://192.168.1.x:3000/api';
```

### Features

1. **Flashcards**
   - Three modes: Chinese→Meanings, English→Chinese, Vietnamese→Chinese
   - Chapter range filtering
   - Show/hide answer functionality

2. **Text Comprehension**
   - Generate AI texts from your vocabulary
   - Tap characters to see details
   - Pinyin display

3. **Settings**
   - Configure username
   - Set chapter range for practice

### Usage Example

1. Open the app in simulator/emulator
2. Go to Settings and set your username
3. Return to home and select Flashcards
4. Choose a mode and start practicing

## Project Structure

```
packages/
├── backend/              # Backend API (already implemented)
├── frontend/             # Web admin interface (React + Vite)
│   ├── src/
│   │   ├── api/         # API client
│   │   ├── pages/       # Page components
│   │   ├── App.tsx      # Main app with routing
│   │   └── index.css    # Global styles
│   └── package.json
└── ios-app/             # Mobile app (React Native + Expo)
    ├── src/
    │   ├── api/         # API client
    │   └── screens/     # Screen components
    ├── App.tsx          # Main app with navigation
    └── package.json
```

## Development Workflow

### Full Stack Development

1. Start the backend:
```bash
npm run dev:backend
```

2. Start the web admin (in another terminal):
```bash
npm run dev:frontend
```

3. Start the mobile app (in another terminal):
```bash
npm run dev:ios
```

### Testing

```bash
# Test backend only
npm run test:backend

# Test all packages
npm test
```

## Environment Variables

### Web Admin (.env)

Create `packages/frontend/.env`:
```
VITE_API_URL=http://localhost:3000/api
```

### iOS App

Update `packages/ios-app/src/api/client.ts` directly with your API URL.

## Deployment

### Web Admin

```bash
cd packages/frontend
npm run build
```

Deploy the `dist/` folder to any static hosting service (Vercel, Netlify, etc.)

### iOS App

For production builds, follow the [Expo build documentation](https://docs.expo.dev/build/introduction/).

## Troubleshooting

### Web Admin

**Issue**: API requests fail with CORS errors
- **Solution**: Ensure backend is running and CORS is configured correctly

**Issue**: Routes not working after refresh
- **Solution**: Configure your hosting to redirect all routes to index.html

### iOS App

**Issue**: Cannot connect to API
- **Solution**: Check API_BASE_URL is correct for your environment
- For iOS simulator: use `localhost`
- For Android emulator: use `10.0.2.2`
- For physical device: use your computer's local IP

**Issue**: Expo app crashes on startup
- **Solution**: Clear cache with `expo start -c`

## Next Steps

1. Implement persistent storage for iOS app settings
2. Add TTS pronunciation to iOS app
3. Improve error handling and loading states
4. Add user authentication (optional)
5. Implement offline mode for mobile app
6. Add progress tracking and statistics
