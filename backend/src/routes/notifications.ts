import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/notifications - List sent notifications
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('notifications').orderBy('createdAt', 'desc').get();
        const notes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(notes);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch notifications' });
    }
});

// POST /api/notifications/send
router.post('/send', async (req, res) => {
    try {
        const { title, body, target, userId } = req.body;

        if (!title || !body) {
            return res.status(400).json({ error: 'Title and body are required' });
        }

        const notification = {
            title,
            body,
            target: target || 'all', // 'all' or 'specific'
            userId: userId || null,  // used if target is specific
            read: false, // for user implementation later
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('notifications').add(notification);
        res.status(201).json({ id: docRef.id, ...notification });

    } catch (error) {
        res.status(500).json({ error: 'Failed to send notification' });
    }
});

export default router;
