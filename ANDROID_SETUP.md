# Android Testing Setup for Chinese Learning App

This guide will help you set up Android testing for the React Native app on Windows.

## Prerequisites

- Windows 10/11
- Node.js installed
- At least 8GB RAM (16GB recommended)
- 10GB free disk space

## Step 1: Install Android Studio

1. Download Android Studio from: https://developer.android.com/studio
2. Run the installer and follow the setup wizard
3. Choose "Standard" installation type
4. Wait for all components to download (this may take 15-30 minutes)

## Step 2: Configure Android SDK

1. Open Android Studio
2. Click "More Actions" → "SDK Manager" (or go to File → Settings → Appearance & Behavior → System Settings → Android SDK)
3. In the "SDK Platforms" tab, check:
   - Android 13.0 (Tiramisu) - API Level 33
   - Android 12.0 (S) - API Level 31
4. In the "SDK Tools" tab, check:
   - Android SDK Build-Tools
   - Android Emulator
   - Android SDK Platform-Tools
   - Intel x86 Emulator Accelerator (HAXM installer) - if you have Intel CPU
5. Click "Apply" and wait for downloads to complete

## Step 3: Set Environment Variables

1. Open "Edit the system environment variables" from Windows search
2. Click "Environment Variables"
3. Under "User variables", click "New" and add:
   - Variable name: `ANDROID_HOME`
   - Variable value: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk`
   (Replace YOUR_USERNAME with your actual Windows username)

4. Find the "Path" variable under "User variables", click "Edit", then "New" and add these paths:
   ```
   %ANDROID_HOME%\platform-tools
   %ANDROID_HOME%\emulator
   %ANDROID_HOME%\tools
   %ANDROID_HOME%\tools\bin
   ```

5. Click "OK" on all dialogs
6. **IMPORTANT**: Close and reopen any terminal windows for changes to take effect

## Step 4: Verify Installation

Open a new PowerShell or Command Prompt and run:

```bash
adb --version
```

You should see the Android Debug Bridge version. If you get "command not found", restart your computer and try again.

## Step 5: Create Android Virtual Device (AVD)

1. Open Android Studio
2. Click "More Actions" → "Virtual Device Manager" (or Tools → Device Manager)
3. Click "Create Device"
4. Select a device definition (recommended: Pixel 5 or Pixel 6)
5. Click "Next"
6. Select a system image:
   - Choose "Tiramisu" (API Level 33) or "S" (API Level 31)
   - Click "Download" next to the system image if not already downloaded
   - Wait for download to complete
7. Click "Next"
8. Give your AVD a name (e.g., "Pixel_5_API_33")
9. Click "Finish"

## Step 6: Start the Emulator

Option A - From Android Studio:
1. Open Device Manager in Android Studio
2. Click the "Play" button next to your AVD
3. Wait for the emulator to boot (first boot may take 2-3 minutes)

Option B - From Command Line:
```bash
emulator -avd Pixel_5_API_33
```

## Step 7: Start Your Backend Services

Make sure these are running:

1. Backend server:
```bash
cd packages/backend
npm run dev
```

2. LibreTranslate (in a separate terminal):
```bash
docker-compose up
```

## Step 8: Verify App API Configuration

The app folder is called `ios-app` but the React Native code works on both iOS and Android. The API configuration is already set up correctly:

1. Open `packages/ios-app/src/api/client.ts`
2. Verify it automatically detects the platform:
   - Android emulator: Uses `http://10.0.2.2:3000/api` (special IP that maps to your computer's localhost)
   - iOS simulator: Uses `http://localhost:3000/api`
   
**Note**: This guide only covers Android testing on Windows. To test on an iPhone, you would need a Mac with Xcode (iOS development is not possible on Windows).

## Step 9: Understanding the Windows Limitation

**IMPORTANT**: Expo has a known bug on Windows where Metro bundler tries to create folders with colons in the name (`node:sea`), which Windows doesn't allow. This error occurs in Expo's core code before any configuration can fix it.

**This means you CANNOT use Expo development server on Windows for this app.**

## Working Alternatives

You have two options to test the mobile app:

### Option A: Use Expo Go on Physical Android Device (Recommended)

This completely bypasses the Windows Metro bundler issue:

1. Install "Expo Go" from Google Play Store on your Android phone

2. Find your computer's IP address:
```powershell
ipconfig
```
Look for "IPv4 Address" (e.g., 192.168.1.100)

3. Update the API configuration to use your computer's IP:
   - Open `packages/ios-app/src/api/client.ts`
   - In the `getApiBaseUrl()` function, change the Android section to:
   ```typescript
   if (Platform.OS === 'android') {
     return 'http://YOUR_COMPUTER_IP:3000/api';  // Replace with your actual IP
   }
   ```

4. Make sure your phone and computer are on the same WiFi network

5. Start Expo with tunnel mode:
```powershell
cd packages/ios-app
npx expo start --tunnel
```

6. Scan the QR code with Expo Go app on your phone

7. The app will load and connect to your backend API

### Option B: Use the Web Admin Interface (Easiest)

The web admin interface has all the same functionality and works perfectly on Windows:

1. Start the backend:
```powershell
cd packages/backend
npm run dev
```

2. Start LibreTranslate:
```powershell
docker-compose up
```

3. Start the web frontend:
```powershell
cd packages/frontend
npm run dev
```

4. Open http://localhost:5173 in your browser

5. You can access this from your phone's browser too (use your computer's IP address)

The web interface includes:
- Vocabulary management
- Vocabulary upload with translation preview
- Pinyin generation
- TTS pronunciation
- Vocabulary sharing
- Database backup

**Recommendation**: Use the web admin interface for development and testing. It's fully functional and works on all devices including mobile browsers.

## Step 10: Testing the App

Once you've chosen one of the alternatives above, you can test the mobile app functionality.

1. You should see the Home screen with navigation options
2. Test the Flashcard screen
3. Test the Comprehension screen
4. Test the Settings screen
5. All API calls should work with your backend at `http://10.0.2.2:3000`

## Troubleshooting

### Emulator won't start
- Make sure virtualization is enabled in BIOS
- Try installing HAXM manually: `C:\Users\YOUR_USERNAME\AppData\Local\Android\Sdk\extras\intel\Hardware_Accelerated_Execution_Manager\intelhaxm-android.exe`

### "adb: command not found"
- Verify ANDROID_HOME is set correctly
- Restart your computer
- Make sure Path variables are added correctly

### App won't connect to backend
- Use `http://10.0.2.2:3000` instead of `http://localhost:3000` in the emulator
- Make sure backend is running on port 3000
- Check Windows Firewall isn't blocking port 3000

### Expo build fails
- Clear cache: `npx expo start --clear`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

### Emulator is slow
- Allocate more RAM to the AVD (edit AVD settings in Device Manager)
- Close other applications
- Use a system image with Google APIs (not Google Play) for better performance

## Using a Physical Android Device

If you have an Android phone:

1. Enable Developer Options on your phone:
   - Go to Settings → About Phone
   - Tap "Build Number" 7 times
   
2. Enable USB Debugging:
   - Go to Settings → Developer Options
   - Enable "USB Debugging"

3. Connect phone via USB

4. Run `adb devices` to verify connection

5. Update API URL in `packages/ios-app/src/api/client.ts` to your computer's IP address

6. Run `npx expo start` and press `a`

## Next Steps

Once Android testing is working, you can:
- Test all features (flashcards, comprehension, settings)
- Build a standalone APK for distribution
- Test on multiple Android versions
- Profile performance

For building production APKs, see: https://docs.expo.dev/build/setup/
