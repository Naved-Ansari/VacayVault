import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET dashboard summary data
router.get('/dashboard', async (req: Request, res: Response) => {
  try {
    // 1. Overall stats
    const statsQuery = `
      SELECT 
        (SELECT COUNT(*) FROM trips) AS total_trips,
        (SELECT COUNT(*) FROM expenses) AS total_expenses_count,
        COALESCE((SELECT SUM(amount_inr) FROM expenses), 0) AS total_spent_inr;
    `;
    const statsRes = await pool.query(statsQuery);
    const stats = statsRes.rows[0];

    // 2. Recent vacations (latest 3)
    const recentTripsQuery = `
      SELECT 
        t.id,
        t.name,
        t.start_date,
        t.end_date,
        t.travelers_count,
        COALESCE(SUM(e.amount_inr), 0) AS total_spent_inr,
        COUNT(DISTINCT e.id) AS expense_count,
        COALESCE(
          json_agg(DISTINCT d.name) FILTER (WHERE d.name IS NOT NULL), '[]'
        ) AS destinations
      FROM trips t
      LEFT JOIN expenses e ON t.id = e.trip_id
      LEFT JOIN destinations d ON t.id = d.trip_id
      GROUP BY t.id
      ORDER BY t.start_date DESC
      LIMIT 4;
    `;
    const recentTripsRes = await pool.query(recentTripsQuery);

    // 3. Recent expenses (latest 5)
    const recentExpensesQuery = `
      SELECT 
        e.id,
        e.trip_id,
        t.name AS trip_name,
        e.name,
        e.amount,
        e.currency,
        e.amount_inr,
        e.expense_date,
        c.name AS category_name,
        c.icon AS category_icon,
        c.color AS category_color,
        d.name AS destination_name,
        m.name AS paid_by_name
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN categories c ON e.category_id = c.id
      LEFT JOIN destinations d ON e.destination_id = d.id
      LEFT JOIN family_members m ON e.paid_by_member_id = m.id
      ORDER BY e.expense_date DESC, e.id DESC
      LIMIT 6;
    `;
    const recentExpensesRes = await pool.query(recentExpensesQuery);

    // 4. Spending by Category across all vacations
    const categorySpendingQuery = `
      SELECT 
        COALESCE(c.name, 'Uncategorized') AS name,
        COALESCE(c.color, '#94A3B8') AS color,
        COALESCE(c.icon, 'Tag') AS icon,
        SUM(e.amount_inr) AS total,
        COUNT(e.id) AS count
      FROM expenses e
      LEFT JOIN categories c ON e.category_id = c.id
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total DESC;
    `;
    const categorySpendingRes = await pool.query(categorySpendingQuery);

    // 5. Spending by Destination across all vacations
    const destinationSpendingQuery = `
      SELECT 
        COALESCE(d.name, 'General Trip Expenses') AS name,
        SUM(e.amount_inr) AS total,
        COUNT(e.id) AS count
      FROM expenses e
      LEFT JOIN destinations d ON e.destination_id = d.id
      GROUP BY d.name
      ORDER BY total DESC
      LIMIT 8;
    `;
    const destinationSpendingRes = await pool.query(destinationSpendingQuery);

    res.json({
      total_trips: parseInt(stats.total_trips, 10),
      total_expenses_count: parseInt(stats.total_expenses_count, 10),
      total_spent_inr: parseFloat(stats.total_spent_inr),
      recent_trips: recentTripsRes.rows,
      recent_expenses: recentExpensesRes.rows,
      category_spending: categorySpendingRes.rows.map(r => ({
        ...r,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10)
      })),
      destination_spending: destinationSpendingRes.rows.map(r => ({
        ...r,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10)
      }))
    });
  } catch (error) {
    console.error('Error fetching dashboard analytics:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard data' });
  }
});

