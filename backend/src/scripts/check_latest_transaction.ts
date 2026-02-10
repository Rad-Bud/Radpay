
import { db } from '../config/firebase.js';

async function checkLatestTransaction() {
    try {
        console.log('Checking latest transaction...');
        const snapshot = await db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            console.log('No transactions found in the database.');
        } else {
            const doc = snapshot.docs[0];
            const data = doc.data();
            console.log('Latest Transaction:');
            console.log(`ID: ${doc.id}`);
            console.log(`CreatedAt: ${data.createdAt}`);
            console.log(`Type: ${data.type}`);
            console.log(`Amount: ${data.amount}`);
        }
    } catch (error) {
        console.error('Error fetching particular transaction:', error);
        // Fallback if index missing
        console.log('Attempting fallback (no orderBy)...');
        const snapshot = await db.collection('transactions').limit(10).get();
        console.log(`Found ${snapshot.size} random transactions.`);
        if (!snapshot.empty) {
            console.log('Sample dates:', snapshot.docs.map(d => d.data().createdAt));
        }
    }
}

checkLatestTransaction();
