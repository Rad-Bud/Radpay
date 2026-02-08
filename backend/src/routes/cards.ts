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

// POST /api/cards/purchase - Purchase a card from a package
router.post('/purchase', async (req, res) => {
    try {
        const { packageId, gameId, userId } = req.body;

        if (!packageId || !gameId || !userId) {
            return res.status(400).json({ error: 'Missing required fields: packageId, gameId, userId' });
        }

        // Use Firestore transaction to ensure atomicity
        const result = await db.runTransaction(async (transaction) => {
            // 1. Find an available card from this package
            const cardsQuery = db.collection('cards')
                .where('operator', '==', gameId)
                .where('category', '==', packageId)
                .where('status', '==', 'available')
                .limit(1);

            const cardsSnapshot = await transaction.get(cardsQuery);

            if (cardsSnapshot.empty) {
                throw new Error('لا توجد بطاقات متوفرة من هذه الباقة');
            }

            const cardDoc = cardsSnapshot.docs[0];
            const cardData = cardDoc.data();
            const cardRef = cardDoc.ref;

            // 2. Get user
            const userRef = db.collection('users').doc(userId);
            const userDoc = await transaction.get(userRef);

            if (!userDoc.exists) {
                throw new Error('المستخدم غير موجود');
            }

            const userData = userDoc.data();
            const userRole = userData?.role || 'retailer';

            // Get wallet for balance
            const walletRef = db.collection('wallets').doc(userId);
            const walletDoc = await transaction.get(walletRef);
            const userBalance = walletDoc.exists ? (Number(walletDoc.data()?.balance) || 0) : 0;

            // 3. Get package to determine price
            const packageRef = db.collection('games').doc(gameId).collection('packages').doc(packageId);
            const packageDoc = await transaction.get(packageRef);

            if (!packageDoc.exists) {
                throw new Error('الباقة غير موجودة');
            }

            const packageData = packageDoc.data();

            // 4. Determine price based on user role
            let price = 0;
            if (userRole === 'super_admin') {
                price = Number(packageData?.purchasePrice) || Number(packageData?.costPrice) || 0;
            } else if (userRole === 'super_wholesaler' || userRole === 'wholesaler') {
                price = Number(packageData?.wholesalerPrice) || Number(packageData?.price) || 0;
            } else {
                // retailer
                price = Number(packageData?.retailerPrice) || Number(packageData?.price) || 0;
            }

            // 5. Check balance
            if (userBalance < price) {
                throw new Error(`رصيد غير كافي. الرصيد الحالي: ${userBalance} دج، السعر: ${price} دج`);
            }

            // 6. Deduct balance
            const newBalance = userBalance - price;
            transaction.update(walletRef, {
                balance: newBalance,
                updatedAt: new Date().toISOString()
            });

            // 7. Update card status to "used" (burned)
            const now = new Date().toISOString();
            transaction.update(cardRef, {
                status: 'used',
                soldTo: userId,
                soldAt: now,
                soldPrice: price,
                usageDate: now
            });

            // 8. Create transaction record
            const transactionRef = db.collection('transactions').doc();
            const transactionData = {
                userId,
                type: 'game_card_purchase',
                amount: price,
                description: `شراء بطاقة ${packageData?.name || 'لعبة'}`,
                status: 'completed',
                createdAt: now,
                metadata: {
                    cardId: cardDoc.id,
                    gameId,
                    packageId,
                    packageName: packageData?.name,
                    // Partially hide code for security in logs
                    codePreview: cardData.code ? `****${cardData.code.slice(-4)}` : ''
                }
            };
            transaction.set(transactionRef, transactionData);

            return {
                card: {
                    id: cardDoc.id,
                    code: cardData.code,
                    serialNumber: cardData.serialNumber,
                    category: cardData.category,
                    operator: cardData.operator,
                    packageName: packageData?.name
                },
                transaction: {
                    id: transactionRef.id,
                    amount: price
                },
                newBalance
            };
        });

        console.log(`[Card Purchase] User ${userId} purchased card from package ${packageId} for ${result.transaction.amount} DZD`);
        res.json({ success: true, ...result });

    } catch (error: any) {
        console.error('Error purchasing card:', error);
        res.status(400).json({ error: error.message || 'فشل شراء البطاقة' });
    }
});

// GET /api/cards/available-count - Get count of available cards per package
router.get('/available-count', async (req, res) => {
    try {
        const { gameId } = req.query;

        if (!gameId) {
            return res.status(400).json({ error: 'gameId is required' });
        }

        // Get all cards for this game
        const cardsSnapshot = await db.collection('cards')
            .where('operator', '==', gameId)
            .where('status', '==', 'available')
            .get();

        // Count by package
        const countByPackage: Record<string, number> = {};
        cardsSnapshot.docs.forEach(doc => {
            const packageId = doc.data().category;
            countByPackage[packageId] = (countByPackage[packageId] || 0) + 1;
        });

        res.json(countByPackage);
    } catch (error) {
        console.error('Error getting available count:', error);
        res.status(500).json({ error: 'Failed to get available count' });
    }
});

// PATCH /api/cards/:cardId/status - Update card status (Admin only)
router.patch('/:cardId/status', async (req, res) => {
    try {
        const { cardId } = req.params;
        const { status } = req.body;

        // Validate status
        const validStatuses = ['available', 'used', 'sold', 'invalid'];
        if (!validStatuses.includes(status)) {
            return res.status(400).json({ error: 'Invalid status. Must be one of: available, used, sold, invalid' });
        }

        // Check if card exists
        const cardRef = db.collection('cards').doc(cardId);
        const cardDoc = await cardRef.get();

        if (!cardDoc.exists) {
            return res.status(404).json({ error: 'Card not found' });
        }

        // Update card status
        await cardRef.update({
            status,
            updatedAt: new Date().toISOString()
        });

        res.json({
            success: true,
            message: 'Card status updated successfully',
            cardId,
            newStatus: status
        });
    } catch (error) {
        console.error('Error updating card status:', error);
        res.status(500).json({ error: 'Failed to update card status' });
    }
});

export default router;
