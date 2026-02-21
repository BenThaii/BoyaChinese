# LibreTranslate Self-Hosted Setup Guide

This guide will help you set up LibreTranslate locally using Docker for real Chinese translations.

## Prerequisites

1. **Docker Desktop** for Windows
   - Download from: https://www.docker.com/products/docker-desktop/
   - Install and start Docker Desktop

## Setup Steps

### 1. Start LibreTranslate

Open a terminal in your project root and run:

```bash
docker-compose up -d
```

This will:
- Download the LibreTranslate Docker image (~2GB)
- Start LibreTranslate on port 5000
- Load only English, Chinese, and Vietnamese language models (saves space)
- Create a `libretranslate-data` folder for persistent storage

### 2. Wait for Models to Download

The first time you start LibreTranslate, it needs to download language models. This can take 5-10 minutes.

Check the logs to see progress:

```bash
docker-compose logs -f libretranslate
```

Wait until you see: "Running on http://0.0.0.0:5000"

Press `Ctrl+C` to exit the logs.

### 3. Test LibreTranslate

Open your browser and go to:
```
http://localhost:5000
```

You should see the LibreTranslate web interface. Try translating some Chinese text to test it.

### 4. Restart Your Backend

Stop your backend server (`Ctrl+C`) and restart it:

```bash
npm run dev:backend
```

The backend will now use your local LibreTranslate instance at `http://localhost:5000`.

### 5. Test Translation in Your App

Go to http://localhost:5173/user1/upload and try the "Preview Translation" button with a Chinese character like `学` or `号码`.

You should now see real translations instead of mock placeholders!

## Managing LibreTranslate

### Stop LibreTranslate
```bash
docker-compose stop
```

### Start LibreTranslate
```bash
docker-compose start
```

### View Logs
```bash
docker-compose logs -f libretranslate
```

### Remove LibreTranslate (keeps data)
```bash
docker-compose down
```

### Remove Everything (including data)
```bash
docker-compose down -v
rm -rf libretranslate-data
```

## Troubleshooting

### Port 5000 Already in Use

If port 5000 is already in use, edit `docker-compose.yml` and change:
```yaml
ports:
  - "5001:5000"  # Use port 5001 instead
```

Then update `packages/backend/.env`:
```
LIBRETRANSLATE_URL=http://localhost:5001/translate
```

### Translations Are Slow

The first translation for each language pair is slower because models need to load. Subsequent translations will be faster.

### Out of Memory

LibreTranslate requires at least 4GB of RAM. If you're running low on memory:
1. Close other applications
2. Increase Docker Desktop's memory limit in Settings → Resources

## Performance Tips

- Keep LibreTranslate running in the background for faster translations
- The language models are cached in `libretranslate-data/` folder
- Translations are processed locally, so no internet required after setup

## Alternative: Use Public API

If you don't want to self-host, you can use the public LibreTranslate API (with rate limits):

In `packages/backend/src/services/TranslationService.ts`, change:
```typescript
this.apiUrl = 'https://libretranslate.com/translate';
```

Note: The public API may have rate limits and slower response times.
