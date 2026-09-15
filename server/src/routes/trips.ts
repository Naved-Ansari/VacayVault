import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET all trips with summary metrics
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        t.id,
        t.name,
        t.start_date,
        t.end_date,
        t.travelers_count,
        t.trip_type,
        t.notes,
        t.created_at,
        COALESCE(SUM(e.amount_inr), 0) AS total_spent_inr,
        COUNT(DISTINCT e.id) AS expense_count,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', d.id, 'name', d.name, 'country', d.country)
          ) FILTER (WHERE d.id IS NOT NULL), '[]'
        ) AS destinations
      FROM trips t
      LEFT JOIN expenses e ON t.id = e.trip_id
      LEFT JOIN destinations d ON t.id = d.trip_id
      GROUP BY t.id
      ORDER BY t.start_date DESC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching trips:', error);
    res.status(500).json({ error: 'Failed to fetch trips' });
  }
});

// GET unique previous destinations across all trips (for reuse / autocomplete)
router.get('/destinations/list', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        TRIM(d.name) AS name,
        COALESCE(MAX(d.country), '') AS country,
        COUNT(DISTINCT d.trip_id) AS trips_count
      FROM destinations d
      WHERE TRIM(d.name) <> ''
      GROUP BY LOWER(TRIM(d.name)), TRIM(d.name)
      ORDER BY trips_count DESC, TRIM(d.name) ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching destinations:', error);
    res.status(500).json({ error: 'Failed to fetch destinations' });
  }
});

