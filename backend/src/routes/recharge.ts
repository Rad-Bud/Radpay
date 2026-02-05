import { Router } from 'express';
import { db } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.js';
import { zteGateway } from '../services/zteGateway.js';
import { gateway } from '../services/mockGateway.js';

const router = Router();

// Helper to generate Flexy USSD Code based on operator
const getFlexyCode = async (operator: string, phone: string, amount: number, pin: string) => {
    try {
        // Try to fetch custom config from DB
        const doc = await db.collection('operator_configs').doc(operator).get();
        if (doc.exists) {
            const template = doc.data()?.flexyTemplate;
            if (template) {
                return template
                    .replace('{phone}', phone)
                    .replace('{amount}', amount.toString())
                    .replace('{pin}', pin);
            }
        }
    } catch (e) {
        console.warn('Failed to fetch custom operator config, using defaults');
    }

    // Default Fallback
    switch (operator) {
        case 'mobilis':
            // *610*phone*amount*pin#
            return `*610*${phone}*${amount}*${pin}#`;
        case 'djezzy':
            // *770*phone*amount*pin#
            return `*770*${phone}*${amount}*${pin}#`;
        case 'ooredoo':
            // *115*phone*amount*pin#
            return `*115*${phone}*${amount}*${pin}#`;
        default:
            throw new Error(`Unknown operator for flexy: ${operator}`);
    }
};

// POST /api/recharge/flexy - Execute a Flexy recharge
router.post('/flexy', authenticate, async (req, res) => {
    const { uid } = req.user!; // Logged in merchant
    const { phoneNumber, amount, operator } = req.body;

    if (!phoneNumber || !amount || !operator) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const rechargeAmount = Number(amount);
    let transactionId = '';

    try {
        // 1. BALANCE CHECK & DEDUCTION (Atomic Transaction)
        await db.runTransaction(async (t) => {
            const walletRef = db.collection('wallets').doc(uid);
            const walletDoc = await t.get(walletRef);

            if (!walletDoc.exists) {
                throw new Error('Merchant wallet not found');
            }

            const currentBalance = walletDoc.data()?.balance || 0;
            if (currentBalance < rechargeAmount) {
                throw new Error('رصيد غير كافي (Insufficient balance)');
            }

            // Deduct balance
            t.update(walletRef, { balance: currentBalance - rechargeAmount });
        });

        // 2. CREATE TRANSACTION RECORD (Pending)
        const newTx = {
            userId: uid,
            type: 'flexy',
            operator,
            phoneNumber,
            amount: rechargeAmount,
            status: 'processing',
            createdAt: new Date().toISOString(),
            description: `Flexy ${operator} to ${phoneNumber}`
        };
        const txRef = await db.collection('transactions').add(newTx);
        transactionId = txRef.id;

        // 3. FIND SUITABLE SIM
        // Find an active SIM for the requested operator
        const simsSnapshot = await db.collection('sims')
            .where('operator', '==', operator)
            .where('status', '==', 'active')
            .get();

        const activeSim = simsSnapshot.docs[0]; // Simple selection strategy: pick first active

        if (!activeSim) {
            throw new Error(`No active SIM found for operator: ${operator}`);
        }

        const simData = activeSim.data();
        const simId = activeSim.id;
        const gatewayIp = simData.port;
        const simPin = simData.pin || '0000';

        // 4. EXECUTE USSD
        const ussdCode = await getFlexyCode(operator, phoneNumber, rechargeAmount, simPin);

        let result = { success: false, message: '' };

        if (gatewayIp && gatewayIp.startsWith('192')) {
            console.log(`[Recharge] Executing Real USSD on ${gatewayIp}: ${ussdCode}`);
            result = await zteGateway.sendUSSD(gatewayIp, ussdCode);
        } else {
            console.log(`[Recharge] Executing Mock USSD on SIM ${simId}: ${ussdCode}`);
            // Simulate processing time
            await new Promise(resolve => setTimeout(resolve, 2000));
            result = await gateway.sendUSSD(Number(simId) || 1, ussdCode);
        }

        // 5. UPDATE TRANSACTION STATUS
        if (result.success) {
            await db.collection('transactions').doc(transactionId).update({
                status: 'completed',
                result: result.message,
                simId: simId,
                completedAt: new Date().toISOString()
            });

            res.json({
                success: true,
                transactionId,
                message: 'تمت العملية بنجاح',
                ussdResponse: result.message
            });

        } else {
            throw new Error(`USSD Execution Failed: ${result.message}`);
        }

    } catch (error: any) {
        console.error('[Recharge Flexy] Error:', error.message);

        // REFUND LOGIC
        // If we deduced balance but failed, we must refund.
        // NOTE: If the runTransaction failed (e.g. insufficient funds), we didn't deduct yet, so no refund needed.
        // We need to know if deduction happened.
        // A simpler way is to check if transactionId exists. If it exists, it means we passed the deduction phase.

        if (transactionId) {
            await db.runTransaction(async (t) => {
                const walletRef = db.collection('wallets').doc(uid);
                const walletDoc = await t.get(walletRef);
                const currentBalance = walletDoc.data()?.balance || 0;

                // Refund
                t.update(walletRef, {
                    balance: currentBalance + rechargeAmount
                });

                // Update Tx to failed
                const txRef = db.collection('transactions').doc(transactionId);
                t.update(txRef, {
                    status: 'failed',
                    error: error.message,
                    failedAt: new Date().toISOString()
                });
            });
        }

        res.status(400).json({
            success: false,
            error: error.message || 'Operation failed'
        });
    }
});


