import { Router, Request, Response } from 'express';
import pool from '../config/db';
import { getRateToInr } from '../services/currency';

const router = Router();

// GET expenses with filtering and search
router.get('/', async (req: Request, res: Response) => {
  try {
    const {
      trip_id,
      category_id,
      destination_id,
      paid_by_member_id,
      start_date,
      end_date,
      search,
    } = req.query;

    let query = `
      SELECT 
        e.id,
        e.trip_id,
        t.name AS trip_name,
        e.destination_id,
        d.name AS destination_name,
        e.name,
        e.amount,
        e.currency,
        e.exchange_rate_to_inr,
        e.amount_inr,
        e.expense_date,
        e.category_id,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        e.subcategory_id,
        s.name AS subcategory_name,
        e.paid_by_member_id,
        m.name AS paid_by_name,
        m.avatar_color AS paid_by_color,
        e.comment,
        e.created_at,
        e.updated_at
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN destinations d ON e.destination_id = d.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN family_members m ON e.paid_by_member_id = m.id
      WHERE 1=1
    `;

    const params: any[] = [];
    let paramIndex = 1;

    if (trip_id) {
      query += ` AND e.trip_id = $${paramIndex++}`;
      params.push(parseInt(trip_id as string, 10));
    }
    if (category_id) {
      query += ` AND e.category_id = $${paramIndex++}`;
      params.push(parseInt(category_id as string, 10));
    }
    if (destination_id) {
      query += ` AND e.destination_id = $${paramIndex++}`;
      params.push(parseInt(destination_id as string, 10));
    }
    if (paid_by_member_id) {
      query += ` AND e.paid_by_member_id = $${paramIndex++}`;
      params.push(parseInt(paid_by_member_id as string, 10));
    }
    if (start_date) {
      query += ` AND e.expense_date >= $${paramIndex++}`;
      params.push(start_date);
    }
    if (end_date) {
      query += ` AND e.expense_date <= $${paramIndex++}`;
      params.push(end_date);
    }
    if (search) {
      query += ` AND (e.name ILIKE $${paramIndex} OR e.comment ILIKE $${paramIndex})`;
      params.push(`%${search}%`);
      paramIndex++;
    }

    query += ` ORDER BY e.expense_date DESC, e.id DESC`;

    const { rows } = await pool.query(query, params);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching expenses:', error);
    res.status(500).json({ error: 'Failed to fetch expenses' });
  }
});

// GET single expense
router.get('/:id', async (req: Request, res: Response) => {
  const expId = parseInt(req.params.id, 10);
  if (isNaN(expId)) {
    return res.status(400).json({ error: 'Invalid expense ID' });
  }

  try {
    const query = `
      SELECT 
        e.*,
        t.name AS trip_name,
        d.name AS destination_name,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        s.name AS subcategory_name,
        m.name AS paid_by_name,
        m.avatar_color AS paid_by_color
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN destinations d ON e.destination_id = d.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN family_members m ON e.paid_by_member_id = m.id
      WHERE e.id = $1
    `;
    const { rows } = await pool.query(query, [expId]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json(rows[0]);
  } catch (error) {
    console.error('Error fetching expense:', error);
    res.status(500).json({ error: 'Failed to fetch expense' });
  }
});

// ADD an expense
router.post('/', async (req: Request, res: Response) => {
  const {
    trip_id,
    destination_id,
    name,
    amount,
    currency = 'INR',
    exchange_rate_to_inr,
    expense_date,
    category_id,
    subcategory_id,
    paid_by_member_id,
    comment,
  } = req.body;

  if (!trip_id || !name || amount === undefined || amount === null || !expense_date) {
    return res.status(400).json({ error: 'Trip, name, amount, and date are required' });
  }

  try {
    const numericAmount = parseFloat(amount);
    const currUpper = (currency || 'INR').toUpperCase();

    let rate = 1.0;
    let amountInr = numericAmount;

    if (currUpper === 'INR') {
      rate = 1.0;
      amountInr = numericAmount;
    } else {
      if (exchange_rate_to_inr && parseFloat(exchange_rate_to_inr) > 0) {
        rate = parseFloat(exchange_rate_to_inr);
      } else {
        rate = await getRateToInr(currUpper);
      }
      amountInr = parseFloat((numericAmount * rate).toFixed(2));
    }

    const insertQuery = `
      INSERT INTO expenses (
        trip_id, destination_id, name, amount, currency, 
        exchange_rate_to_inr, amount_inr, expense_date, 
        category_id, subcategory_id, paid_by_member_id, comment
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING *
    `;

    const values = [
      trip_id,
      destination_id || null,
      name.trim(),
      numericAmount,
      currUpper,
      rate,
      amountInr,
      expense_date,
      category_id || null,
      subcategory_id || null,
      paid_by_member_id || null,
      comment || '',
    ];

    const result = await pool.query(insertQuery, values);
    const newExpId = result.rows[0].id;

    // Return joined row
    const fetchJoined = `
      SELECT 
        e.*,
        t.name AS trip_name,
        d.name AS destination_name,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        s.name AS subcategory_name,
        m.name AS paid_by_name,
        m.avatar_color AS paid_by_color
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN destinations d ON e.destination_id = d.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN family_members m ON e.paid_by_member_id = m.id
      WHERE e.id = $1
    `;
    const joinedRes = await pool.query(fetchJoined, [newExpId]);
    res.status(201).json(joinedRes.rows[0]);
  } catch (error) {
    console.error('Error creating expense:', error);
    res.status(500).json({ error: 'Failed to create expense' });
  }
});

// UPDATE an expense
router.put('/:id', async (req: Request, res: Response) => {
  const expId = parseInt(req.params.id, 10);
  if (isNaN(expId)) {
    return res.status(400).json({ error: 'Invalid expense ID' });
  }

  const {
    trip_id,
    destination_id,
    name,
    amount,
    currency = 'INR',
    exchange_rate_to_inr,
    expense_date,
    category_id,
    subcategory_id,
    paid_by_member_id,
    comment,
  } = req.body;

  try {
    const numericAmount = parseFloat(amount);
    const currUpper = (currency || 'INR').toUpperCase();

    let rate = 1.0;
    let amountInr = numericAmount;

    if (currUpper === 'INR') {
      rate = 1.0;
      amountInr = numericAmount;
    } else {
      if (exchange_rate_to_inr && parseFloat(exchange_rate_to_inr) > 0) {
        rate = parseFloat(exchange_rate_to_inr);
      } else {
        rate = await getRateToInr(currUpper);
      }
      amountInr = parseFloat((numericAmount * rate).toFixed(2));
    }

    const updateQuery = `
      UPDATE expenses
      SET 
        trip_id = $1,
        destination_id = $2,
        name = $3,
        amount = $4,
        currency = $5,
        exchange_rate_to_inr = $6,
        amount_inr = $7,
        expense_date = $8,
        category_id = $9,
        subcategory_id = $10,
        paid_by_member_id = $11,
        comment = $12,
        updated_at = CURRENT_TIMESTAMP
      WHERE id = $13
      RETURNING *
    `;

    const values = [
      trip_id,
      destination_id || null,
      name.trim(),
      numericAmount,
      currUpper,
      rate,
      amountInr,
      expense_date,
      category_id || null,
      subcategory_id || null,
      paid_by_member_id || null,
      comment || '',
      expId,
    ];

    const result = await pool.query(updateQuery, values);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }

    // Return joined row
    const fetchJoined = `
      SELECT 
        e.*,
        t.name AS trip_name,
        d.name AS destination_name,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        s.name AS subcategory_name,
        m.name AS paid_by_name,
        m.avatar_color AS paid_by_color
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN destinations d ON e.destination_id = d.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN family_members m ON e.paid_by_member_id = m.id
      WHERE e.id = $1
    `;
    const joinedRes = await pool.query(fetchJoined, [expId]);
    res.json(joinedRes.rows[0]);
  } catch (error) {
    console.error('Error updating expense:', error);
    res.status(500).json({ error: 'Failed to update expense' });
  }
});

