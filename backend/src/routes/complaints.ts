import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/complaints - List all complaints
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('complaints').orderBy('createdAt', 'desc').get();
        const complaints = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(complaints);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch complaints' });
    }
});

// POST /api/complaints - Create a complaint (For testing/User App)
router.post('/', async (req, res) => {
    try {
        const { userId, subject, message } = req.body;
        if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });

        const newComplaint = {
            userId: userId || 'anonymous',
            subject,
            message,
            status: 'pending', // pending, resolved
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('complaints').add(newComplaint);
        res.status(201).json({ id: docRef.id, ...newComplaint });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create complaint' });
    }
});

// PUT /api/complaints/:id/resolve - Mark as resolved
router.put('/:id/resolve', async (req, res) => {
    try {
        await db.collection('complaints').doc(req.params.id).update({
            status: 'resolved',
            resolvedAt: new Date().toISOString()
        });
        res.json({ message: 'Complaint resolved' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to resolve complaint' });
    }
});

export default router;
