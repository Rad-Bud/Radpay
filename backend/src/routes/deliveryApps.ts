import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// Collection Name: delivery_apps

// GET /api/delivery-apps
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('delivery_apps').get();
        const apps = await Promise.all(snapshot.docs.map(async (doc) => {
            const data = doc.data();
            const packagesSnapshot = await doc.ref.collection('packages').get();
            const packages = packagesSnapshot.docs.map(p => ({ id: p.id, ...p.data() }));
            return { id: doc.id, ...data, packages };
        }));
        res.json(apps);
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch delivery apps' });
    }
});

// POST /api/delivery-apps
router.post('/', async (req, res) => {
    try {
        const { name, description } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const newApp = {
            name,
            description: description || '',
            createdAt: new Date().toISOString()
        };
        const docRef = await db.collection('delivery_apps').add(newApp);
        res.status(201).json({ id: docRef.id, ...newApp });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create app' });
    }
});

// DELETE /api/delivery-apps/:id
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('delivery_apps').doc(req.params.id).delete();
        res.json({ message: 'App deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete app' });
    }
});

// --- Packages ---

// POST /api/delivery-apps/:id/packages
router.post('/:id/packages', async (req, res) => {
    try {
        const { name, price, costPrice } = req.body;
        if (!name || !price) return res.status(400).json({ error: 'Name and Price required' });

        const newPkg = {
            name,
            price: Number(price),
            costPrice: Number(costPrice) || 0,
            active: true,
            createdAt: new Date().toISOString()
        };
        const docRef = await db.collection('delivery_apps').doc(req.params.id).collection('packages').add(newPkg);
        res.status(201).json({ id: docRef.id, ...newPkg });
    } catch (error) {
        res.status(500).json({ error: 'Failed to add package' });
    }
});

// DELETE /api/delivery-apps/:appId/packages/:pkgId
router.delete('/:appId/packages/:pkgId', async (req, res) => {
    try {
        await db.collection('delivery_apps').doc(req.params.appId).collection('packages').doc(req.params.pkgId).delete();
        res.json({ message: 'Package deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete package' });
    }
});

export default router;
