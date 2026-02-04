import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// GET /api/offers - List all offers
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('offers').get();
        const offers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        res.json(offers);
    } catch (error) {
        console.error('Error fetching offers:', error);
        res.status(500).json({ error: 'Failed to fetch offers' });
    }
});

// POST /api/offers - Add new offer
router.post('/', async (req, res) => {
    try {
        const { operator, name, description, price, ussdTemplate } = req.body;

        if (!operator || !name || !price || !ussdTemplate) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        const newOffer = {
            operator,
            name,
            description: description || "",
            price: Number(price),
            ussdTemplate,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('offers').add(newOffer);
        res.status(201).json({ id: docRef.id, ...newOffer });

    } catch (error) {
        console.error('Error adding offer:', error);
        res.status(500).json({ error: 'Failed to add offer' });
    }
});

// PUT /api/offers/:id - Update offer
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const updates = req.body;

        if (updates.price) updates.price = Number(updates.price);

        await db.collection('offers').doc(id).update(updates);
        res.json({ message: 'Offer updated successfully' });
    } catch (error) {
        console.error('Error updating offer:', error);
        res.status(500).json({ error: 'Failed to update offer' });
    }
});

// DELETE /api/offers/:id - Delete offer
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        await db.collection('offers').doc(id).delete();
        res.json({ message: 'Offer deleted successfully' });
    } catch (error) {
        console.error('Error deleting offer:', error);
        res.status(500).json({ error: 'Failed to delete offer' });
    }
});

export default router;
