import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase.js';

dotenv.config();

import gatewayRoutes from './routes/gateway.js';
import userRoutes from './routes/users.js';
import simsRoutes from './routes/sims.js';
import offersRoutes from './routes/offers.js';
import deliveryAppsRoutes from './routes/deliveryApps.js';
import gamesRoutes from './routes/games.js';
import notificationRoutes from './routes/notifications.js';
import complaintsRoutes from './routes/complaints.js';
import settingsRoutes from './routes/settings.js';
import transactionsRoutes from './routes/transactions.js';
import statsRoutes from './routes/stats.js';

const app = express();
const port = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

import * as fs from 'fs';
import * as path from 'path';
const DEBUG_LOG = path.join(process.cwd(), 'debug_request.log');

// Request logging middleware
app.use((req, res, next) => {
    const log = `[${new Date().toISOString()}] GLOBAL: ${req.method} ${req.originalUrl} IP=${req.ip}`;
    console.log(log);
    // fs.appendFileSync('debug_request.log', log + '\n');
    next();
});

// Routes
app.use('/api/gateway', gatewayRoutes);
app.use('/api/users', userRoutes);
app.use('/api/sims', simsRoutes);
app.use('/api/offers', offersRoutes);
app.use('/api/delivery-apps', deliveryAppsRoutes);
app.use('/api/games', gamesRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/complaints', complaintsRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/transactions', transactionsRoutes);

console.log('Registering /api/stats route...');
app.use('/api/stats', statsRoutes);

app.get('/', (req, res) => {
    res.send('Rad Pay Backend is running');
});

app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
    console.log(`Stats Loaded: ${!!statsRoutes}`);
});
