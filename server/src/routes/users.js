import { Router } from 'express';
import pool from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/users ─────────────────────────────────────────────────
// Admin-only: list all platform users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const { role } = req.query;
    let query = 'SELECT id, name, email, role, phone, location, lat, lng, coverage_area, capacity, current_load, status, created_at FROM users';
    const params = [];

    if (role) {
      params.push(role);
      query += ' WHERE role = $1';
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);

    res.json({
      users: result.rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        role: u.role,
        phone: u.phone,
        location: u.location,
        lat: u.lat,
        lng: u.lng,
        coverageArea: u.coverage_area,
        capacity: u.capacity,
        currentLoad: u.current_load,
        status: u.status,
        createdAt: u.created_at,
      })),
    });
  } catch (err) {
    console.error('List users error:', err);
    res.status(500).json({ error: 'Failed to fetch users.' });
  }
});

// ─── GET /api/users/ngos ────────────────────────────────────────────
// Authenticated: list NGOs (for smart matching)
router.get('/ngos', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, name, email, location, lat, lng, coverage_area, capacity, current_load
       FROM users WHERE role = 'ngo' ORDER BY name ASC`
    );

    res.json({
      ngos: result.rows.map((u) => ({
        id: u.id,
        name: u.name,
        email: u.email,
        location: u.location,
        lat: u.lat,
        lng: u.lng,
        coverageArea: u.coverage_area,
        capacity: u.capacity,
        currentLoad: u.current_load,
      })),
    });
  } catch (err) {
    console.error('List NGOs error:', err);
    res.status(500).json({ error: 'Failed to fetch NGOs.' });
  }
});

// ─── GET /api/users/notifications ───────────────────────────────────
router.get('/notifications', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT * FROM notifications WHERE user_id = $1 ORDER BY created_at DESC LIMIT 50`,
      [req.user.id]
    );

    res.json({
      notifications: result.rows.map((n) => ({
        id: n.id,
        donationId: n.donation_id,
        title: n.title,
        message: n.message,
        type: n.type,
        isRead: n.is_read,
        timestamp: n.created_at,
      })),
    });
  } catch (err) {
    console.error('List notifications error:', err);
    res.status(500).json({ error: 'Failed to fetch notifications.' });
  }
});

// ─── PUT /api/users/notifications/:id/read ──────────────────────────
router.put('/notifications/:id/read', authenticate, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    res.json({ message: 'Notification marked as read.' });
  } catch (err) {
    console.error('Mark read error:', err);
    res.status(500).json({ error: 'Failed to update notification.' });
  }
});

// ─── PUT /api/users/notifications/read-all ──────────────────────────
router.put('/notifications/read-all', authenticate, async (req, res) => {
  try {
    await pool.query(
      'UPDATE notifications SET is_read = TRUE WHERE user_id = $1',
      [req.user.id]
    );
    res.json({ message: 'All notifications marked as read.' });
  } catch (err) {
    console.error('Mark all read error:', err);
    res.status(500).json({ error: 'Failed to update notifications.' });
  }
});

export default router;
