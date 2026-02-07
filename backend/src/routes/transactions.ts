import { Router } from 'express';
import { db } from '../config/firebase.js';

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

// GET /api/transactions - List all transactions
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('transactions').orderBy('createdAt', 'desc').limit(50).get();
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Transaction));

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
                    // Try multiple fields for the name
                    usersMap[doc.id] = data?.name || data?.displayName || data?.username || data?.email || 'Unknown';
                    console.log(`Resolved User ${doc.id} to ${usersMap[doc.id]}`);
                } else {
                    console.log(`User ${doc.id} not found in Firestore`);
                }
            });
        }

        const enrichedTransactions = transactions.map(t => {
            // If userId is system, show 'System'
            if (t.userId === 'system') return { ...t, userName: 'System' };

            // Get resolved name
            let resolvedName = usersMap[t.userId];

            // If not found in users map, fallback to ID (or check if it was performed by admin)
            if (!resolvedName) {
                resolvedName = t.userId;
            }

            // Check if performedBy adds context (e.g. if I am viewing as admin)
            // context: 'المرسل' (Sender). If type is deposit, sender is performedBy.
            // If type is game_topup, sender is the user (or system).

            return {
                ...t,
                userName: resolvedName
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
