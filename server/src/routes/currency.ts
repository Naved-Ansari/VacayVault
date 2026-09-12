import { Router, Request, Response } from 'express';
import { getAllRates, updateExchangeRates } from '../services/currency';

const router = Router();

// GET all rates to INR
router.get('/', async (req: Request, res: Response) => {
  try {
    const data = await getAllRates();
    res.json(data);
  } catch (error) {
    console.error('Error fetching currency rates:', error);
    res.status(500).json({ error: 'Failed to fetch currency rates' });
  }
});

// Force refresh rates
router.post('/refresh', async (req: Request, res: Response) => {
  try {
    const rates = await updateExchangeRates();
    res.json({ message: 'Currency rates refreshed', rates });
  } catch (error) {
    console.error('Error refreshing currency rates:', error);
    res.status(500).json({ error: 'Failed to refresh rates' });
  }
});

export default router;
