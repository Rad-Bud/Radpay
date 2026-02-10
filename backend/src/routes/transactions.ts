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

        // Extract Date Range
        const startDate = req.query.startDate as string;
        const endDate = req.query.endDate as string;
        const hasDateFilter = startDate && endDate;

        if (authHeader?.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decodedToken = await admin.auth().verifyIdToken(token);
                // Trust the token role (Custom Claim) - matching stats.ts logic
                const role = decodedToken.role as string || 'retailer';

                authenticatedUser = {
                    uid: decodedToken.uid,
                    role: role
                };
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
                let query = db.collection('transactions').where('userId', '==', uid);

                if (hasDateFilter) {
                    query = query.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate);
                } else {
                    query = query.limit(50);
                }

                const snapshot = await query.get();
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
                    let query = db.collection('transactions')
                        .where('userId', 'in', batch);

                    if (hasDateFilter) {
                        query = query.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate);
                    } else {
                        query = query.limit(200);
                    }

                    const snapshot = await query.get();
                    allSnapshots.push(...snapshot.docs);
                }

                transactions = allSnapshots.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                transactions = transactions.slice(0, 50); // Limit to 50 most recent

            } else {
                // Admin/Super Admin: All transactions
                try {
                    let query = db.collection('transactions') as FirebaseFirestore.Query;

                    if (hasDateFilter) {
                        // Filter by date range
                        query = query.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate);
                        // Ideally orderBy createdAt, but requires index. We interpret range as implicit order? No.
                        // query = query.orderBy('createdAt', 'desc'); 
                    } else {
                        // Default: Latest 50
                        query = query.orderBy('createdAt', 'desc').limit(50);
                    }

                    const snapshot = await query.get();
                    transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                } catch (orderByError: any) {
                    // Fallback
                    console.warn(`[GET /transactions] Query failed (missing index?), fetching fallback. Error: ${orderByError.message}`);
                    let fallbackQuery = db.collection('transactions') as FirebaseFirestore.Query;

                    if (hasDateFilter) {
                        fallbackQuery = fallbackQuery.where('createdAt', '>=', startDate).where('createdAt', '<=', endDate);
                    } else {
                        fallbackQuery = fallbackQuery.limit(50);
                    }

                    try {
                        const snapshot = await fallbackQuery.get();
                        transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                    } catch (fallbackError) {
                        console.error('Fallback query also failed', fallbackError);
                        transactions = [];
                    }

                    transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
                }
            }
        } else {
            // No authentication - return all (for backward compatibility)
            console.log(`[GET /transactions] No authentication - fetching all transactions`);

            try {
                const snapshot = await db.collection('transactions')
                    .orderBy('createdAt', 'desc')
                    .limit(50)
                    .get();

                transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
            } catch (orderByError: any) {
                console.log(`[GET /transactions] orderBy failed (no auth), fetching without ordering:`, orderByError.message);
                const snapshot = await db.collection('transactions')
                    .limit(50)
                    .get();

                transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));
                transactions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
            }
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