// DELETE an expense
router.delete('/:id', async (req: Request, res: Response) => {
  const expId = parseInt(req.params.id, 10);
  if (isNaN(expId)) {
    return res.status(400).json({ error: 'Invalid expense ID' });
  }

  try {
    const result = await pool.query('DELETE FROM expenses WHERE id = $1 RETURNING id', [expId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Expense not found' });
    }
    res.json({ message: 'Expense deleted successfully', id: expId });
  } catch (error) {
    console.error('Error deleting expense:', error);
    res.status(500).json({ error: 'Failed to delete expense' });
  }
});

// DUPLICATE an expense (1-click copy)
router.post('/:id/duplicate', async (req: Request, res: Response) => {
  const expId = parseInt(req.params.id, 10);
  if (isNaN(expId)) {
    return res.status(400).json({ error: 'Invalid expense ID' });
  }

  try {
    const origRes = await pool.query('SELECT * FROM expenses WHERE id = $1', [expId]);
    if (origRes.rows.length === 0) {
      return res.status(404).json({ error: 'Source expense not found' });
    }
    const orig = origRes.rows[0];

    const insertQuery = `
      INSERT INTO expenses (
        trip_id, destination_id, name, amount, currency, 
        exchange_rate_to_inr, amount_inr, expense_date, 
        category_id, subcategory_id, paid_by_member_id, comment
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
      RETURNING id
    `;

    const values = [
      orig.trip_id,
      orig.destination_id,
      `${orig.name} (Copy)`,
      orig.amount,
      orig.currency,
      orig.exchange_rate_to_inr,
      orig.amount_inr,
      orig.expense_date,
      orig.category_id,
      orig.subcategory_id,
      orig.paid_by_member_id,
      orig.comment,
    ];

    const result = await pool.query(insertQuery, values);
    const newId = result.rows[0].id;

    // Fetch joined
    const fetchJoined = `
      SELECT 
        e.*,
        t.name AS trip_name,
        d.name AS destination_name,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        s.name AS subcategory_name,
        m.name AS paid_by_name,
        m.avatar_color AS paid_by_color
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN destinations d ON e.destination_id = d.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN subcategories s ON e.subcategory_id = s.id
      LEFT JOIN family_members m ON e.paid_by_member_id = m.id
      WHERE e.id = $1
    `;
    const joinedRes = await pool.query(fetchJoined, [newId]);
    res.status(201).json(joinedRes.rows[0]);
  } catch (error) {
    console.error('Error duplicating expense:', error);
    res.status(500).json({ error: 'Failed to duplicate expense' });
  }
});

export default router;
