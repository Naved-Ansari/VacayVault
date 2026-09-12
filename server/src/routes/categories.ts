import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET all categories with their subcategories
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        c.id,
        c.name,
        c.icon,
        c.color,
        c.is_default,
        c.created_at,
        COUNT(DISTINCT e.id) AS expense_count,
        COALESCE(SUM(e.amount_inr), 0) AS total_spent_inr,
        COALESCE(
          json_agg(
            DISTINCT jsonb_build_object('id', s.id, 'name', s.name)
          ) FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS subcategories
      FROM categories c
      LEFT JOIN subcategories s ON c.id = s.category_id
      LEFT JOIN expenses e ON c.id = e.category_id
      GROUP BY c.id
      ORDER BY c.is_default DESC, c.name ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ error: 'Failed to fetch categories' });
  }
});

// CREATE category
router.post('/', async (req: Request, res: Response) => {
  const { name, icon = 'Tag', color = '#3B82F6', subcategories } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Category name is required' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    const catRes = await client.query(
      `INSERT INTO categories (name, icon, color, is_default)
       VALUES ($1, $2, $3, false)
       RETURNING *`,
      [name.trim(), icon, color]
    );
    const newCat = catRes.rows[0];

    const insertedSubs = [];
    if (Array.isArray(subcategories)) {
      for (const sub of subcategories) {
        const subName = typeof sub === 'string' ? sub.trim() : (sub.name ? sub.name.trim() : '');
        if (subName) {
          const subRes = await client.query(
            `INSERT INTO subcategories (category_id, name)
             VALUES ($1, $2)
             ON CONFLICT (category_id, name) DO NOTHING
             RETURNING id, name`,
            [newCat.id, subName]
          );
          if (subRes.rows.length > 0) {
            insertedSubs.push(subRes.rows[0]);
          }
        }
      }
    }

    await client.query('COMMIT');
    newCat.subcategories = insertedSubs;
    res.status(201).json(newCat);
  } catch (error: any) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    console.error('Error creating category:', error);
    res.status(500).json({ error: 'Failed to create category' });
  } finally {
    client.release();
  }
});

// UPDATE category
router.put('/:id', async (req: Request, res: Response) => {
  const catId = parseInt(req.params.id, 10);
  const { name, icon, color } = req.body;

  if (isNaN(catId) || !name || !name.trim()) {
    return res.status(400).json({ error: 'Valid category ID and name are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE categories
       SET name = $1, icon = COALESCE($2, icon), color = COALESCE($3, color)
       WHERE id = $4
       RETURNING *`,
      [name.trim(), icon, color, catId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Category with this name already exists' });
    }
    console.error('Error updating category:', error);
    res.status(500).json({ error: 'Failed to update category' });
  }
});

// DELETE category
router.delete('/:id', async (req: Request, res: Response) => {
  const catId = parseInt(req.params.id, 10);
  if (isNaN(catId)) {
    return res.status(400).json({ error: 'Invalid category ID' });
  }

  try {
    // Check if category is used in expenses
    const countCheck = await pool.query(
      'SELECT COUNT(*) FROM expenses WHERE category_id = $1',
      [catId]
    );
    const count = parseInt(countCheck.rows[0].count, 10);
    if (count > 0) {
      return res.status(400).json({
        error: `Cannot delete this category because it is used in ${count} expense(s). Please reassign them first.`,
      });
    }

    const result = await pool.query('DELETE FROM categories WHERE id = $1 RETURNING id', [catId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }
    res.json({ message: 'Category deleted successfully', id: catId });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ error: 'Failed to delete category' });
  }
});

// ADD subcategory
router.post('/:id/subcategories', async (req: Request, res: Response) => {
  const catId = parseInt(req.params.id, 10);
  const { name } = req.body;

  if (isNaN(catId) || !name || !name.trim()) {
    return res.status(400).json({ error: 'Valid category ID and subcategory name are required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO subcategories (category_id, name)
       VALUES ($1, $2)
       RETURNING id, category_id, name`,
      [catId, name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Subcategory already exists in this category' });
    }
    console.error('Error creating subcategory:', error);
    res.status(500).json({ error: 'Failed to create subcategory' });
  }
});

// DELETE subcategory
router.delete('/:id/subcategories/:subId', async (req: Request, res: Response) => {
  const subId = parseInt(req.params.subId, 10);
  if (isNaN(subId)) {
    return res.status(400).json({ error: 'Invalid subcategory ID' });
  }

  try {
    const result = await pool.query(
      'DELETE FROM subcategories WHERE id = $1 RETURNING id',
      [subId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Subcategory not found' });
    }
    res.json({ message: 'Subcategory deleted successfully', id: subId });
  } catch (error) {
    console.error('Error deleting subcategory:', error);
    res.status(500).json({ error: 'Failed to delete subcategory' });
  }
});

export default router;