// GET single trip by ID with detailed breakdown
router.get('/:id', async (req: Request, res: Response) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try {
    // 1. Fetch trip details
    const tripRes = await pool.query('SELECT * FROM trips WHERE id = $1', [tripId]);
    if (tripRes.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    const trip = tripRes.rows[0];

    // 2. Fetch destinations
    const destRes = await pool.query(
      'SELECT id, name, country FROM destinations WHERE trip_id = $1 ORDER BY id ASC',
      [tripId]
    );
    trip.destinations = destRes.rows;

    // 3. Fetch all expenses for this trip with joins
    const expRes = await pool.query(
      `SELECT 
        e.id,
        e.trip_id,
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
        e.is_spread_across_trip,
        e.created_at
       FROM expenses e
       LEFT JOIN destinations d ON e.destination_id = d.id
       LEFT JOIN categories c ON e.category_id = c.id
       LEFT JOIN subcategories s ON e.subcategory_id = s.id
       LEFT JOIN family_members m ON e.paid_by_member_id = m.id
       WHERE e.trip_id = $1
       ORDER BY e.expense_date DESC, e.id DESC`,
      [tripId]
    );
    trip.expenses = expRes.rows;

    // 4. Calculate total spent in INR
    const totalSpent = expRes.rows.reduce(
      (acc, exp) => acc + parseFloat(exp.amount_inr || 0),
      0
    );
    trip.total_spent_inr = totalSpent;

    // 5. Category breakdown
    const catBreakdown: Record<string, { name: string; color: string; icon: string; total: number; count: number }> = {};
    for (const exp of expRes.rows) {
      const catName = exp.category_name || 'Uncategorized';
      if (!catBreakdown[catName]) {
        catBreakdown[catName] = {
          name: catName,
          color: exp.category_color || '#94A3B8',
          icon: exp.category_icon || 'Tag',
          total: 0,
          count: 0,
        };
      }
      catBreakdown[catName].total += parseFloat(exp.amount_inr || 0);
      catBreakdown[catName].count += 1;
    }
    trip.category_breakdown = Object.values(catBreakdown).sort((a, b) => b.total - a.total);

    // 6. Destination breakdown
    const destBreakdown: Record<string, { name: string; total: number; count: number }> = {};
    for (const exp of expRes.rows) {
      const dName = exp.destination_name || 'Trip-wide / General';
      if (!destBreakdown[dName]) {
        destBreakdown[dName] = { name: dName, total: 0, count: 0 };
      }
      destBreakdown[dName].total += parseFloat(exp.amount_inr || 0);
      destBreakdown[dName].count += 1;
    }
    trip.destination_breakdown = Object.values(destBreakdown).sort((a, b) => b.total - a.total);

    // 7. Daily spending timeline
    // Generate all dates in the trip range
    const tripStartStr = typeof trip.start_date === 'string' ? trip.start_date.split('T')[0] : String(trip.start_date).split('T')[0];
    const tripEndStr = typeof trip.end_date === 'string' ? trip.end_date.split('T')[0] : String(trip.end_date).split('T')[0];
    const tripStartParts = tripStartStr.split('-').map(Number);
    const tripEndParts = tripEndStr.split('-').map(Number);
    const tripStartDate = new Date(tripStartParts[0], tripStartParts[1] - 1, tripStartParts[2]);
    const tripEndDate = new Date(tripEndParts[0], tripEndParts[1] - 1, tripEndParts[2]);
    const totalTripDays = Math.max(1, Math.round((tripEndDate.getTime() - tripStartDate.getTime()) / (1000 * 60 * 60 * 24)) + 1);

    // Build array of all trip date strings
    const allTripDates: string[] = [];
    for (let d = new Date(tripStartDate); d <= tripEndDate; d.setDate(d.getDate() + 1)) {
      const y = d.getFullYear();
      const m = String(d.getMonth() + 1).padStart(2, '0');
      const dd = String(d.getDate()).padStart(2, '0');
      allTripDates.push(`${y}-${m}-${dd}`);
    }

    const dailySpending: Record<string, number> = {};
    for (const exp of expRes.rows) {
      const amountInr = parseFloat(exp.amount_inr || 0);

      if (exp.is_spread_across_trip && totalTripDays > 1) {
        // Distribute evenly across all trip days
        const perDay = amountInr / totalTripDays;
        for (const dateStr of allTripDates) {
          dailySpending[dateStr] = (dailySpending[dateStr] || 0) + perDay;
        }
      } else {
        // Normal: assign to the expense's own date
        let dateStr = '';
        if (typeof exp.expense_date === 'string') {
          dateStr = exp.expense_date.split('T')[0];
        } else if (exp.expense_date instanceof Date) {
          const y = exp.expense_date.getFullYear();
          const m = String(exp.expense_date.getMonth() + 1).padStart(2, '0');
          const dd = String(exp.expense_date.getDate()).padStart(2, '0');
          dateStr = `${y}-${m}-${dd}`;
        } else {
          dateStr = String(exp.expense_date).split('T')[0];
        }
        dailySpending[dateStr] = (dailySpending[dateStr] || 0) + amountInr;
      }
    }
    trip.daily_spending = Object.entries(dailySpending)
      .map(([date, total]) => ({ date, total: parseFloat(total.toFixed(2)) }))
      .sort((a, b) => a.date.localeCompare(b.date));

    res.json(trip);
  } catch (error) {
    console.error('Error fetching trip details:', error);
    res.status(500).json({ error: 'Failed to fetch trip details' });
  }
});

