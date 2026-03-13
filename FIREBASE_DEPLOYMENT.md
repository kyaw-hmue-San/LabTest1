# Firebase Hosting Deployment Notes

This project is designed to deploy one web component to Firebase Hosting.
For exam reliability, deploy the static landing page in `hosting/`.

## Prerequisites

- Node.js installed
- Firebase CLI installed (`npm install -g firebase-tools`)
- Existing Firebase project

## Commands

```bash
firebase login
firebase init hosting
firebase deploy --only hosting
```

## Hosting Init Answers

- Public directory: `hosting`
- Configure as SPA: `Yes`
- Set up GitHub Action: `No` (optional)
- Overwrite `index.html`: `No`

## Optional: Deploy Expo Web Build Instead

```bash
npm install
npx expo export --platform web
firebase init hosting
```

Then set `public` directory to Expo export output (commonly `dist`).

## Final URL

`<PASTE_FIREBASE_URL_HERE>`
