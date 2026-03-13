# Smart Class Check-in & Learning Reflection App

This project is an MVP React Native application (Expo) for the Mobile Application Development midterm.
It verifies classroom presence and participation using GPS, QR scan, and reflection input.

Instructor-approved note: this implementation uses React Native instead of Flutter due to environment setup constraints.

## Project Description

The app supports two core class actions:

- Before class: student check-in with GPS, timestamp, QR code, and pre-class reflection
- After class: class completion with GPS, timestamp, QR code, and post-class reflection

Data is persisted locally using SQLite on native and localStorage fallback on web.

## Implemented Features

- Home screen with quick actions
- History screen with filters (All, Today, Completed, Checked-in)
  - Includes a visible Back to Home button inside the screen
- Check-in screen
  - Student ID and class code
  - Previous topic and expected topic input
  - Mood selection (1-5)
  - GPS capture
  - QR scan required
  - Validation + save (`status = checked_in`)
  - One check-in per student/class/day
- Finish class screen
  - Student ID and class code
  - Learned today + feedback input
  - GPS capture
  - QR scan required and must match check-in QR
  - Validation + update latest open session (`status = completed`)
- Device-bound Student ID lock to reduce impersonation risk

## Tech Stack

- React Native (Expo)
- `expo-sqlite` for local storage
- `expo-location` for GPS
- `expo-camera` for QR scanning
- `@react-navigation/native` + native stack for navigation

## Project Structure

- `App.js`
- `src/data/database.native.js`
- `src/data/database.web.js`
- `src/components/QrScannerModal.js`
- `src/screens/HomeScreen.js`
- `src/screens/CheckInScreen.js`
- `src/screens/FinishClassScreen.js`
- `src/screens/HistoryScreen.js`
- `firebase.json`
- `.firebaserc`
- `dist/` (Expo web export output used for Firebase Hosting)

## Setup Instructions

1. Install Node.js (LTS).
2. Install Expo CLI (optional): `npm install -g expo-cli`
3. In project root:

```bash
npm install
```

4. Run on Android emulator/device:

```bash
npx expo start --android
```

5. Run on iOS simulator (macOS only):

```bash
npx expo start --ios
```

6. Run web preview:

```bash
npx expo start --web
```

## Permissions Needed

- Camera permission for QR code scanning
- Foreground location permission for in-class presence verification
- These are configured in `app.json` for Expo-managed workflow

## Data Behavior Summary

- One table: `class_sessions`
- Native (Android/iOS): `expo-sqlite` local SQLite database
- Web: localStorage fallback with the same session lifecycle logic
- Check-in inserts a full pre-class record with `status = checked_in`
- Finish class finds latest open session by student ID + class code and updates it to `status = completed`
- Check-in is limited to once per student/class/day
- Student ID can be bound per device (first use) and must remain consistent

## Firebase Hosting Deployment (React Native/Expo)

Deploy the Expo web build from `dist/` (this is the current live setup).

Use this sequence after Firebase CLI is available:

```bash
npx expo export --platform web --output-dir dist
firebase deploy --only hosting
```

Current `firebase.json` already points Hosting public directory to `dist`.

If you run commands in Windows PowerShell with restricted execution policy, use:

```bash
firebase.cmd deploy --only hosting
```

One-time init reference (already completed in this project):

- Select your Firebase project
- Set public directory to: `dist`
- Configure as single-page app: `Yes`
- Overwrite `index.html`: `No`

Final deployment URL:

`https://labtest-1-s1-401.web.app`

## Firebase Configuration Notes

- A Firebase project is required for Hosting deployment.
- This MVP stores app records locally in SQLite.
- Optional enhancement: sync records to Firestore.

## Known Limitations

- No user authentication
- No instructor/admin dashboard
- No cloud sync in MVP

## Future Improvements

- Add login with Firebase Auth
- Add Firestore sync and reporting dashboard
- Add stronger QR validation rules per class session
