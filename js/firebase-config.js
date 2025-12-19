/**
 * Firebase Configuration
 * Replace these values with your Firebase project credentials
 */

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDE9qc2XhjHCJT2gV3kdus6YIWNKPtwbz0",
  authDomain: "cr-wordle.firebaseapp.com",
  databaseURL: "https://cr-wordle-default-rtdb.europe-west1.firebasedatabase.app/",
  projectId: "cr-wordle",
  storageBucket: "cr-wordle.firebasestorage.app",
  messagingSenderId: "361138435530",
  appId: "1:361138435530:web:d001546e41109e3114cb33",
  measurementId: "G-F9CNCNZ739"
};

// Initialize Firebase
firebase.initializeApp(firebaseConfig);

// Get a reference to the database service
const database = firebase.database();

// Get a reference to the authentication service
const auth = firebase.auth();

// Track authentication state
let isAuthenticated = false;

// Sign in anonymously on load
auth.signInAnonymously()
  .then(() => {
    console.log('Signed in anonymously');
    isAuthenticated = true;
  })
  .catch((error) => {
    console.error('Anonymous auth error:', error.code, error.message);
  });

// Listen for auth state changes
auth.onAuthStateChanged((user) => {
  if (user) {
    isAuthenticated = true;
    console.log('User authenticated:', user.uid);
  } else {
    isAuthenticated = false;
    console.log('User not authenticated');
  }
});
