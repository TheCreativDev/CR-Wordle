# CR Wordle - Firebase Setup Guide

## Quick Setup Steps

### 1. Update Firebase Configuration

Edit `js/firebase-config.js` and replace the placeholder values with your actual Firebase config:

```javascript
const firebaseConfig = {
  apiKey: "YOUR_API_KEY_HERE",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  databaseURL: "https://YOUR_PROJECT_ID-default-rtdb.firebaseio.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_MESSAGING_SENDER_ID",
  appId: "YOUR_APP_ID"
};
```

### 2. Test Locally

1. Open `index.html` in your browser
2. Play a game (win or lose)
3. Check the browser console for "Game logged to Firebase successfully"
4. Go to Firebase Console → Realtime Database to see the data

### 3. View Stats Dashboard

1. Open `dashboard.html`
2. Enter the password (default: "admin123" - check the dashboard.html script)
3. Scroll to the top to see game statistics

### 4. Deploy to GitHub Pages

```powershell
git add .
git commit -m "Add Firebase analytics"
git push
```

## What Gets Tracked

For each game:
- Whether the player won or lost
- Number of guesses taken
- Target card name
- All guessed card names
- Timestamp

## Firebase Security

**Important:** The test mode rules expire in 30 days. Update your Firebase Realtime Database rules:

```json
{
  "rules": {
    "games": {
      ".read": true,
      ".write": true
    },
    "stats": {
      ".read": true,
      ".write": true
    }
  }
}
```

For better security (recommended):
- Restrict writes to authenticated users only
- Use Firebase Authentication
- See Firebase documentation for security best practices

## Dashboard Stats Shown

- Total games played
- Games won/lost
- Win rate percentage
- Average guesses for wins
- Games started (total page loads)
- Top 10 most targeted cards

## Troubleshooting

1. **No data appearing:** Check browser console for errors, verify Firebase config
2. **"Firebase not initialized":** Make sure firebase-config.js loads before other scripts
3. **Permission denied:** Check Firebase Realtime Database rules
4. **Stats not updating:** Wait 30 seconds or refresh the dashboard page
