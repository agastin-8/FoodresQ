import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import pool from '../db.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

/** Format a database user row to camelCase API response */
function formatUser(row) {
  return {
    id: row.id,
    name: row.name,
    email: row.email,
    role: row.role,
    phone: row.phone,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    coverageArea: row.coverage_area,
    capacity: row.capacity,
    currentLoad: row.current_load,
    status: row.status,
    createdAt: row.created_at,
  };
}

/** Generate a signed JWT token */
function signToken(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role, name: user.name },
    process.env.JWT_SECRET,
    { expiresIn: '7d' }
  );
}

// ─── POST /api/auth/register ────────────────────────────────────────
router.post('/register', async (req, res) => {
  try {
    const { name, email, password, role, phone, location, lat, lng, coverageArea, capacity } = req.body;

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({ error: 'Name, email, and password are required.' });
    }
    if (password.length < 6) {
      return res.status(400).json({ error: 'Password must be at least 6 characters.' });
    }

    const validRoles = ['donor', 'ngo', 'volunteer', 'admin'];
    const userRole = validRoles.includes(role) ? role : 'donor';

    // Check duplicate email
    const exists = await pool.query('SELECT id FROM users WHERE email = $1', [email]);
    if (exists.rows.length > 0) {
      return res.status(409).json({ error: 'Email already registered.' });
    }

    const passwordHash = await bcrypt.hash(password, 12);

    const result = await pool.query(
      `INSERT INTO users (name, email, password_hash, role, phone, location, lat, lng, coverage_area, capacity)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING *`,
      [name, email, passwordHash, userRole, phone || null, location || null,
       lat || null, lng || null, coverageArea || null, capacity || null]
    );

    const user = result.rows[0];
    const token = signToken(user);

    res.status(201).json({ user: formatUser(user), token });
  } catch (err) {
    console.error('Registration error:', err);
    res.status(500).json({ error: 'Registration failed.' });
  }
});

// ─── POST /api/auth/login ───────────────────────────────────────────
router.post('/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;

    if (!email || !password) {
      return res.status(400).json({ error: 'Email and password are required.' });
    }

    // If role is provided (demo quick login), include it in the query
    let query = 'SELECT * FROM users WHERE email = $1';
    const params = [email];
    if (role) {
      query += ' AND role = $2';
      params.push(role);
    }

    const result = await pool.query(query, params);
    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const user = result.rows[0];
    const valid = await bcrypt.compare(password, user.password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password.' });
    }

    const token = signToken(user);
    res.json({ user: formatUser(user), token });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed.' });
  }
});

// ─── GET /api/auth/me ───────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found.' });
    }
    res.json({ user: formatUser(result.rows[0]) });
  } catch (err) {
    console.error('Get profile error:', err);
    res.status(500).json({ error: 'Failed to retrieve profile.' });
  }
});

export default router;
