import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/transactions - List all transactions
router.get('/', async (req, res) => {
    try {
        // In a real app, you'd want pagination here.
        const snapshot = await db.collection('transactions').orderBy('createdAt', 'desc').limit(50).get();
        const transactions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(transactions);
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
