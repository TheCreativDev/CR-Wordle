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
