import { Router } from 'express';
import { db } from '../config/firebase.js';
import admin from 'firebase-admin';

const router = Router();

// Define Transaction Interface
interface Transaction {
    id: string;
    userId: string;
    type: string;
    amount: number;
    description: string;
    status: string;
    createdAt: string;
    userName?: string; // Optional for enriched data
    [key: string]: any;
}

// GET /api/transactions - List transactions based on user role
router.get('/', async (req, res) => {
    try {
        // Get authenticated user from token (if available)
        const authHeader = req.headers.authorization;
        let authenticatedUser: { uid: string; role: string } | null = null;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                const userDoc = await db.collection('users').doc(decodedToken.uid).get();
                const userData = userDoc.data();
                authenticatedUser = {
                    uid: decodedToken.uid,
                    role: userData?.role || 'retailer'
                };
                console.log(`[GET /transactions] Authenticated user: ${authenticatedUser.uid}, Role: ${authenticatedUser.role}`);
            } catch (authError) {
                console.error('[GET /transactions] Auth error:', authError);
            }
        }

        let transactions: Transaction[] = [];

        // Role-based filtering
        if (authenticatedUser) {
            const { uid, role } = authenticatedUser;

            if (role === 'retailer') {
                // Retailer: Only their own transactions
                console.log(`[GET /transactions] Fetching transactions for retailer: ${uid}`);
                const snapshot = await db.collection('transactions')
                    .where('userId', '==', uid)
                    .limit(50)
                    .get();

                transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

            } else if (role === 'wholesaler') {
                // Wholesaler: Their own + their retailers' transactions
                console.log(`[GET /transactions] Fetching transactions for wholesaler: ${uid}`);

                // Get all retailers created by this wholesaler
                const retailersSnapshot = await db.collection('users')
                    .where('createdBy', '==', uid)
                    .where('role', '==', 'retailer')
                    .get();

                const retailerIds = retailersSnapshot.docs.map(doc => doc.id);
                console.log(`[GET /transactions] Found ${retailerIds.length} retailers for wholesaler ${uid}`);

                // Fetch transactions for wholesaler + all their retailers
                const userIdsToFetch = [uid, ...retailerIds];

                // Firestore 'in' query supports max 10 items, so we need to batch if more
                const batchSize = 10;
                const allSnapshots = [];

                for (let i = 0; i < userIdsToFetch.length; i += batchSize) {
                    const batch = userIdsToFetch.slice(i, i + batchSize);
                    const snapshot = await db.collection('transactions')
                        .where('userId', 'in', batch)
                        .limit(200)
                        .get();
                    allSnapshots.push(...snapshot.docs);
                }

                transactions = allSnapshots.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                transactions = transactions.slice(0, 50); // Limit to 50 most recent

            } else {
                // Admin/Super Admin: All transactions
                console.log(`[GET /transactions] Fetching all transactions for admin: ${uid}`);
                const snapshot = await db.collection('transactions')
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();

                transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            }
        } else {
            // No authentication - return all (for backward compatibility)
            console.log(`[GET /transactions] No authentication - fetching all transactions`);
            const snapshot = await db.collection('transactions')
                .orderBy('createdAt', 'desc')
                .limit(50)
                .get();

            transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
        }

        console.log(`[GET /transactions] Returning ${transactions.length} transactions`);

        // Extract unique User IDs (excluding 'system' or nulls)
        const userIds = [...new Set(transactions.map(t => t.userId).filter(id => id && id !== 'system'))];
        const usersMap: Record<string, string> = {};

        // Fetch User Details efficiently using generic getAll (batch get)
        if (userIds.length > 0) {
            const userRefs = userIds.map(id => db.collection('users').doc(id));
            const userDocs = await db.getAll(...userRefs);
            userDocs.forEach(doc => {
                if (doc.exists) {
                    const data = doc.data();
                    usersMap[doc.id] = data?.name || data?.displayName || data?.username || data?.email || 'Unknown';
                }
            });
        }

        const enrichedTransactions = transactions.map(t => {
            if (t.userId === 'system') return { ...t, userName: 'System' };

            return {
                ...t,
                userName: usersMap[t.userId] || t.userId
            };
        });

        res.json(enrichedTransactions);
    } catch (error) {
        console.error('Error fetching transactions:', error);
        res.status(500).json({ error: 'Failed to fetch transactions' });
    }
});


// Helper endpoint to manually Record a transaction (Internal use or Testing)
router.post('/', async (req, res) => {
    try {
        const { type, amount, description, userId, status } = req.body;
        const newTx = {
            type, // 'game_topup', 'sim_recharge', 'app_credit'
            amount: Number(amount),
            description: description || '',
            userId: userId || 'system',
            status: status || 'completed',
            createdAt: new Date().toISOString()
        };
        const docRef = await db.collection('transactions').add(newTx);
        res.status(201).json({ id: docRef.id, ...newTx });
    } catch (error) {
        res.status(500).json({ error: 'Failed to log transaction' });
    }
});

export default router;
