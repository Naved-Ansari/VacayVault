import { Router, Request, Response } from 'express';
import pool from '../config/db';

const router = Router();

// GET all family members
router.get('/', async (req: Request, res: Response) => {
  try {
    const query = `
      SELECT 
        m.id,
        m.name,
        m.notes,
        m.avatar_color,
        m.created_at,
        COUNT(e.id) AS expense_count,
        COALESCE(SUM(e.amount_inr), 0) AS total_spent_inr
      FROM family_members m
      LEFT JOIN expenses e ON m.id = e.paid_by_member_id
      GROUP BY m.id
      ORDER BY m.id ASC;
    `;
    const { rows } = await pool.query(query);
    res.json(rows);
  } catch (error) {
    console.error('Error fetching family members:', error);
    res.status(500).json({ error: 'Failed to fetch family members' });
  }
});

// CREATE family member
router.post('/', async (req: Request, res: Response) => {
  const { name, notes = '', avatar_color = '#3B82F6' } = req.body;
  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Member name is required' });
  }

  try {
    const result = await pool.query(
      `INSERT INTO family_members (name, notes, avatar_color)
       VALUES ($1, $2, $3)
       RETURNING *`,
      [name.trim(), notes.trim(), avatar_color]
    );
    res.status(201).json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Family member already exists' });
    }
    console.error('Error creating member:', error);
    res.status(500).json({ error: 'Failed to create member' });
  }
});

// UPDATE family member
router.put('/:id', async (req: Request, res: Response) => {
  const memberId = parseInt(req.params.id, 10);
  const { name, notes, avatar_color } = req.body;

  if (isNaN(memberId) || !name || !name.trim()) {
    return res.status(400).json({ error: 'Valid member ID and name are required' });
  }

  try {
    const result = await pool.query(
      `UPDATE family_members
       SET name = $1, notes = COALESCE($2, notes), avatar_color = COALESCE($3, avatar_color)
       WHERE id = $4
       RETURNING *`,
      [name.trim(), notes, avatar_color, memberId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }

    res.json(result.rows[0]);
  } catch (error: any) {
    if (error.code === '23505') {
      return res.status(409).json({ error: 'Family member with this name already exists' });
    }
    console.error('Error updating member:', error);
    res.status(500).json({ error: 'Failed to update member' });
  }
});

// DELETE family member
router.delete('/:id', async (req: Request, res: Response) => {
  const memberId = parseInt(req.params.id, 10);
  if (isNaN(memberId)) {
    return res.status(400).json({ error: 'Invalid member ID' });
  }

  try {
    const result = await pool.query('DELETE FROM family_members WHERE id = $1 RETURNING id', [memberId]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Member not found' });
    }
    res.json({ message: 'Family member deleted successfully', id: memberId });
  } catch (error) {
    console.error('Error deleting member:', error);
    res.status(500).json({ error: 'Failed to delete member' });
  }
});

export default router;
