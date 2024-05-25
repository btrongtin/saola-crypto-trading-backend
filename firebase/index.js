import admin from 'firebase-admin';
import serviceAccount from '../config/saola-crypto-trading-app-firebase-adminsdk-zcmlh-05b1b3bd31.json' with { type: "json" };

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_MESSAGING_APP_ID,
});
export default admin;