// POST /api/recharge/offer - Execute an Offer recharge
router.post('/offer', authenticate, async (req, res) => {
    const { uid } = req.user!;
    const { phoneNumber, offerId } = req.body;

    if (!phoneNumber || !offerId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let transactionId = '';
    let price = 0;

    try {
        // 1. Fetch Offer details
        const offerDoc = await db.collection('offers').doc(offerId).get();
        if (!offerDoc.exists) throw new Error('Offer not found');
        const offerData = offerDoc.data()!;
        price = Number(offerData.price);
        const operator = offerData.operator;

        // 2. BALANCE CHECK & DEDUCTION
        await db.runTransaction(async (t) => {
            const walletRef = db.collection('wallets').doc(uid);
            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists) throw new Error('Merchant wallet not found');
            const currentBalance = walletDoc.data()?.balance || 0;
            if (currentBalance < price) throw new Error('Insufficient balance');
            t.update(walletRef, { balance: currentBalance - price });
        });

        // 3. CREATE TRANSACTION
        const newTx = {
            userId: uid,
            type: 'offer',
            operator,
            phoneNumber,
            offerName: offerData.name,
            amount: price,
            status: 'processing',
            createdAt: new Date().toISOString(),
            description: `Offer ${offerData.name} to ${phoneNumber}`
        };
        const txRef = await db.collection('transactions').add(newTx);
        transactionId = txRef.id;

        // 4. FIND SIM
        const simsSnapshot = await db.collection('sims')
            .where('operator', '==', operator)
            .where('status', '==', 'active')
            .get();
        const activeSim = simsSnapshot.docs[0];

        if (!activeSim) throw new Error(`No active SIM found for operator: ${operator}`);

        const simData = activeSim.data();
        const simId = activeSim.id;
        const gatewayIp = simData.port;
        const simPin = simData.pin || '0000';
        const simPhone = simData.phone || '';

        // 5. PREPARE USSD
        let ussdCode = offerData.ussdTemplate
            .replace('{price}', price)
            .replace('{phone}', phoneNumber) // Target phone
            .replace('{pin}', simPin);

        // 6. EXECUTE
        let result = { success: false, message: '' };
        if (gatewayIp && gatewayIp.startsWith('192')) {
            result = await zteGateway.sendUSSD(gatewayIp, ussdCode);
        } else {
            await new Promise(resolve => setTimeout(resolve, 2000));
            result = await gateway.sendUSSD(Number(simId) || 1, ussdCode);
        }

        // 7. UPDATE STATUS
        if (result.success) {
            await db.collection('transactions').doc(transactionId).update({
                status: 'completed',
                result: result.message,
                simId,
                completedAt: new Date().toISOString()
            });
            res.json({ success: true, transactionId, message: 'Offer activated successfully' });
        } else {
            throw new Error(`USSD Execution Failed: ${result.message}`);
        }

    } catch (error: any) {
        console.error('[Recharge Offer] Error:', error.message);
        // Refund
        if (transactionId && price > 0) {
            await db.runTransaction(async (t) => {
                const walletRef = db.collection('wallets').doc(uid);
                const walletDoc = await t.get(walletRef);
                const currentBalance = walletDoc.data()?.balance || 0;
                t.update(walletRef, { balance: currentBalance + price });

                const txRef = db.collection('transactions').doc(transactionId);
                t.update(txRef, { status: 'failed', error: error.message, failedAt: new Date().toISOString() });
            });
        }
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
