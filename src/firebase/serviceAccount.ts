import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define the service account configuration
const serviceAccount = {
  type: 'service_account',
  project_id: 'saola-crypto-trading-app',
  private_key_id: process.env.FIREBASE_PRIVATE_KEY_ID,
  private_key: process.env.FIREBASE_PRIVATE_KEY ? process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n') : undefined,
  client_email: process.env.FIREBASE_CLIENT_EMAIL,
  client_id: process.env.FIREBASE_CLIENT_ID,
  auth_uri: 'https://accounts.google.com/o/oauth2/auth',
  token_uri: 'https://oauth2.googleapis.com/token',
  auth_provider_x509_cert_url: 'https://www.googleapis.com/oauth2/v1/certs',
  client_x509_cert_url: process.env.FIREBASE_X509_CERT_URL,
  universe_domain: 'googleapis.com',
};

export default serviceAccount;
