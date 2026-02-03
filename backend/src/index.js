import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { db } from './config/firebase.js';
dotenv.config();
import gatewayRoutes from './routes/gateway.js';
const app = express();
const port = process.env.PORT || 3000;
app.use(cors());
app.use(express.json());
app.use('/api/gateway', gatewayRoutes);
app.get('/', (req, res) => {
    res.send('Rad Pay Backend is running');
});
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
