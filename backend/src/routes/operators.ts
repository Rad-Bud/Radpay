import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/operators/:id/config - Get operator configuration
router.get('/:id/config', async (req, res) => {
    try {
        const { id } = req.params;
        const doc = await db.collection('operator_configs').doc(id).get();
        if (doc.exists) {
            res.json(doc.data());
        } else {
            // Default response if no config exists
            res.json({ flexyTemplate: '' });
        }
    } catch (error) {
        console.error('Error fetching operator config:', error);
        res.status(500).json({ error: 'Failed to fetch config' });
    }
});

// POST /api/operators/:id/config - Update operator configuration
router.post('/:id/config', async (req, res) => {
    try {
        const { id } = req.params;
        const { flexyTemplate } = req.body;

        await db.collection('operator_configs').doc(id).set({
            flexyTemplate,
            updatedAt: new Date().toISOString()
        }, { merge: true });

        res.json({ success: true, message: 'Configuration updated' });
    } catch (error) {
        console.error('Error updating operator config:', error);
        res.status(500).json({ error: 'Failed to update config' });
    }
});

export default router;
