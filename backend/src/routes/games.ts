import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// --- Games CRUD ---

// GET /api/games - List all games with their packages
router.get('/', async (req, res) => {
    try {
        const snapshot = await db.collection('games').get();
        const games = await Promise.all(snapshot.docs.map(async (doc) => {
            const gameData = doc.data();
            // Fetch packages subcollection
            const packagesSnapshot = await doc.ref.collection('packages').get();
            const packages = packagesSnapshot.docs.map(pDoc => ({ id: pDoc.id, ...pDoc.data() }));

            return { id: doc.id, ...gameData, packages };
        }));
        res.json(games);
    } catch (error) {
        console.error('Error fetching games:', error);
        res.status(500).json({ error: 'Failed to fetch games' });
    }
});

// POST /api/games - Create a new game
router.post('/', async (req, res) => {
    try {
        const { name, description, image } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        const newGame = {
            name,
            description: description || '',
            image: image || '', // URL or base64 placeholder
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('games').add(newGame);
        res.status(201).json({ id: docRef.id, ...newGame });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create game' });
    }
});

// DELETE /api/games/:id - Delete a game
router.delete('/:id', async (req, res) => {
    try {
        await db.collection('games').doc(req.params.id).delete();
        // Note: Subcollections are not automatically deleted in Firestore client-side SDKs, 
        // but for this simple implementation we'll ignore orphaned subcollections or handle via backend logic later.
        res.status(200).json({ message: 'Game deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete game' });
    }
});

// --- Packages CRUD ---

// POST /api/games/:id/packages - Add a package to a game
router.post('/:id/packages', async (req, res) => {
    try {
        const { name, purchasePrice, wholesalerPrice, retailerPrice, customerPrice, price, costPrice } = req.body;
        if (!name) return res.status(400).json({ error: 'Name is required' });

        // Support both new (4-tier) and legacy (2-tier) pricing
        let finalPurchasePrice, finalWholesalerPrice, finalRetailerPrice, finalCustomerPrice;

        if (purchasePrice !== undefined) {
            // New 4-tier pricing
            finalPurchasePrice = Number(purchasePrice);
            finalWholesalerPrice = Number(wholesalerPrice);
            finalRetailerPrice = Number(retailerPrice);
            finalCustomerPrice = Number(customerPrice);

            // Validate pricing is ascending
            if (finalPurchasePrice >= finalWholesalerPrice ||
                finalWholesalerPrice >= finalRetailerPrice ||
                finalRetailerPrice >= finalCustomerPrice) {
                return res.status(400).json({
                    error: 'الأسعار يجب أن تكون تصاعدية: شراء < جملة < تجزئة < زبون'
                });
            }
        } else {
            // Legacy 2-tier pricing (backward compatibility)
            finalPurchasePrice = Number(costPrice) || 0;
            finalCustomerPrice = Number(price);
            // Set intermediate prices as averages
            const diff = (finalCustomerPrice - finalPurchasePrice) / 3;
            finalWholesalerPrice = finalPurchasePrice + diff;
            finalRetailerPrice = finalPurchasePrice + (diff * 2);
        }

        const newPackage = {
            name,
            // New 4-tier pricing
            purchasePrice: finalPurchasePrice,
            wholesalerPrice: finalWholesalerPrice,
            retailerPrice: finalRetailerPrice,
            customerPrice: finalCustomerPrice,
            // Legacy fields (for backward compatibility)
            price: finalCustomerPrice,
            costPrice: finalPurchasePrice,
            active: true,
            createdAt: new Date().toISOString()
        };

        const docRef = await db.collection('games').doc(req.params.id).collection('packages').add(newPackage);
        res.status(201).json({ id: docRef.id, ...newPackage });
    } catch (error) {
        console.error('Error adding package:', error);
        res.status(500).json({ error: 'Failed to add package' });
    }
});

// PUT /api/games/:gameId/packages/:packageId - Update a package
router.put('/:gameId/packages/:packageId', async (req, res) => {
    try {
        const { name, price, costPrice, active } = req.body;
        const updateData: any = {};
        if (name) updateData.name = name;
        if (price) updateData.price = Number(price);
        if (costPrice !== undefined) updateData.costPrice = Number(costPrice);
        if (active !== undefined) updateData.active = active;

        await db.collection('games').doc(req.params.gameId).collection('packages').doc(req.params.packageId).update(updateData);
        res.json({ id: req.params.packageId, ...updateData });
    } catch (error) {
        res.status(500).json({ error: 'Failed to update package' });
    }
});

// DELETE /api/games/:gameId/packages/:packageId - Delete a package
router.delete('/:gameId/packages/:packageId', async (req, res) => {
    try {
        await db.collection('games').doc(req.params.gameId).collection('packages').doc(req.params.packageId).delete();
        res.json({ message: 'Package deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Failed to delete package' });
    }
});

export default router;
