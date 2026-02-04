import admin from 'firebase-admin';
import * as dotenv from 'dotenv';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

dotenv.config();

let dbVal: admin.firestore.Firestore;
let authVal: admin.auth.Auth;

// Mock implementations for offline mode
const mockAuth = {
  getUserByEmail: async (email: string) => { throw new Error(`User ${email} not found (Mock)`); },
  createUser: async (user: any) => ({ uid: 'mock_uid_' + Math.random().toString(36).substr(2, 9), ...user }),
  setCustomUserClaims: async (uid: string, claims: any) => console.log(`[MOCK] Set claims for ${uid}:`, claims),
} as unknown as admin.auth.Auth;

const mockDb = {
  collection: (name: string) => ({
    doc: (id: string) => ({
      set: async (data: any) => console.log(`[MOCK] DB Set ${name}/${id}:`, data),
      get: async () => ({ exists: false, data: () => undefined }),
    })
  })
} as unknown as admin.firestore.Firestore;

try {
  const serviceAccountPath = join(process.cwd(), 'service-account.json');
  let serviceAccount;

  if (existsSync(serviceAccountPath)) {
    console.log(`Loading credentials from ${serviceAccountPath}`);
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
  } else if (process.env.FIREBASE_SERVICE_ACCOUNT_KEY) {
    serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY);
  }

  if (serviceAccount) {
    if (!admin.apps.length) {
      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
      });
      console.log('Firebase Admin initialized successfully');
    }
    dbVal = admin.firestore();
    authVal = admin.auth();
  } else {
    console.warn("WARNING: No credentials found (service-account.json or env). Starting in offline mode with MOCK implementation.");
    dbVal = mockDb;
    authVal = mockAuth;
  }

} catch (error) {
  console.error('Firebase Admin initialization failed', error);
  dbVal = mockDb;
  authVal = mockAuth;
}

export const db = dbVal;
export const auth = authVal;
