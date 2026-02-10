
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Manual initialization
const serviceAccountPath = join(process.cwd(), 'service-account.json');
let serviceAccount;

if (existsSync(serviceAccountPath)) {
    console.log(`Loading credentials from ${serviceAccountPath}`);
    serviceAccount = JSON.parse(readFileSync(serviceAccountPath, 'utf-8'));
} else {
    console.error('service-account.json not found in CWD');
    process.exit(1);
}

if (!admin.apps.length) {
    admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
    });
}

async function listUsers() {
    console.log('Listing users...');
    try {
        const listUsersResult = await admin.auth().listUsers(10);
        listUsersResult.users.forEach((userRecord) => {
            console.log('------------------------------------------------');
            console.log('uid:', userRecord.uid);
            console.log('email:', userRecord.email);
            console.log('displayName:', userRecord.displayName);
            console.log('customClaims:', userRecord.customClaims);
        });
        if (listUsersResult.users.length === 0) {
            console.log('No users found.');
        }
    } catch (error) {
        console.log('Error listing users:', error);
    }
}

listUsers();
