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

        console.log(`[Dashboard Stats] User: ${uid}, Role: ${role}`);

        // --- Role-Based Filtering Setup ---
        let userIdsToInclude: string[] = [];

        if (role === 'retailer') {
            // Retailer: Only their own data
            userIdsToInclude = [uid];
        } else if (role === 'wholesaler') {
            // Wholesaler: Their own + their retailers
            const retailersSnapshot = await db.collection('users')
                .where('createdBy', '==', uid)
                .where('role', '==', 'retailer')
                .get();

            const retailerIds = retailersSnapshot.docs.map(doc => doc.id);
            userIdsToInclude = [uid, ...retailerIds];
            console.log(`[Dashboard Stats] Wholesaler ${uid} managing ${retailerIds.length} retailers`);
        }
        // Admin/Super Admin: No filtering (see all)

        // 1. Fetch Transactions (Today for time analysis)
        let txQuery: FirebaseFirestore.Query = db.collection('transactions')
            .where('createdAt', '>=', todayStart);

        if (userIdsToInclude.length > 0) {
            // Firestore 'in' supports max 10 items
            if (userIdsToInclude.length <= 10) {
                txQuery = txQuery.where('userId', 'in', userIdsToInclude);
            }
        }

        const txSnapshot = await txQuery.get();
        let transactions = txSnapshot.docs.map(doc => doc.data());

        // If more than 10 users, filter in-memory
        if (userIdsToInclude.length > 10) {
            transactions = transactions.filter((tx: any) => userIdsToInclude.includes(tx.userId));
        }

        console.log(`[Dashboard Stats] Found ${transactions.length} transactions for today`);

        // 2. Fetch All Transactions (for history/trends)
        let allTxQuery: FirebaseFirestore.Query = db.collection('transactions')
            .orderBy('createdAt', 'desc')
            .limit(1000);

        const allTxSnapshot = await allTxQuery.get();
        let historyTx = allTxSnapshot.docs.map(doc => ({ ...doc.data(), id: doc.id }));

        // Filter history by role
        if (userIdsToInclude.length > 0) {
            historyTx = historyTx.filter((tx: any) => userIdsToInclude.includes(tx.userId));
        }

        console.log(`[Dashboard Stats] Found ${historyTx.length} historical transactions`);

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

        // --- NEW: Financial Breakdowns (SIMs, Games, Internet) ---
        let totalSimsBalance = 0;
        let totalGameCardsBalance = 0;
        let totalInternetCardsBalance = 0;

        // ONLY Calculate for Super Admins
        if (role === 'super_admin') {

            // A. Total SIMs Balance
            const simsSnapshot = await db.collection('sims').get();
            // console.log(`[Stats] Found ${simsSnapshot.size} SIMs`);

            totalSimsBalance = simsSnapshot.docs.reduce((acc, doc) => {
                const data = doc.data();
                const bal = Number(data.balance);
                return acc + (isNaN(bal) ? 0 : bal);
            }, 0);
            // console.log(`[Stats] Total Calculated Sims Balance: ${totalSimsBalance}`);


            // B. Cards Balance (Games vs Internet)
            // 1. Build Price Map from Games/Packages
            const gamesSnapshot = await db.collection('games').get();
            const priceMap: Record<string, number> = {}; // category/name -> price

            await Promise.all(gamesSnapshot.docs.map(async (gameDoc) => {
                const pkgs = await gameDoc.ref.collection('packages').get();
                pkgs.docs.forEach(pkg => {
                    const pData = pkg.data();
                    if (pData.name) priceMap[pData.name.trim()] = Number(pData.price) || 0;
                });
            }));

            // 2. Fetch Available Cards
            const cardsSnapshot = await db.collection('cards').where('status', '==', 'available').get();

            cardsSnapshot.docs.forEach(doc => {
                const card = doc.data();
                let price = 0;
                if (card.category && priceMap[card.category.trim()]) {
                    price = priceMap[card.category.trim()];
                }

                const op = (card.operator || '').toLowerCase();
                const cat = (card.category || '').toLowerCase();
                const isInternet = ['idoom', '4g', 'adsl', 'internet'].some(k => op.includes(k) || cat.includes(k));

                if (isInternet) {
                    totalInternetCardsBalance += price;
                } else {
                    totalGameCardsBalance += price;
                }
            });
        }


        // --- KPI Calculations ---
        const totalTransactions = transactions.length;

        // Calculate Total Spent (money that left accounts)
        const totalSpent = transactions
            .filter(t => t.status === 'completed')
            .reduce((acc, t) => acc + (Number(t.amount) || 0), 0);

        const failedTransactions = transactions.filter(t => t.status === 'failed').length;

        // Active Dealers (users who made a transaction today)
        const activeDealersCount = new Set(transactions.map((t: any) => t.userId)).size;

        // --- Spending Breakdown by User ---
        const spendingByUserMap: Record<string, { userId: string, userName: string, role: string, totalSpent: number }> = {};

        historyTx.forEach((tx: any) => {
            if (tx.status !== 'completed') return;

            const user = usersMap.get(tx.userId);
            if (!user) return;

            // Apply role-based filtering
            if (role === 'wholesaler' && user.createdBy !== uid && user.id !== uid) return;
            if (role === 'retailer' && user.id !== uid) return;

            if (!spendingByUserMap[tx.userId]) {
                spendingByUserMap[tx.userId] = {
                    userId: tx.userId,
                    userName: user.name || user.email || 'Unknown',
                    role: user.role || 'retailer',
                    totalSpent: 0
                };
            }
            spendingByUserMap[tx.userId].totalSpent += Number(tx.amount) || 0;
        });

        const spendingByUser = Object.values(spendingByUserMap)
            .sort((a, b) => b.totalSpent - a.totalSpent)
            .slice(0, 50); // Top 50 spenders

        console.log(`[Dashboard Stats] Total Spent: ${totalSpent}, Spending by ${spendingByUser.length} users`);

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
                totalSpent,
                activeDealersCount,
                failedTransactions,
                systemBalance: displayBalance,
                currentBalance: displayBalance,
                // New Financials
                totalSimsBalance,
                totalGameCardsBalance,
                totalInternetCardsBalance,
                // Spending breakdown
                spendingByUser
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
        const { days, startDate, endDate } = req.query;

        let startDateIso: string;

        // Handle custom date range or days-based period
        if (startDate && endDate) {
            // Custom date range
            const start = new Date(startDate as string);
            const end = new Date(endDate as string);
            start.setHours(0, 0, 0, 0);
            end.setHours(23, 59, 59, 999);
            startDateIso = start.toISOString();
        } else {
            // Days-based period (default)
            let periodDays = days ? Number(days) : 30;
            if (isNaN(periodDays)) periodDays = 30;

            const startDate = new Date();
            startDate.setDate(startDate.getDate() - periodDays);
            startDate.setHours(0, 0, 0, 0);
            try {
                startDateIso = startDate.toISOString();
            } catch (e) {
                startDateIso = new Date().toISOString(); // Fallback
            }
        }

        // 1. Fetch Related Users (Retailers)
        let retailersQuery = db.collection('users');

        if (role === 'wholesaler') {
            // Trust strict parent-child relationship (Wholesaler only creates Retailers)
            // This avoids issues where role might be 'Retailer' (case sensitive) or missing active status
            retailersQuery = retailersQuery.where('createdBy', '==', uid) as any;
        } else if (role === 'retailer') {
            // Retailer sees NO other retailers
            // We can just query for self to keep the array valid but size 1 (or 0)
            retailersQuery = retailersQuery.where('__name__', '==', uid) as any;
        } else {
            // Admin: Fetch all retailers specifically
            retailersQuery = retailersQuery.where('role', '==', 'retailer') as any;
        }

        const retailersSnapshot = await retailersQuery.get();
        const retailers = retailersSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        console.log(`[Stats] Found ${retailers.length} retailers for ${role} ${uid}`);

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
            // Admin sees sum of purely system            // Admin System Balance = Sum of all wallets
            walletsSnapshot.docs.forEach(doc => {
                totalSystemBalance += (doc.data().balance || 0);
            });
        }

        // Calculate Split Balances (Wholesaler vs Retailer)
        let calculatedWholesalersBalance = 0;
        let calculatedRetailersBalance = 0;

        retailers.forEach(u => {
            const w = walletsMap.get(u.id);
            calculatedRetailersBalance += (w?.balance || 0);
        });

        // Wholesalers = Total - Retailers (Or strictly sum wholesalers)
        // Let's strictly sum wholesalers/admins for accuracy if possible, but map only contains retailers if we didn't fetch all users.
        // Optimization: We fetched *all* wallets in line 205 for Admin.
        // We need to know which wallet belongs to a wholesaler.
        if (role === 'super_admin' || role === 'super_wholesaler') {
            // We need user roles. We only fetched 'retailers' in step 1.
            // Let's quick-fetch all wholesalers to be precise.
            const wholesalersSnapshot = await db.collection('users').where('role', 'in', ['wholesaler', 'super_wholesaler', 'super_admin']).get();
            wholesalersSnapshot.docs.forEach(doc => {
                const w = walletsMap.get(doc.id);
                calculatedWholesalersBalance += (w?.balance || 0);
            });
        } else if (role === 'wholesaler') {
            calculatedWholesalersBalance = totalSystemBalance; // For a wholesaler, their balance is the system balance relevant to them?
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

        // --- NEW: Calculate Total SIMs Balance (for Admin Deficit Calculation) ---
        let totalSimsBalance = 0;
        if (role === 'super_admin' || role === 'super_wholesaler' || role === 'wholesaler') { // Assuming wholesalers also want to see this
            const simsSnapshot = await db.collection('sims').get();
            totalSimsBalance = simsSnapshot.docs.reduce((acc, doc) => acc + (Number(doc.data().balance) || 0), 0);
        }

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
            } else if (role === 'retailer') {
                // Retailer: Only their own operations
                return tx.userId === uid || tx.performedBy === uid;
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

        // Final Wholesaler Balance Logic
        let finalWholesalerBalance = 0;
        if (role === 'wholesaler') {
            finalWholesalerBalance = totalSystemBalance;
        } else if (role === 'retailer') {
            // For Retailer, System Balance is their wallet balance
            totalSystemBalance = (walletsMap.get(uid)?.balance || 0);
            finalWholesalerBalance = 0; // Not applicable
            // Clear out other roles' data just in case
            calculatedWholesalersBalance = 0;
            totalTotalRetailersBalance = 0;
            lowBalanceRetailers.length = 0;
            activeRetailers.length = 0;
        } else {
            finalWholesalerBalance = calculatedWholesalersBalance; // For Admin, this is sum of wholesaler wallets
            // If Admin and calculatedWholesalersBalance is 0, maybe fallback to (System - Retailers)?
            // Only if we suspect we missed some wallets. But strictly, calculatedWholesalersBalance is correct.
            if (calculatedWholesalersBalance === 0 && totalSystemBalance > 0) {
                finalWholesalerBalance = totalSystemBalance - totalTotalRetailersBalance;
            }
        }

        // --- PROFIT AGGREGATION ---
        let totalAdminProfit = 0;
        let totalWholesalerProfit = 0;
        let totalRetailerProfit = 0;

        // Time-based profit tracking
        let todayProfit = 0;
        let weekProfit = 0;
        let monthProfit = 0;

        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        const monthStart = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

        relevantTransactions.forEach((tx: any) => {
            if (tx.status === 'completed' && tx.financials) {
                totalAdminProfit += (Number(tx.financials.adminProfit) || 0);
                totalWholesalerProfit += (Number(tx.financials.wholesalerProfit) || 0);
                totalRetailerProfit += (Number(tx.financials.retailerProfit) || 0);

                // Calculate time-based profits for retailers
                if (role === 'retailer' && tx.financials.retailerProfit) {
                    const txDate = new Date(tx.createdAt);
                    const profit = Number(tx.financials.retailerProfit) || 0;

                    if (txDate >= todayStart) {
                        todayProfit += profit;
                    }
                    if (txDate >= weekStart) {
                        weekProfit += profit;
                    }
                    if (txDate >= monthStart) {
                        monthProfit += profit;
                    }
                }
            }
        });

        res.json({
            // KPI Cards
            uid,
            totalSystemBalance,
            wholesalerDebt,
            totalWholesalerBalance: finalWholesalerBalance,
            totalRetailersBalance: totalTotalRetailersBalance,
            totalRetailerDebt,
            totalSimsBalance, // Added field
            totalAdminProfit,
            totalWholesalerProfit,
            totalRetailerProfit,

            // Retailer time-based profits
            todayProfit,
            weekProfit,
            monthProfit,
            averageDailyProfit: monthProfit / 30,

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
