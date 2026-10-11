import { Router } from 'express';
import pool from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/listings ──────────────────────────────────────────────
// Public (authenticated) — list all food listings, with optional status filter
router.get('/', authenticate, async (req, res) => {
  try {
    const { status, donor_id } = req.query;
    let query = `
      SELECT fl.*, u.name as donor_name, u.location as donor_location,
             u.lat as donor_lat, u.lng as donor_lng
      FROM food_listings fl
      JOIN users u ON fl.donor_id = u.id
      WHERE 1=1
    `;
    const params = [];

    if (status) {
      params.push(status);
      query += ` AND fl.status = $${params.length}`;
    }
    if (donor_id) {
      params.push(donor_id);
      query += ` AND fl.donor_id = $${params.length}`;
    }

    query += ' ORDER BY fl.created_at DESC';

    const result = await pool.query(query, params);
    res.json({ listings: result.rows.map(formatListing) });
  } catch (err) {
    console.error('List listings error:', err);
    res.status(500).json({ error: 'Failed to fetch listings.' });
  }
});

// ─── GET /api/listings/:id ──────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT fl.*, u.name as donor_name, u.location as donor_location,
              u.lat as donor_lat, u.lng as donor_lng
       FROM food_listings fl
       JOIN users u ON fl.donor_id = u.id
       WHERE fl.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    res.json({ listing: formatListing(result.rows[0]) });
  } catch (err) {
    console.error('Get listing error:', err);
    res.status(500).json({ error: 'Failed to fetch listing.' });
  }
});

// ─── POST /api/listings ─────────────────────────────────────────────
// Donors create new food listings
router.post('/', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const { foodName, description, quantity, unit, category, preparationTime,
            pickupDeadline, location, lat, lng, foodSafety, image, pickupInstructions } = req.body;

    if (!foodName || !quantity || !unit) {
      return res.status(400).json({ error: 'foodName, quantity, and unit are required.' });
    }
    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be positive.' });
    }

    const result = await pool.query(
      `INSERT INTO food_listings
        (donor_id, food_name, description, quantity, unit, category,
         preparation_time, pickup_deadline, location, lat, lng,
         food_safety, image, pickup_instructions)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14)
       RETURNING *`,
      [req.user.id, foodName, description || null, quantity, unit,
       category || null, preparationTime || null, pickupDeadline || null,
       location || null, lat || null, lng || null,
       foodSafety || null, image || '🍱', pickupInstructions || null]
    );

    res.status(201).json({ listing: formatListing(result.rows[0]) });
  } catch (err) {
    console.error('Create listing error:', err);
    res.status(500).json({ error: 'Failed to create listing.' });
  }
});

// ─── PUT /api/listings/:id ──────────────────────────────────────────
router.put('/:id', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    const { foodName, description, quantity, unit, category, pickupDeadline,
            location, lat, lng, foodSafety, image, pickupInstructions } = req.body;

    // Verify ownership (unless admin)
    if (req.user.role !== 'admin') {
      const check = await pool.query('SELECT donor_id FROM food_listings WHERE id = $1', [req.params.id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });
      if (check.rows[0].donor_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only edit your own listings.' });
      }
    }

    const result = await pool.query(
      `UPDATE food_listings SET
        food_name = COALESCE($1, food_name),
        description = COALESCE($2, description),
        quantity = COALESCE($3, quantity),
        unit = COALESCE($4, unit),
        category = COALESCE($5, category),
        pickup_deadline = COALESCE($6, pickup_deadline),
        location = COALESCE($7, location),
        lat = COALESCE($8, lat),
        lng = COALESCE($9, lng),
        food_safety = COALESCE($10, food_safety),
        image = COALESCE($11, image),
        pickup_instructions = COALESCE($12, pickup_instructions),
        updated_at = NOW()
       WHERE id = $13
       RETURNING *`,
      [foodName, description, quantity, unit, category, pickupDeadline,
       location, lat, lng, foodSafety, image, pickupInstructions, req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    res.json({ listing: formatListing(result.rows[0]) });
  } catch (err) {
    console.error('Update listing error:', err);
    res.status(500).json({ error: 'Failed to update listing.' });
  }
});

// ─── DELETE /api/listings/:id ───────────────────────────────────────
router.delete('/:id', authenticate, authorize('donor', 'admin'), async (req, res) => {
  try {
    if (req.user.role !== 'admin') {
      const check = await pool.query('SELECT donor_id FROM food_listings WHERE id = $1', [req.params.id]);
      if (check.rows.length === 0) return res.status(404).json({ error: 'Listing not found.' });
      if (check.rows[0].donor_id !== req.user.id) {
        return res.status(403).json({ error: 'You can only delete your own listings.' });
      }
    }

    await pool.query('DELETE FROM food_listings WHERE id = $1', [req.params.id]);
    res.json({ message: 'Listing deleted.' });
  } catch (err) {
    console.error('Delete listing error:', err);
    res.status(500).json({ error: 'Failed to delete listing.' });
  }
});

function formatListing(row) {
  return {
    id: row.id,
    donorId: row.donor_id,
    donorName: row.donor_name || null,
    donorLocation: row.donor_location || null,
    donorLat: row.donor_lat || null,
    donorLng: row.donor_lng || null,
    foodName: row.food_name,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category,
    preparationTime: row.preparation_time,
    pickupDeadline: row.pickup_deadline,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    foodSafety: row.food_safety,
    image: row.image,
    pickupInstructions: row.pickup_instructions,
    createdAt: row.created_at,
  };
}

export default router;
