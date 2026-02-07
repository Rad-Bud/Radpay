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
router.get('/financials', authenticate, async (req, res) => {
    try {
        const { uid, role } = req.user!;
        const { days } = req.query;
        let periodDays = days ? Number(days) : 30; // Default 30 days
        if (isNaN(periodDays)) periodDays = 30;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - periodDays);
        startDate.setHours(0, 0, 0, 0);
        let startDateIso;
        try {
            startDateIso = startDate.toISOString();
        } catch (e) {
            startDateIso = new Date().toISOString(); // Fallback
        }

        // 1. Fetch Related Users (Retailers)
        let retailersQuery = db.collection('users').where('role', '==', 'retailer');
        if (role === 'wholesaler') {
            retailersQuery = retailersQuery.where('createdBy', '==', uid);
        }
        const retailersSnapshot = await retailersQuery.get();
        const retailers = retailersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        const retailerIds = retailers.map(u => u.id);

        // 2. Fetch Wallets
        let walletsSnapshot;
        if (role === 'wholesaler') {
            // Fetch only relevant wallets: Self + Retailers
            const relevantIds = [uid, ...retailerIds];
            if (relevantIds.length > 0) {
                // Firestore 'in' query limit is 10, so strictly we should batch. 
                // For now, if list is small ok, if large we fetch all and filter in memory or do batches.
                // Optimized: Fetch all wallets and filter in memory (simpler for now than multiple batches)
                walletsSnapshot = await db.collection('wallets').get();
            } else {
                walletsSnapshot = await db.collection('wallets').get();
            }
        } else {
            walletsSnapshot = await db.collection('wallets').get();
        }

        const walletsMap = new Map(); // uid -> { balance, debt }
        walletsSnapshot.docs.forEach(doc => {
            walletsMap.set(doc.id, doc.data());
        });

        // 3. Calculate Balances
        let totalSystemBalance = 0;
        let totalTotalRetailersBalance = 0;
        let totalRetailerDebt = 0;
        let wholesalerDebt = 0;
        const lowBalanceRetailers: any[] = [];

        // System Balance (My Wallet for Wholesaler, All for Admin)
        if (role === 'wholesaler') {
            // Direct fetch to ensure accuracy
            const myWalletDoc = await db.collection('wallets').doc(uid).get();
            const myWallet = myWalletDoc.data();

            console.log(`[Stats] Wholesaler UID: ${uid}`);
            console.log(`[Stats] Direct Wallet Fetch:`, myWallet);

            totalSystemBalance = myWallet?.balance || 0;
            wholesalerDebt = myWallet?.debt || 0;
            console.log(`[Stats] Resolved Debt: ${wholesalerDebt}`);
        } else {
            // Admin sees sum of purely system funds ?? Or just sum of all wallets?
            // Usually Admin System Balance = Sum of all wallets
            walletsSnapshot.docs.forEach(doc => {
                totalSystemBalance += (doc.data().balance || 0);
            });
        }

        // Retailers Balances & Low Balance Check
        retailers.forEach((user: any) => {
            const wallet = walletsMap.get(user.id);
            const balance = wallet?.balance || 0;
            const debt = wallet?.debt || 0;

            totalTotalRetailersBalance += balance;
            totalRetailerDebt += debt;

            if (balance < 5000) {
                lowBalanceRetailers.push({
                    id: user.id,
                    name: user.name || 'Unknown',
                    balance
                });
            }
        });

        // 4. Fetch History for Charts & Activity
        let txQuery = db.collection('transactions').where('createdAt', '>=', startDateIso);

        // For Wholesaler: Only transactions performed BY them OR BY their retailers?
        // Usually Financials for Wholesaler = Their sales to retailers (Cash In) AND Retailers sales (Activity)
        // Let's focus on: Volume of Valid Transactions flowing through the system

        const txSnapshot = await txQuery.orderBy('createdAt', 'asc').get(); // Order for chart
        const allTransactions = txSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));

        // Filter transactions relevant to this user
        const relevantTransactions = allTransactions.filter((tx: any) => {
            if (role === 'wholesaler') {
                // Include:
                // 1. Performed By Me (e.g. Balance Transfer to Retailer)
                // 2. Performed By My Retailers (e.g. Flexy to Customer)
                return tx.performedBy === uid || retailerIds.includes(tx.userId) || retailerIds.includes(tx.performedBy);
            }
            return true;
        });

        // 5. Active Retailers Setup
        const retailerActivity: Record<string, { count: number, volume: number, name: string }> = {};

        // 6. Chart Data Setup
        const dailyStats: Record<string, { date: string, amount: number, count: number }> = {};

        relevantTransactions.forEach((tx: any) => {
            if (tx.status !== 'completed') return;
            const amount = Number(tx.amount) || 0;

            // Chart Data (Group by Day)
            if (!tx.createdAt) return; // Skip if no date
            const dateKey = tx.createdAt.split('T')[0];
            if (!dailyStats[dateKey]) dailyStats[dateKey] = { date: dateKey, amount: 0, count: 0 };

            // Only count positive value transactions for Volume (ignore adjustments/deductions for the specific sales chart if desired,
            // but for "Financial Activity" usually all movement counts. Let's stick to Sales/Transfers being positive).
            if (amount > 0) {
                dailyStats[dateKey].amount += amount;
            }
            dailyStats[dateKey].count += 1;

            // Active Retailers Logic
            // If the transaction was done BY a retailer (e.g. Flexy)
            if (retailerIds.includes(tx.performedBy)) {
                if (!retailerActivity[tx.performedBy]) {
                    const r = retailers.find(u => u.id === tx.performedBy);
                    const retailerName = (r as any)?.name || 'Unknown';
                    retailerActivity[tx.performedBy] = { count: 0, volume: 0, name: retailerName };
                }
                retailerActivity[tx.performedBy].count += 1;
                retailerActivity[tx.performedBy].volume += amount;
            }
        });

        const chartData = Object.values(dailyStats).sort((a, b) => a.date.localeCompare(b.date));

        const activeRetailers = Object.values(retailerActivity)
            .sort((a, b) => b.volume - a.volume)
            .slice(0, 5); // Top 5

        // Today's specific stats (legacy support + cards)
        const todayIso = new Date().toISOString().split('T')[0];
        const todayStats = dailyStats[todayIso] || { amount: 0, count: 0 };

        res.json({
            // KPI Cards
            uid,
            totalSystemBalance,
            wholesalerDebt,
            totalWholesalerBalance: totalTotalRetailersBalance, // Naming kept for compatibility or updated frontend
            totalRetailersBalance: totalTotalRetailersBalance,  // Better name
            totalRetailerDebt,

            // Today
            todayVolume: todayStats.amount,
            todayTransactions: todayStats.count,

            // Lists
            activeRetailers,
            lowBalanceRetailers, // < 5000

            // Chart
            chartData
        });

    } catch (error) {
        console.error('Error fetching financial stats:', error);
        res.status(500).json({ error: 'Failed to fetch financial stats' });
    }
});

export default router;
