# Chinese Learning App - Web Admin

This is the web admin interface for the Chinese Learning App, built with React and Vite.

## Features

- **Vocabulary Management**: View, edit, and delete vocabulary entries
- **Vocabulary Upload**: Add new vocabulary with automatic translation preview
- **Vocabulary Sharing**: Import vocabulary from other users by chapter
- **Database Admin**: Password-protected backup and restore functionality

## Setup

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Configuration

The app is configured to proxy API requests to `http://localhost:3000` in development mode.

Update the API base URL in `src/api/client.ts` for production:
```typescript
const API_BASE_URL = import.meta.env.VITE_API_URL || 'https://your-api-domain.com/api';
```

## Routes

- `/` - Home page with user links
- `/:username/admin` - Vocabulary management for a user
- `/:username/upload` - Add new vocabulary for a user
- `/:username/share` - Import vocabulary from other users
- `/database-admin` - Database backup and restore (password: BoyaChineseBach)

## Project Structure

```
frontend/
├── src/
│   ├── api/
│   │   └── client.ts              # API client and type definitions
│   ├── pages/
│   │   ├── VocabularyManagement.tsx  # Edit/delete vocabulary
│   │   ├── VocabularyUpload.tsx      # Add new vocabulary
│   │   ├── VocabularySharing.tsx     # Import from other users
│   │   └── DatabaseAdmin.tsx         # Backup/restore
│   ├── App.tsx                    # Main app with routing
│   ├── main.tsx                   # Entry point
│   └── index.css                  # Global styles
```

## TODO

- [ ] Add form validation
- [ ] Implement chapter filtering in vocabulary management
- [ ] Add pagination for large vocabulary lists
- [ ] Improve mobile responsiveness
- [ ] Add loading states and error messages
- [ ] Implement user authentication (optional)
