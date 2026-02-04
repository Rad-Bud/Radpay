import { Router } from 'express';
import { db } from '../config/firebase.js';

const router = Router();

// Helper to get start of day
const getTodayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
};

// GET /api/stats/dashboard - Comprehensive Dashboard Data
router.get('/dashboard', async (req, res) => {
    try {
        const todayStart = getTodayStart();

        // 1. Fetch Transactions (Recent for analysis)
        // In production, optimize this with specific queries or aggregations
        const txSnapshot = await db.collection('transactions')
            .where('createdAt', '>=', todayStart)
            .get();

        const allTxSnapshot = await db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .limit(1000) // Limit for detailed analysis of recent trends
            .get();

        const transactions = txSnapshot.docs.map(doc => doc.data());
        const historyTx = allTxSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        // 2. Fetch Users (for Location/Dealer analysis)
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const usersMap = new Map(users.map(u => [u.id, u]));

        // 3. Fetch Wallets (for total system balance)
        const walletsSnapshot = await db.collection('wallets').get();
        const systemBalance = walletsSnapshot.docs.reduce((acc, doc) => acc + (doc.data().balance || 0), 0);

        // --- KPI Calculations ---
        const totalTransactions = transactions.length;
        const totalRevenue = transactions
            .filter(t => t.status === 'completed')
            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const failedTransactions = transactions.filter(t => t.status === 'failed').length;

        // Active Dealers (users who made a transaction today)
        const activeDealersCount = new Set(transactions.map((t: any) => t.userId)).size;

        // --- Geographic Analysis (Top Locations) ---
        // Group revenue by Baladiya
        const locationStats: Record<string, { count: number, revenue: number }> = {};

        historyTx.forEach((tx: any) => {
            if (tx.status !== 'completed') return;
            const user = usersMap.get(tx.userId);
            const location = user?.baladiya || 'Unknown';

            if (!locationStats[location]) locationStats[location] = { count: 0, revenue: 0 };
            locationStats[location].count++;
            locationStats[location].revenue += Number(tx.amount) || 0;
        });

        const topLocations = Object.entries(locationStats)
            .map(([name, stat]) => ({ name, ...stat }))
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        // --- Offer Analysis ---
        const offerStats: Record<string, number> = {};
        historyTx.forEach((tx: any) => {
            const label = `${tx.amount} DA`;
            offerStats[label] = (offerStats[label] || 0) + 1;
        });
        const topOffers = Object.entries(offerStats)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);

        // --- Time Analysis (Hourly) ---
        const hourlyStats = new Array(24).fill(0).map((_, i) => ({ hour: i, count: 0 }));
        transactions.forEach((tx: any) => {
            const hour = new Date(tx.createdAt).getHours();
            hourlyStats[hour].count++;
        });

        // --- Top Dealers ---
        const dealerStats: Record<string, { name: string, count: number, revenue: number }> = {};
        historyTx.forEach((tx: any) => {
            if (tx.status !== 'completed') return;
            const user = usersMap.get(tx.userId);
            if (!user) return;

            if (!dealerStats[user.id]) dealerStats[user.id] = { name: user.name || 'Unknown', count: 0, revenue: 0 };
            dealerStats[user.id].count++;
            dealerStats[user.id].revenue += Number(tx.amount);
        });

        const topDealers = Object.values(dealerStats)
            .sort((a, b) => b.revenue - a.revenue)
            .slice(0, 10);

        res.json({
            kpi: {
                totalTransactions,
                totalRevenue,
                activeDealersCount,
                failedTransactions,
                systemBalance
            },
            geo: topLocations,
            offers: topOffers,
            time: hourlyStats,
            dealers: topDealers
        });

    } catch (error) {
        console.error('Error fetching dashboard stats:', error);
        res.status(500).json({ error: 'Failed to fetch dashboard stats' });
    }
});

// Original endpoint for simple stats
router.get('/transactions', async (req, res) => {
    try {
        const completedSnapshot = await db.collection('transactions').where('status', '==', 'completed').count().get();
        const pendingSnapshot = await db.collection('transactions').where('status', 'in', ['pending', 'processing']).count().get();
        res.json({ completed: completedSnapshot.data().count, pending: pendingSnapshot.data().count });
    } catch (error) {
        res.status(500).json({ error: 'Failed' });
    }
});

export default router;
