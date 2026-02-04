import { Router } from 'express';
import { db } from '../config/firebase.js';

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

export default router;