// CREATE a new trip
router.post('/', async (req: Request, res: Response) => {
  const { name, start_date, end_date, travelers_count, trip_type, notes, destinations } = req.body;
  if (!name || !start_date || !end_date) {
    return res.status(400).json({ error: 'Name, start date, and end date are required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tripRes = await client.query(
      `INSERT INTO trips (name, start_date, end_date, travelers_count, trip_type, notes)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [name, start_date, end_date, travelers_count || 1, trip_type || 'single', notes || '']
    );
    const newTrip = tripRes.rows[0];

    // Insert destinations if provided
    const insertedDestinations = [];
    if (Array.isArray(destinations) && destinations.length > 0) {
      for (const dest of destinations) {
        const destName = typeof dest === 'string' ? dest.trim() : (dest.name ? dest.name.trim() : '');
        const destCountry = typeof dest === 'object' && dest.country ? dest.country.trim() : null;
        if (destName) {
          const destRes = await client.query(
            `INSERT INTO destinations (trip_id, name, country)
             VALUES ($1, $2, $3)
             RETURNING id, name, country`,
            [newTrip.id, destName, destCountry]
          );
          insertedDestinations.push(destRes.rows[0]);
        }
      }
    }

    await client.query('COMMIT');
    newTrip.destinations = insertedDestinations;
    res.status(201).json(newTrip);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error creating trip:', error);
    res.status(500).json({ error: 'Failed to create trip' });
  } finally {
    client.release();
  }
});

// UPDATE a trip
router.put('/:id', async (req: Request, res: Response) => {
  const tripId = parseInt(req.params.id, 10);
  const { name, start_date, end_date, travelers_count, trip_type, notes, destinations } = req.body;

  if (isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const tripRes = await client.query(
      `UPDATE trips 
       SET name = $1, start_date = $2, end_date = $3, travelers_count = $4, trip_type = $5, notes = $6, updated_at = CURRENT_TIMESTAMP
       WHERE id = $7
       RETURNING *`,
      [name, start_date, end_date, travelers_count || 1, trip_type || 'single', notes || '', tripId]
    );

    if (tripRes.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({ error: 'Trip not found' });
    }

    const updatedTrip = tripRes.rows[0];

    // If destinations array is supplied, replace or sync destinations
    if (Array.isArray(destinations)) {
      // First, get existing destination IDs
      const existingDests = await client.query('SELECT id, name FROM destinations WHERE trip_id = $1', [tripId]);
      const existingMap = new Map(existingDests.rows.map(d => [d.name.toLowerCase(), d.id]));

      // Clear existing and re-insert or keep
      await client.query('DELETE FROM destinations WHERE trip_id = $1', [tripId]);

      const insertedDestinations = [];
      for (const dest of destinations) {
        const destName = typeof dest === 'string' ? dest.trim() : (dest.name ? dest.name.trim() : '');
        const destCountry = typeof dest === 'object' && dest.country ? dest.country.trim() : null;
        if (destName) {
          const destRes = await client.query(
            `INSERT INTO destinations (trip_id, name, country)
             VALUES ($1, $2, $3)
             RETURNING id, name, country`,
            [tripId, destName, destCountry]
          );
          insertedDestinations.push(destRes.rows[0]);
        }
      }
      updatedTrip.destinations = insertedDestinations;
    }

    await client.query('COMMIT');
    res.json(updatedTrip);
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('Error updating trip:', error);
    res.status(500).json({ error: 'Failed to update trip' });
  } finally {
    client.release();
  }
});

// DELETE a trip
router.delete('/:id', async (req: Request, res: Response) => {
  const tripId = parseInt(req.params.id, 10);
  if (isNaN(tripId)) {
    return res.status(400).json({ error: 'Invalid trip ID' });
  }

  try {
    const result = await pool.query('DELETE FROM trips WHERE id = $1 RETURNING id', [tripId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found' });
    }
    res.json({ message: 'Trip deleted successfully', id: tripId });
  } catch (error) {
    console.error('Error deleting trip:', error);
    res.status(500).json({ error: 'Failed to delete trip' });
  }
});

// ADD a single destination to a trip
router.post('/:id/destinations', async (req: Request, res: Response) => {
  const tripId = parseInt(req.params.id, 10);
  const { name, country } = req.body;
  if (isNaN(tripId) || !name) {
    return res.status(400).json({ error: 'Trip ID and destination name are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO destinations (trip_id, name, country)
       VALUES ($1, $2, $3)
       RETURNING id, name, country`,
      [tripId, name.trim(), country ? country.trim() : null]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error adding destination:', error);
    res.status(500).json({ error: 'Failed to add destination' });
  }
});

export default router;
