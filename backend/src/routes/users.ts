import { Router } from 'express';
import type { Request, Response } from 'express';
import { auth, db } from '../config/firebase.js';
import admin from 'firebase-admin';

const router = Router();

// GET /api/users - List all users from Firestore with Balance & Debt
router.get('/', async (req: Request, res: Response) => {
    try {
        const { createdBy, role } = req.query;

        let query: any = db.collection('users');

        // Apply filters if provided
        if (createdBy) {
            query = query.where('createdBy', '==', createdBy);
        }

        if (role) {
            query = query.where('role', '==', role);
        }

        const usersSnapshot = await query.get();

        const users = await Promise.all(usersSnapshot.docs.map(async (doc: any) => {
            const userData = { id: doc.id, ...doc.data() };
            // Fetch Balance and Debt
            const walletDoc = await db.collection('wallets').doc(doc.id).get();
            const walletData = walletDoc.exists ? walletDoc.data() : {};

            return {
                ...userData,
                balance: walletData?.balance || 0,
                debt: walletData?.debt || 0
            };
        }));

        res.json(users);
    } catch (error) {
        console.error('Error fetching users:', error);
        res.status(500).json({ error: 'Failed to fetch users' });
    }
});

// POST /api/users - Create a new user & Initialize Wallet
router.post('/', async (req: Request, res: Response) => {
    try {
        const { email, password, name, phone, role, wilaya, baladiya, location, idCardUrl, createdBy } = req.body;

        if (!email || !password || !role) {
            res.status(400).json({ error: 'Missing required fields' });
            return;
        }

        // Validate role-based creation permissions
        if (createdBy) {
            const creatorDoc = await db.collection('users').doc(createdBy).get();
            if (creatorDoc.exists) {
                const creatorData = creatorDoc.data();
                const creatorRole = creatorData?.role;

                // Wholesaler can only create retailers
                if (creatorRole === 'wholesaler' && role !== 'retailer') {
                    res.status(403).json({ error: 'بائع الجملة يمكنه فقط إنشاء حسابات بائعي التجزئة' });
                    return;
                }

                // Retailer cannot create any accounts
                if (creatorRole === 'retailer') {
                    res.status(403).json({ error: 'بائع التجزئة لا يمكنه إنشاء حسابات' });
                    return;
                }
            }
        }

        // 1. Create User in Firebase Auth
        const userRecord = await auth.createUser({
            email,
            password,
            displayName: name,
            disabled: false,
        });

        // 2. Set Custom Claims (Role)
        await auth.setCustomUserClaims(userRecord.uid, { role });

        // 3. Store User Details in Firestore
        await db.collection('users').doc(userRecord.uid).set({
            name,
            phone,
            email,
            role,
            wilaya: wilaya || "",
            baladiya: baladiya || "",
            location: location || "",
            idCardUrl: idCardUrl || "",
            createdBy: createdBy || null, // Track who created this user
            createdAt: new Date().toISOString(),
            status: 'Active'
        });

        // 4. Initialize Wallet
        await db.collection('wallets').doc(userRecord.uid).set({
            balance: 0,
            debt: 0,
            currency: 'DZD',
            updatedAt: new Date().toISOString()
        });

        res.status(201).json({ message: 'User created successfully', uid: userRecord.uid });

    } catch (error: any) {
        console.error('Error creating user:', error);
        res.status(500).json({ error: error.message || 'Failed to create user' });
    }
});

