import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeDatabase } from './config/initDb';
import tripsRouter from './routes/trips';
import expensesRouter from './routes/expenses';
import categoriesRouter from './routes/categories';
import membersRouter from './routes/members';
import analyticsRouter from './routes/analytics';
import currencyRouter from './routes/currency';
import { updateExchangeRates } from './services/currency';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// API Routes
app.use('/api/trips', tripsRouter);
app.use('/api/expenses', expensesRouter);
app.use('/api/categories', categoriesRouter);
app.use('/api/members', membersRouter);
app.use('/api/analytics', analyticsRouter);
app.use('/api/currency', currencyRouter);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    app: 'VacayVault API',
    timestamp: new Date().toISOString(),
  });
});

// Start server
async function startServer() {
  try {
    await initializeDatabase();
    const { seedSampleData } = await import('./config/seedSampleData');
    await seedSampleData();
    // Warm up exchange rates in background
    updateExchangeRates().catch((e) => console.warn('Exchange rates initial warm-up failed:', e.message));

    app.listen(PORT, () => {
      console.log(`🚀 VacayVault Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start VacayVault server:', error);
    process.exit(1);
  }
}

startServer();
