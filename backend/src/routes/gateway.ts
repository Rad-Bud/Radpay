import { Router } from 'express';
import { gateway } from '../services/mockGateway.js';

const router = Router();

// GET /api/gateway/sims - List all SIMs
router.get('/sims', (req, res) => {
    const sims = gateway.getAllSims();
    res.json(sims);
});

// POST /api/gateway/ussd - Send USSD command
router.post('/ussd', async (req, res) => {
    const { slot, code } = req.body;

    if (!slot || !code) {
        return res.status(400).json({ error: 'Slot and code are required' });
    }

    try {
        const result = await gateway.sendUSSD(Number(slot), code);
        res.json(result);
    } catch (error: any) {
        res.status(500).json({ error: error.message });
    }
});

export default router;
