import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/cards - List cards with filtering
router.get('/', async (req, res) => {
    try {
        const { operator, category } = req.query;
        let query = db.collection('cards');

        if (operator) query = query.where('operator', '==', operator) as any;
        if (category) query = query.where('category', '==', category) as any;

        const snapshot = await query.orderBy('entryDate', 'desc').get();
        const cards = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        res.json(cards);
    } catch (error) {
        console.error('Error fetching cards:', error);
        res.status(500).json({ error: 'Failed to fetch cards' });
    }
});

// POST /api/cards - Add a new card
router.post('/', async (req, res) => {
    try {
        const { operator, category, code, serialNumber } = req.body;

        if (!operator || !category || !code) {
            return res.status(400).json({ error: 'Missing required fields' });
        }

        const newCard = {
            operator,
            category,
            code,
            serialNumber: serialNumber || null,
            entryDate: new Date().toISOString(),
            usageDate: null,
            status: 'available', // available, used, invalid
        };

        const docRef = await db.collection('cards').add(newCard);
        res.status(201).json({ id: docRef.id, ...newCard });
    } catch (error) {
        console.error('Error adding card:', error);
        res.status(500).json({ error: 'Failed to add card' });
    }
});

// POST /api/cards/ocr - Simulated OCR extraction
router.post('/ocr', async (req, res) => {
    try {
        // In a real app, 'image' would be processed here.
        // For now, we simulate extraction after a short delay.

        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate processing time

        // Return a mock code and serial number
        const mockCode = Math.floor(1000000000000000 + Math.random() * 9000000000000000).toString();
        const mockSerial = Math.floor(1000000000 + Math.random() * 9000000000).toString();

        res.json({
            code: mockCode,
            serialNumber: mockSerial
        });
    } catch (error) {
        console.error('OCR Error:', error);
        res.status(500).json({ error: 'Failed to process image' });
    }
});

export default router;
