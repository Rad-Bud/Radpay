import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/settings/operators - Get Operator USSD Config
router.get('/operators', async (req, res) => {
    try {
        const doc = await db.collection('settings').doc('operators').get();
        if (!doc.exists) {
            // Return defaults if not configured
            return res.json({
                mobilis: '*222#',
                djezzy: '*710#',
                ooredoo: '*200#'
            });
        }
        res.json(doc.data());
    } catch (error) {
        console.error('Error fetching settings:', error);
        res.status(500).json({ error: 'Failed to fetch settings' });
    }
});

// POST /api/settings/operators - Save Operator USSD Config
router.post('/operators', async (req, res) => {
    try {
        const { mobilis, djezzy, ooredoo } = req.body;
        await db.collection('settings').doc('operators').set({
            mobilis,
            djezzy,
            ooredoo,
            updatedAt: new Date().toISOString()
        });
        res.json({ message: 'Settings saved successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
    }
});

export default router;
