// Import the functions you need from the SDKs you need
import { initializeApp } from 'firebase/app';
import { getAnalytics } from 'firebase/analytics';
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: 'AIzaSyDPLvculbqljM8QAaccYkLFy1Edfaoxfyw',
  authDomain: 'enage-chatbot.firebaseapp.com',
  projectId: 'enage-chatbot',
  storageBucket: 'enage-chatbot.appspot.com',
  messagingSenderId: '28267257274',
  appId: '1:28267257274:web:b7fd5d55c5eacb7896d183',
  measurementId: 'G-JWRZ4LGCLV',
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const messaging = getMessaging(app);
