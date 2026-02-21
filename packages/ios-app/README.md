# Chinese Learning App - iOS/Mobile

This is the mobile application for the Chinese Learning App, built with React Native and Expo.

## Features

- **Flashcards**: Three modes for vocabulary practice
  - Chinese → Meanings (Pinyin, Vietnamese, English)
  - English → Chinese
  - Vietnamese → Chinese
- **Text Comprehension**: AI-generated reading texts with interactive character lookup
- **Settings**: Configure username and chapter range

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Run on iOS simulator:
```bash
npm run ios
```

4. Run on Android emulator:
```bash
npm run android
```

## Configuration

Update the API base URL in `src/api/client.ts` to point to your backend server.

For local development, use your machine's IP address instead of localhost:
```typescript
const API_BASE_URL = 'http://192.168.1.x:3000/api';
```

## Project Structure

```
ios-app/
├── App.tsx                 # Main app component with navigation
├── src/
│   ├── api/
│   │   └── client.ts      # API client and type definitions
│   └── screens/
│       ├── HomeScreen.tsx          # Home screen with navigation
│       ├── FlashcardScreen.tsx     # Flashcard practice
│       ├── ComprehensionScreen.tsx # Text comprehension
│       └── SettingsScreen.tsx      # User settings
```

## TODO

- [ ] Implement persistent storage for username and chapter range
- [ ] Add TTS pronunciation functionality
- [ ] Add offline mode with local caching
- [ ] Implement progress tracking
- [ ] Add animations and transitions
- [ ] Improve error handling and user feedback
