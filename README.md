# Time-Plan

Time logging for **Vicharanashala Lab for Education Design**. Employees sign in, start a timer when they begin work, and stop it with a note on what they worked on. Their entries show up as a weekly timesheet that can be exported to CSV.

Built with React (Vite) and Firebase (Authentication + Firestore). Hosted on Vercel as a static site.

## Features

- Email/password sign-up and sign-in (Firebase Auth)
- Start/stop timer with an optional project/task and required work notes; the running timer and draft notes survive page reloads and work across devices
- Log time manually for work done earlier
- Today and this-week totals
- Weekly timesheet grouped by day, with previous/next week navigation, delete, and CSV export
- Each employee can only see their own entries (enforced by `firestore.rules`)

## Firebase setup

1. Create a project at https://console.firebase.google.com.
2. **Authentication → Sign-in method → Email/Password → Enable.**
3. **Firestore Database → Create database** (production mode).
4. **Firestore → Rules:** paste the contents of `firestore.rules` and publish.
5. **Project settings → Your apps → Add app → Web**, then copy the config values into the env vars below.
6. After deploying, add your Vercel domain under **Authentication → Settings → Authorized domains**.

## Environment variables

Copy `.env.example` to `.env.local` for local work, and add the same keys in Vercel → Project → Settings → Environment Variables:

```
VITE_FIREBASE_API_KEY
VITE_FIREBASE_AUTH_DOMAIN
VITE_FIREBASE_PROJECT_ID
VITE_FIREBASE_STORAGE_BUCKET
VITE_FIREBASE_MESSAGING_SENDER_ID
VITE_FIREBASE_APP_ID
```

These are Firebase's public web config, not secrets. Access is protected by the Firestore rules.

## Local development

```
npm install
npm run dev
```

To develop without a real Firebase project, run the emulators (needs Java) and set `VITE_USE_EMULATOR=true` with `VITE_FIREBASE_PROJECT_ID=demo-log`:

```
npm run emulators
npm run dev
```

## Deploy to Vercel

Import the repo in Vercel. The Vite framework preset is detected automatically (build `npm run build`, output `dist`). Add the env vars above and deploy. `vercel.json` rewrites all paths to `index.html` so client-side routes work on refresh.