// POST /api/users/:uid/balance - Add Funds (Cash, Credit, Repay), Deduct, or Set Balance
router.post('/:uid/balance', async (req: Request, res: Response) => {
    try {
        const { uid } = req.params as { uid: string };
        const { amount, type, chargedBy } = req.body; // type: 'cash' | 'credit' | 'repay' | 'deduct' | 'set'

        if (typeof amount !== 'number') {
            res.status(400).json({ error: 'Invalid amount' });
            return;
        }

        const validTypes = ['cash', 'credit', 'repay', 'deduct', 'set'];
        const transactionType = validTypes.includes(type) ? type : 'cash';

        await db.runTransaction(async (t) => {
            // 1. Get Retailer Wallet
            const retailerWalletRef = db.collection('wallets').doc(uid);
            const retailerWalletDoc = await t.get(retailerWalletRef);

            // 2. Setup Wholesaler Ref and Role Check
            let wholesalerWalletRef = null;
            let isWholesaler = false;

            if (chargedBy) {
                const chargerUserRef = db.collection('users').doc(chargedBy);
                const chargerUserDoc = await t.get(chargerUserRef);
                if (chargerUserDoc.exists && chargerUserDoc.data()?.role === 'wholesaler') {
                    isWholesaler = true;
                    wholesalerWalletRef = db.collection('wallets').doc(chargedBy);
                }
            }

            // 3. Prevent Wholesaler from using Admin-only types
            if (isWholesaler && (transactionType === 'deduct' || transactionType === 'set')) {
                throw new Error('UNAUTHORIZED: Wholesalers cannot deduct or set balance directly.');
            }

            // 4. Logic for Wholesaler Charging (Cash only)
            if (isWholesaler && transactionType === 'cash') {
                const wholesalerWalletDoc = await t.get(wholesalerWalletRef!);
                const wholesalerBalance = wholesalerWalletDoc.exists ? (wholesalerWalletDoc.data()?.balance || 0) : 0;

                if (wholesalerBalance < amount) {
                    throw new Error(`INSUFFICIENT_FUNDS: Available ${wholesalerBalance}, Required ${amount}`);
                }
            }

            // 5. Calculate New Retailer Balance
            let currentBalance = 0;
            let currentDebt = 0;

            if (retailerWalletDoc.exists) {
                const data = retailerWalletDoc.data();
                currentBalance = data?.balance || 0;
                currentDebt = data?.debt || 0;
            }

            let newBalance = currentBalance;
            let newDebt = currentDebt;
            let logAmount = amount;
            let logDescription = '';

            if (transactionType === 'cash') {
                newBalance += amount;
                logDescription = `شحن رصيد بقيمة ${amount}`;
            } else if (transactionType === 'credit') {
                newDebt += amount;
                newBalance += amount;
                logDescription = `شحن آجل (دين) بقيمة ${amount}`;
            } else if (transactionType === 'repay') {
                newDebt = Math.max(0, currentDebt - amount);
                logDescription = `تسديد ديون بقيمة ${amount}`;
            } else if (transactionType === 'deduct') {
                newBalance -= amount;
                logDescription = `خصم رصيد بقيمة ${amount}`;
                logAmount = -amount; // Log as negative
            } else if (transactionType === 'set') {
                const diff = amount - currentBalance;
                newBalance = amount;
                logDescription = `تعديل الرصيد من ${currentBalance} إلى ${amount}`;
                logAmount = diff; // Log the difference (positive or negative)
            }

            // 6. Perform Updates

            // Deduct from Wholesaler (if applicable)
            if (isWholesaler && transactionType === 'cash') {
                t.update(wholesalerWalletRef!, {
                    balance: admin.firestore.FieldValue.increment(-amount),
                    updatedAt: new Date().toISOString()
                });
            }

            // Update Retailer
            t.set(retailerWalletRef, {
                balance: newBalance,
                debt: newDebt,
                updatedAt: new Date().toISOString(),
                currency: 'DZD'
            }, { merge: true });

            // 7. Create Transaction Record
            const transactionRef = db.collection('transactions').doc();
            t.set(transactionRef, {
                type: transactionType === 'repay' ? 'debt_repayment' :
                    (transactionType === 'deduct' || transactionType === 'set') ? 'adjustment' : 'deposit',
                amount: logAmount,
                userId: uid,
                performedBy: chargedBy || 'admin',
                description: logDescription,
                status: 'completed',
                createdAt: new Date().toISOString()
            });
        });

        res.json({ message: 'Balance updated successfully' });

    } catch (error: any) {
        console.error('Error updating balance:', error);

        if (error.message && error.message.includes('INSUFFICIENT_FUNDS')) {
            res.status(400).json({ error: 'رصيد غير كافٍ لإتمام العملية' });
        } else if (error.message && error.message.includes('UNAUTHORIZED')) {
            res.status(403).json({ error: 'غير مصرح لك بهذه العملية' });
        } else {
            res.status(500).json({ error: 'Failed to update balance' });
        }
    }
});

// PUT /api/users/:uid - Update User Details
router.put('/:uid', async (req: Request, res: Response) => {
    try {
        const { uid } = req.params as { uid: string };
        const updates = req.body;

        delete updates.email;
        delete updates.role;
        delete updates.password;

        await db.collection('users').doc(uid).update(updates);

        res.json({ message: 'User updated successfully' });
    } catch (error) {
        console.error('Error updating user:', error);
        res.status(500).json({ error: 'Failed to update user' });
    }
});

// POST /api/users/:id/toggle-status - Disable or Enable User Account
router.post('/:id/toggle-status', async (req: Request, res: Response) => {
    try {
        const id = req.params.id as string;

        // Get current user status from Firestore
        const userDoc = await db.collection('users').doc(id).get();
        if (!userDoc.exists) {
            res.status(404).json({ error: 'User not found' });
            return;
        }

        const userData = userDoc.data();
        const currentStatus = userData?.status || 'Active';
        const newStatus = currentStatus === 'Active' ? 'Disabled' : 'Active';

        // Update Firebase Auth
        await auth.updateUser(id, {
            disabled: newStatus === 'Disabled'
        });

        // Update Firestore
        await db.collection('users').doc(id).update({
            status: newStatus,
            updatedAt: new Date().toISOString()
        });

        res.json({
            message: `User ${newStatus === 'Disabled' ? 'disabled' : 'enabled'} successfully`,
            status: newStatus
        });

    } catch (error: any) {
        console.error('Error toggling user status:', error);
        res.status(500).json({ error: error.message || 'Failed to toggle user status' });
    }
});

export default router;
