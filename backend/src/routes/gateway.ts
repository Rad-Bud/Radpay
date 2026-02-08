import { Router } from 'express';
import type { Request, Response } from 'express';
import { gateway } from '../services/mockGateway.js';
import { zteGateway } from '../services/zteGateway.js';
import { db } from '../config/firebase.js';
import * as fs from 'fs';
import * as path from 'path';

const DEBUG_LOG = path.join(process.cwd(), 'debug_request.log');

const router = Router();

// GET /api/gateway/sims - List all SIMs
router.get('/sims', (req: Request, res: Response) => {
    const sims = gateway.getAllSims();
    res.json(sims);
});

// POST /api/gateway/ussd - Send USSD command
router.post('/ussd', async (req: Request, res: Response) => {
    const { slot, code } = req.body;

    const logEntry = `[${new Date().toISOString()}] REQ: Slot=${slot}, Code=${code}, IP=${req.ip}\n`;
    try { fs.appendFileSync(DEBUG_LOG, logEntry); } catch (e) { console.error("Log failed", e); }

    console.log(logEntry.trim());

    if (!slot || !code) {
        return res.status(400).json({ error: 'Slot and code are required' });
    }

    try {
        console.log(`[Router] Fetching SIM ${slot} from Firestore...`);
        // 1. Fetch SIM details from Firestore to verify and get IP/Port
        // Assuming 'slot' passed from frontend is actually the 'id' (which is correct in our frontend logic)
        // OR we search by 'slot' field if it exists.
        // Let's assume frontend passes the ID for now.

        // Strategy: Try to find SIM by ID
        let simDoc = await db.collection('sims').doc(String(slot)).get();
        let simData = simDoc.exists ? simDoc.data() : null;
        console.log(`[Router] SIM Data found: ${!!simData}`);

        // If not found by ID, try finding by custom 'slot' field if we had one (we handled slots loosely)
        // For now, let's rely on ID or default Mock if not found.

        const gatewayIp = simData?.port; // This is the 'port' field from our Sims.tsx form

        console.log(`[${new Date().toISOString()}] USSD Request for Slot ${slot} (IP: ${gatewayIp})`);

        // 2. Decide Strategy
        if (gatewayIp && gatewayIp.startsWith('192')) {
            // Use ZTE Real Gateway
            console.log(`[Router] Routing to ZTE Modem at ${gatewayIp}`);
            const result = await zteGateway.sendUSSD(gatewayIp, code);

            // 3. Attempt to Parse Balance
            // RAW: "Sama, Solde 20.036,65DA"
            // PREV REGEX matched "," from "Sama," which is wrong.

            // New Strategy: Look for a sequence of digits, dots, commas that ends with a digit, and is optionally followed by DA
            // And ensure it has at least one digit.
            const balanceMatch = result.message.match(/(\d[\d\.,]*\d|\d)\s*(?:DA|DZD)/i);

            if (balanceMatch && result.success) {
                let rawBalance = balanceMatch[1];
                // However, in Algeria (DA), usually ',' is decimal. 
                // Let's assume ',' is decimal if present.

                let normalized = rawBalance.replace(/\./g, '').replace(',', '.');

                // If the result is just a number like "1000", it remains "1000"

                const newBalance = parseFloat(normalized);
                console.log(`[Router] Parsed Balance: ${newBalance} (Raw: ${rawBalance})`);

                if (!isNaN(newBalance)) {
                    // Update SIM balance in Firestore
                    await db.collection('sims').doc(String(slot)).update({
                        balance: newBalance,
                        updatedAt: new Date().toISOString()
                    });
                }
            }

            res.json(result);
        } else {
            // Fallback to Mock
            console.log(`[Router] Routing to Mock Gateway (Slot ${slot})`);
            const result = await gateway.sendUSSD(Number(slot) || 1, code);

            // Apply same parsing logic for Mock results to update DB
            if (result.success && result.message) {
                const balanceMatch = result.message.match(/(\d[\d\.,]*\d|\d)\s*(?:DA|DZD)/i);
                if (balanceMatch) {
                    let rawBalance = balanceMatch[1];
                    let normalized = rawBalance.replace(/\./g, '').replace(',', '.');
                    const newBalance = parseFloat(normalized);

                    console.log(`[Router] (Mock) Parsed Balance: ${newBalance}`);

                    if (!isNaN(newBalance)) {
                        await db.collection('sims').doc(String(slot)).update({
                            balance: newBalance,
                            updatedAt: new Date().toISOString()
                        });
                    }
                }
            }

            res.json(result);
        }

    } catch (error: any) {
        console.error('Gateway Error:', error);
        res.status(500).json({ error: error.message });
    }
});

// POST /api/gateway/execute-offer - Execute an offer on a specific SIM
router.post('/execute-offer', async (req: Request, res: Response) => {
    const { simId, ussdCode, offerName, price } = req.body;

    console.log(`[Execute Offer] SIM: ${simId}, Offer: ${offerName}, USSD: ${ussdCode}`);

    if (!simId || !ussdCode) {
        return res.status(400).json({ error: 'simId and ussdCode are required' });
    }

    try {
        // Fetch SIM details from Firestore
        const simDoc = await db.collection('sims').doc(String(simId)).get();

        if (!simDoc.exists) {
            return res.status(404).json({ error: 'SIM not found' });
        }

        const simData = simDoc.data();
        const gatewayIp = simData?.port;
        const simPhone = simData?.phone;
        const simPin = simData?.pin;

        // Replace placeholders in USSD template
        let finalUssdCode = ussdCode
            .replace('{price}', price || '')
            .replace('{phone}', simPhone || '')
            .replace('{pin}', simPin || '');

        console.log(`[Execute Offer] Final USSD: ${finalUssdCode}`);

        // Execute USSD
        let result;
        if (gatewayIp && gatewayIp.startsWith('192')) {
            // Use ZTE Real Gateway
            console.log(`[Execute Offer] Using ZTE Gateway at ${gatewayIp}`);
            result = await zteGateway.sendUSSD(gatewayIp, finalUssdCode);
        } else {
            // Fallback to Mock
            console.log(`[Execute Offer] Using Mock Gateway`);
            result = await gateway.sendUSSD(Number(simId) || 1, finalUssdCode);
        }

        // Log the transaction
        await db.collection('offer_executions').add({
            simId,
            simPhone,
            offerName,
            price,
            ussdCode: finalUssdCode,
            result: result.message,
            success: result.success,
            executedAt: new Date().toISOString()
        });

        res.json({
            success: result.success,
            message: result.message,
            offer: offerName
        });

    } catch (error: any) {
        console.error('[Execute Offer] Error:', error);
        res.status(500).json({ error: error.message });
    }
});

export default router;
