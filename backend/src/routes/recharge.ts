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

// Helper to get rates
const getRates = async () => {
    const doc = await db.collection('settings').doc('rates').get();
    if (doc.exists) return doc.data();
    return null;
};

// POST /api/recharge/flexy - Execute a Flexy recharge
router.post('/flexy', authenticate, async (req, res) => {
    const { uid, role } = req.user!; // Logged in merchant
    const { phoneNumber, amount, operator } = req.body;

    if (!phoneNumber || !amount || !operator) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    const rechargeAmount = Number(amount);
    let transactionId = '';
    let deductionAmount = rechargeAmount; // Default to full amount

    try {
        // 1. FETCH CONTEXT (User & Wholesaler) & Rates
        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const wholesalerId = userData?.createdBy || null;

        const rates = await getRates();

        // 2. FINANCIAL CALCULATION
        let financials = {};
        if (rates) {
            const opKey = operator.toLowerCase();
            const retailerRate = rates.retailer?.[opKey] || 0;
            const retailerCost = rechargeAmount * (1 - retailerRate / 100);

            const wholesalerRate = rates.wholesaler?.[opKey] || 0;
            const wholesalerCost = rechargeAmount * (1 - wholesalerRate / 100);

            const adminRate = rates.admin?.[opKey] || 0;
            const adminCost = rechargeAmount * (1 - adminRate / 100);

            const wholesalerProfit = retailerCost - wholesalerCost;
            const adminProfit = wholesalerCost - adminCost;

            financials = {
                retailerRate,
                retailerCost,
                wholesalerRate,
                wholesalerCost,
                adminRate,
                adminCost,
                wholesalerProfit,
                adminProfit,
                wholesalerId
            };

            // Determine deduction amount based on user role
            if (role === 'super_admin' || role === 'admin') {
                deductionAmount = adminCost;
            } else if (role === 'wholesaler' || role === 'super_wholesaler') {
                deductionAmount = wholesalerCost;
            } else {
                // retailer
                deductionAmount = retailerCost;
            }
        }

        // 3. ATOMIC DEDUCTION & TRANSACTION CREATION
        // We do this in one transaction to ensure money isn't lost without a record
        await db.runTransaction(async (t) => {
            const walletRef = db.collection('wallets').doc(uid);
            const walletDoc = await t.get(walletRef);

            if (!walletDoc.exists) {
                throw new Error('Merchant wallet not found');
            }

            const currentBalance = walletDoc.data()?.balance || 0;

            if (currentBalance < deductionAmount) {
                throw new Error('رصيد غير كافي');
            }

            // Deduct balance
            t.update(walletRef, { balance: currentBalance - deductionAmount });

            // Create Transaction Record
            const newTx = {
                userId: uid,
                type: 'flexy',
                operator,
                phoneNumber,
                amount: rechargeAmount, // Face Value
                status: 'processing',
                createdAt: new Date().toISOString(),
                description: `Flexy ${operator} to ${phoneNumber}`,
                financials
            };

            const txRef = db.collection('transactions').doc(); // Auto-ID
            transactionId = txRef.id; // Capture ID for later use
            t.set(txRef, newTx);
        });

        // 4. FIND SUITABLE SIM
        const simsSnapshot = await db.collection('sims')
            .where('operator', '==', operator)
            .where('status', '==', 'active')
            .get();

        const activeSim = simsSnapshot.docs[0];

        if (!activeSim) {
            throw new Error(`No active SIM found for operator: ${operator}`);
        }

        const simData = activeSim.data();
        const simId = activeSim.id;
        const gatewayIp = simData.port;
        const simPin = simData.pin || '0000';

        // 5. EXECUTE USSD
        const ussdCode = await getFlexyCode(operator, phoneNumber, rechargeAmount, simPin);

        let result = { success: false, message: '' };

        if (gatewayIp && gatewayIp.startsWith('192')) {
            console.log(`[Recharge] Executing Real USSD on ${gatewayIp}: ${ussdCode}`);
            result = await zteGateway.sendUSSD(gatewayIp, ussdCode);
        } else {
            console.log(`[Recharge] Executing Mock USSD on SIM ${simId}: ${ussdCode}`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            // Mock Success for now unless specific amount triggers fail
            result = await gateway.sendUSSD(Number(simId) || 1, ussdCode);
        }

        // 6. UPDATE TRANSACTION STATUS
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

        // COMPENSATING TRANSACTION (REFUND)
        if (transactionId) {
            try {
                await db.runTransaction(async (t) => {
                    const walletRef = db.collection('wallets').doc(uid);
                    const txRef = db.collection('transactions').doc(transactionId);

                    const walletDoc = await t.get(walletRef);
                    const currentBalance = walletDoc.data()?.balance || 0;

                    // Refund the EXACT DEDUCTED AMOUNT
                    t.update(walletRef, {
                        balance: currentBalance + deductionAmount // Use the outer variable which has correct cost
                    });

                    t.update(txRef, {
                        status: 'failed',
                        error: error.message,
                        failedAt: new Date().toISOString()
                    });
                });
                console.log(`[Recharge] Refunded ${deductionAmount} to ${uid} for failed tx ${transactionId}`);
            } catch (refundError) {
                console.error('CRITICAL: Failed to refund user after recharge failure', refundError);
            }
        }

        res.status(400).json({
            success: false,
            error: error.message || 'Operation failed'
        });
    }
});


// POST /api/recharge/offer - Execute an Offer recharge
router.post('/offer', authenticate, async (req, res) => {
    const { uid, role } = req.user!;
    const { phoneNumber, offerId } = req.body;

    if (!phoneNumber || !offerId) {
        return res.status(400).json({ error: 'Missing required fields' });
    }

    let transactionId = '';
    let price = 0;
    let deductionAmount = 0;

    try {
        // 1. Fetch Offer details and user context
        const offerDoc = await db.collection('offers').doc(offerId).get();
        if (!offerDoc.exists) throw new Error('Offer not found');
        const offerData = offerDoc.data()!;
        price = Number(offerData.price);
        const operator = offerData.operator;

        const userDoc = await db.collection('users').doc(uid).get();
        const userData = userDoc.data();
        const wholesalerId = userData?.createdBy || null;

        const rates = await getRates();

        // 2. FINANCIAL CALCULATION
        let financials = {};
        if (rates) {
            const opKey = operator.toLowerCase();
            const retailerRate = rates.retailer?.[opKey] || 0;
            const retailerCost = price * (1 - retailerRate / 100);

            const wholesalerRate = rates.wholesaler?.[opKey] || 0;
            const wholesalerCost = price * (1 - wholesalerRate / 100);

            const adminRate = rates.admin?.[opKey] || 0;
            const adminCost = price * (1 - adminRate / 100);

            const wholesalerProfit = retailerCost - wholesalerCost;
            const adminProfit = wholesalerCost - adminCost;

            financials = {
                retailerRate,
                retailerCost,
                wholesalerRate,
                wholesalerCost,
                adminRate,
                adminCost,
                wholesalerProfit,
                adminProfit,
                wholesalerId
            };

            // Determine deduction amount based on user role
            if (role === 'super_admin' || role === 'admin') {
                deductionAmount = adminCost;
            } else if (role === 'wholesaler' || role === 'super_wholesaler') {
                deductionAmount = wholesalerCost;
            } else {
                // retailer
                deductionAmount = retailerCost;
            }
        } else {
            // No rates configured, use full price
            deductionAmount = price;
        }

        // 3. BALANCE CHECK & DEDUCTION
        await db.runTransaction(async (t) => {
            const walletRef = db.collection('wallets').doc(uid);
            const walletDoc = await t.get(walletRef);
            if (!walletDoc.exists) throw new Error('Merchant wallet not found');
            const currentBalance = walletDoc.data()?.balance || 0;
            if (currentBalance < deductionAmount) throw new Error('رصيد غير كافي');
            t.update(walletRef, { balance: currentBalance - deductionAmount });
        });

        // 4. CREATE TRANSACTION
        const newTx = {
            userId: uid,
            type: 'offer',
            operator,
            phoneNumber,
            offerName: offerData.name,
            amount: price,
            status: 'processing',
            createdAt: new Date().toISOString(),
            description: `Offer ${offerData.name} to ${phoneNumber}`,
            financials
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
        if (transactionId && deductionAmount > 0) {
            await db.runTransaction(async (t) => {
                const walletRef = db.collection('wallets').doc(uid);
                const walletDoc = await t.get(walletRef);
                const currentBalance = walletDoc.data()?.balance || 0;
                t.update(walletRef, { balance: currentBalance + deductionAmount });

                const txRef = db.collection('transactions').doc(transactionId);
                t.update(txRef, { status: 'failed', error: error.message, failedAt: new Date().toISOString() });
            });
        }
        res.status(400).json({ success: false, error: error.message });
    }
});

export default router;
