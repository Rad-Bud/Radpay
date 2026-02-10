
import admin from 'firebase-admin';
import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

// Manual initialization to avoid module resolution issues
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

const db = admin.firestore();

async function check() {
    console.log('Checking transactions...');
    try {
        // 1. Check count
        const snapshot = await db.collection('transactions').count().get();
        console.log(`Total transactions in DB: ${snapshot.data().count}`);

        // 2. Head 5
        const head = await db.collection('transactions').limit(5).get();
        if (head.empty) {
            console.log('No transactions returned by query.');
        } else {
            console.log('First 5 transactions (any order):');
            head.docs.forEach(d => console.log(`- ${d.id} => ${d.data().createdAt}`));
        }

        // 3. Latest by createdAt
        const latest = await db.collection('transactions').orderBy('createdAt', 'desc').limit(1).get();
        if (!latest.empty) {
            console.log('Latest transaction:', latest.docs[0].data().createdAt);
        } else {
            console.log('Could not get latest transaction (maybe index missing?)');
        }

    } catch (e) {
        console.error('Error:', e);
    }
}

check();