// GET combined vacation historical view
router.get('/combined', async (req: Request, res: Response) => {
  try {
    const { year } = req.query;

    let filterClause = '';
    const params: any[] = [];
    if (year) {
      filterClause = ` WHERE EXTRACT(YEAR FROM t.start_date) = $1`;
      params.push(parseInt(year as string, 10));
    }

    // Trips summary
    const tripsRes = await pool.query(
      `SELECT 
        t.id,
        t.name,
        t.start_date,
        t.end_date,
        t.travelers_count,
        COALESCE(SUM(e.amount_inr), 0) AS total_spent_inr,
        COUNT(DISTINCT e.id) AS expense_count
       FROM trips t
       LEFT JOIN expenses e ON t.id = e.trip_id
       ${filterClause}
       GROUP BY t.id
       ORDER BY total_spent_inr DESC`,
      params
    );

    // All categories breakdown
    const catQuery = `
      SELECT 
        COALESCE(c.name, 'Uncategorized') AS name,
        COALESCE(c.color, '#94A3B8') AS color,
        COALESCE(c.icon, 'Tag') AS icon,
        SUM(e.amount_inr) AS total,
        COUNT(e.id) AS count
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN categories c ON e.category_id = c.id
      ${filterClause}
      GROUP BY c.id, c.name, c.color, c.icon
      ORDER BY total DESC;
    `;
    const catRes = await pool.query(catQuery, params);

    // All destinations breakdown
    const destQuery = `
      SELECT 
        COALESCE(d.name, 'Trip-wide / General') AS name,
        d.country,
        SUM(e.amount_inr) AS total,
        COUNT(e.id) AS count
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN destinations d ON e.destination_id = d.id
      ${filterClause}
      GROUP BY d.name, d.country
      ORDER BY total DESC;
    `;
    const destRes = await pool.query(destQuery, params);

    // Yearly / Monthly trends
    const trendQuery = `
      SELECT 
        TO_CHAR(e.expense_date, 'YYYY-MM') AS month_year,
        SUM(e.amount_inr) AS total,
        COUNT(e.id) AS count
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      ${filterClause}
      GROUP BY TO_CHAR(e.expense_date, 'YYYY-MM')
      ORDER BY month_year ASC;
    `;
    const trendRes = await pool.query(trendQuery, params);

    // Member spending
    const memberQuery = `
      SELECT 
        COALESCE(m.name, 'General / Unspecified') AS name,
        COALESCE(m.avatar_color, '#64748B') AS avatar_color,
        SUM(e.amount_inr) AS total,
        COUNT(e.id) AS count
      FROM expenses e
      JOIN trips t ON e.trip_id = t.id
      LEFT JOIN family_members m ON e.paid_by_member_id = m.id
      ${filterClause}
      GROUP BY m.id, m.name, m.avatar_color
      ORDER BY total DESC;
    `;
    const memberRes = await pool.query(memberQuery, params);

    const totalSpent = tripsRes.rows.reduce(
      (acc, t) => acc + parseFloat(t.total_spent_inr || 0),
      0
    );

    res.json({
      total_trips: tripsRes.rows.length,
      total_spent_inr: totalSpent,
      trips: tripsRes.rows,
      category_breakdown: catRes.rows.map(r => ({
        ...r,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10),
        percentage: totalSpent > 0 ? parseFloat(((parseFloat(r.total) / totalSpent) * 100).toFixed(1)) : 0,
      })),
      destination_breakdown: destRes.rows.map(r => ({
        ...r,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10),
      })),
      spending_trends: trendRes.rows.map(r => ({
        month_year: r.month_year,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10),
      })),
      member_spending: memberRes.rows.map(r => ({
        ...r,
        total: parseFloat(r.total),
        count: parseInt(r.count, 10),
      })),
    });
  } catch (error) {
    console.error('Error fetching combined analytics:', error);
    res.status(500).json({ error: 'Failed to fetch combined analytics' });
  }
});

export default router;
