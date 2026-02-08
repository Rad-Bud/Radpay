import { Router } from 'express';
import { db } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET /api/sims - List all SIMs
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('sims').get();
        const sims = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(sims);
    } catch (error) {
        console.error('Error fetching SIMs:', error);
        res.status(500).json({ error: 'Failed to fetch SIMs' });
    }
});

// POST /api/sims - Add new SIM
router.post('/', async (req, res) => {
    try {
        const { operator, phone, pin, port, status, balance } = req.body;

        if (!operator || !phone || !port) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const newSim = {
            operator,
            phone,
            pin: pin || "",
            port,
            status: status || 'active',
            balance: balance ? Number(balance) : 0,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('sims').add(newSim);
        res.status(201).json({ id: docRef.id, ...newSim });

    } catch (error) {
        console.error('Error adding SIM:', error);
        res.status(500).json({ error: 'Failed to add SIM' });
    }
});

// PUT /api/sims/:id - Update SIM
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        await db.collection('sims').doc(id).update(updates);
        res.json({ message: 'SIM updated successfully' });
    } catch (error) {
        console.error('Error updating SIM:', error);
        res.status(500).json({ error: 'Failed to update SIM' });
    }
});

// DELETE /api/sims/:id - Delete SIM
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('sims').doc(id).delete();
        res.json({ message: 'SIM deleted successfully' });
    } catch (error) {
        console.error('Error deleting SIM:', error);
        res.status(500).json({ error: 'Failed to delete SIM' });
    }
});

// POST /api/sims/:id/purchase - Record a balance purchase (Top-up)
router.post('/:id/purchase', authenticate, async (req, res) => {
    try {
        const { id } = req.params as { id: string };
        const { newBalance, discountRate } = req.body;
        const { uid, role } = req.user!;

        // Only Admins can purchase balance (usually)
        if (role !== 'super_admin' && role !== 'admin') {
            return res.status(403).json({ error: 'Unauthorized' });
        }

        const simRef = db.collection('sims').doc(id);
        const simDoc = await simRef.get();

        if (!simDoc.exists) {
            return res.status(404).json({ error: 'SIM not found' });
        }

        const simData = simDoc.data();
        const previousBalance = Number(simData?.balance) || 0;
        const targetBalance = Number(newBalance);

        if (isNaN(targetBalance)) {
            return res.status(400).json({ error: 'Invalid new balance' });
        }

        const purchasedAmount = targetBalance - previousBalance;

        if (purchasedAmount <= 0) {
            return res.status(400).json({ error: 'New balance must be greater than previous balance' });
        }

        // Calculate Actual Cost
        // Cost = Amount * (1 - (Rate / 100))
        const rate = Number(discountRate) || 0;
        const actualCost = purchasedAmount * (1 - (rate / 100));

        // Batch write for atomicity
        const batch = db.batch();

        // 1. Update SIM Balance
        batch.update(simRef, {
            balance: targetBalance,
            updatedAt: new Date().toISOString()
        });

        // 2. Record Purchase Transaction
        const purchaseRef = db.collection('sim_purchases').doc();
        const purchaseData = {
            simId: id,
            operator: simData?.operator || 'unknown',
            phoneNumber: simData?.phoneNumber || '',
            previousBalance,
            newBalance: targetBalance,
            purchasedAmount,
            discountRate: rate,
            actualCost,
            createdAt: new Date().toISOString(),
            createdBy: uid
        };
        batch.set(purchaseRef, purchaseData);

        await batch.commit();

        res.json({ success: true, message: 'Purchase recorded successfully', data: purchaseData });

    } catch (error) {
        console.error('Error purchasing sim balance:', error);
        res.status(500).json({ error: 'Failed to record purchase' });
    }
});

// GET /api/sims/purchases/latest - Get latest purchase for defaults (e.g. discount rate)
router.get('/purchases/latest', authenticate, async (req, res) => {
    try {
        const { operator } = req.query;
        if (!operator) return res.json(null);

        const snapshot = await db.collection('sim_purchases')
            .where('operator', '==', operator)
            .orderBy('createdAt', 'desc')
            .limit(1)
            .get();

        if (snapshot.empty) {
            return res.json(null);
        }

        res.json(snapshot.docs[0].data());
    } catch (error) {
        console.error('Error fetching latest purchase:', error);
        // Don't fail hard, just return null so frontend uses default
        res.json(null);
    }
});

export default router;
