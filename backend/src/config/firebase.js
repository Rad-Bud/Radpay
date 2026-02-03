import * as admin from 'firebase-admin';
import * as dotenv from 'dotenv';
dotenv.config();
// TODO: Replace with your service account credentials
// You can set these in .env file or use a service account key file
const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT_KEY
    ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY)
    : {};
if (!admin.apps.length) {
    try {
        admin.initializeApp({
            credential: admin.credential.cert(serviceAccount),
        });
        console.log('Firebase Admin initialized successfully');
    }
    catch (error) {
        console.error('Firebase Admin initialization failed', error);
    }
}
export const db = admin.firestore();
export const auth = admin.auth();
