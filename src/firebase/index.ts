import admin, { AppOptions } from 'firebase-admin';
import serviceAccount from './serviceAccount';

// Define a custom type that extends AppOptions and includes the apiKey property
type CustomAppOptions = AppOptions & {
  apiKey: string;
};
// Initialize the Firebase Admin SDK using the provided service account and environment variables
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount as admin.ServiceAccount),
  apiKey: process.env.FIREBASE_API_KEY,
  authDomain: process.env.FIREBASE_AUTH_DOMAIN,
  projectId: process.env.FIREBASE_PROJECT_ID,
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.FIREBASE_MESSAGING_APP_ID,
} as CustomAppOptions);

export default admin;
