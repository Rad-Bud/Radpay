import { Router } from 'express';
import { db } from '../config/firebase.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Helper to get start of day
const getTodayStart = () => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return now.toISOString();
};

// GET /api/stats/dashboard - Comprehensive Dashboard Data
router.get('/dashboard', authenticate, async (req, res) => {
    try {
        const todayStart = getTodayStart();
        const { uid, role } = req.user!;

        // --- Role-Based Filtering Setup ---
        let transactionQuery: FirebaseFirestore.Query = db.collection('transactions');

        // If Wholesaler, only their own transactions (performed by them)
        if (role === 'wholesaler' || role === 'retailer') {
            transactionQuery = transactionQuery.where('performedBy', '==', uid);
        }

        // 1. Fetch Transactions (Recent for analysis)
        const txSnapshot = await transactionQuery
            .where('createdAt', '>=', todayStart)
            .get();

        // For history
        let allTxQuery: FirebaseFirestore.Query = db.collection('transactions');
        if (role === 'wholesaler' || role === 'retailer') {
            allTxQuery = allTxQuery.where('performedBy', '==', uid);
        }

        const allTxSnapshot = await allTxQuery
            .orderBy('createdAt', 'desc')
            .limit(1000)
            .get();

        const transactions = txSnapshot.docs.map(doc => doc.data());
        const historyTx = allTxSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        // 2. Fetch Users (for Location/Dealer analysis)
        const usersSnapshot = await db.collection('users').get();
        const users = usersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as any));
        const usersMap = new Map(users.map(u => [u.id, u]));

        // 3. Fetch Wallets 
        const walletsSnapshot = await db.collection('wallets').get();

        let displayBalance = 0;

        if (role === 'super_admin' || role === 'super_wholesaler') {
            displayBalance = walletsSnapshot.docs.reduce((acc, doc) => acc + (doc.data().balance || 0), 0);
        } else {
            // For specific user, find their wallet
            const myWallet = walletsSnapshot.docs.find(doc => doc.id === uid);
            displayBalance = myWallet ? (myWallet.data().balance || 0) : 0;
        }

        // --- KPI Calculations ---
        const totalTransactions = transactions.length;
        const totalRevenue = transactions
            .filter(t => t.status === 'completed')
            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
        const failedTransactions = transactions.filter(t => t.status === 'failed').length;

        // Active Dealers (users who made a transaction today)
        const activeDealersCount = new Set(transactions.map((t: any) => t.userId)).size;

        // --- Geographic Analysis (Top Locations) ---
        const locationStats: Record<string, { count: number, revenue: number }> = {};
        historyTx.forEach((tx: any) => {
            if (tx.status !== 'completed') return;
            const user = usersMap.get(tx.userId);

            // If wholesaler, ensure we only count their retailers (created by them)
            if (role === 'wholesaler' && user?.createdBy !== uid) return;

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

            // FILTER: Only show dealers createdBy this user (if wholesaler)
            if (role === 'wholesaler' && user.createdBy !== uid) return;

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
                systemBalance: displayBalance,
                currentBalance: displayBalance
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

// GET /api/stats/financials - Detailed Financial Stats
router.get('/financials', async (req, res) => {
    try {
        const todayStart = getTodayStart();

        // 1. Fetch all users to determine roles
        const usersSnapshot = await db.collection('users').get();
        const usersMap = new Map(); // uid -> role
        usersSnapshot.docs.forEach(doc => {
            usersMap.set(doc.id, doc.data().role);
        });

        // 2. Fetch all wallets
        const walletsSnapshot = await db.collection('wallets').get();

        let totalSystemBalance = 0;
        let totalWholesalerBalance = 0;
        let totalRetailerDebt = 0;

        walletsSnapshot.docs.forEach(doc => {
            const data = doc.data();
            const balance = data.balance || 0;
            const debt = data.debt || 0;
            const role = usersMap.get(doc.id);

            totalSystemBalance += balance;

            if (role === 'wholesaler') {
                totalWholesalerBalance += balance;
            } else if (role === 'retailer') {
                totalRetailerDebt += debt;
            }
        });

        // 3. Fetch Today's Transactions
        const todayTxSnapshot = await db.collection('transactions')
            .where('createdAt', '>=', todayStart)
            .get();

        const todayTransactionsCount = todayTxSnapshot.size;
        let todayVolume = 0;

        todayTxSnapshot.docs.forEach(doc => {
            const data = doc.data();
            if (data.status === 'completed') {
                todayVolume += Number(data.amount) || 0;
            }
        });

        res.json({
            totalSystemBalance,
            totalWholesalerBalance,
            totalRetailerDebt,
            todayTransactions: todayTransactionsCount,
            todayVolume
        });

    } catch (error) {
        console.error('Error fetching financial stats:', error);
        res.status(500).json({ error: 'Failed to fetch financial stats' });
    }
});

export default router;
