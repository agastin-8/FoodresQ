import { Router } from 'express';
import pool from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/trips ─────────────────────────────────────────────────
router.get('/', authenticate, async (req, res) => {
  try {
    const trips = await pool.query(
      'SELECT * FROM collection_trips ORDER BY created_at DESC'
    );

    const result = [];
    for (const trip of trips.rows) {
      const stops = await pool.query(
        'SELECT * FROM pickup_locations WHERE trip_id = $1 ORDER BY sort_order ASC',
        [trip.id]
      );
      result.push(formatTrip(trip, stops.rows));
    }

    res.json({ trips: result });
  } catch (err) {
    console.error('List trips error:', err);
    res.status(500).json({ error: 'Failed to fetch trips.' });
  }
});

// ─── GET /api/trips/:id ─────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const trip = await pool.query('SELECT * FROM collection_trips WHERE id = $1', [req.params.id]);
    if (trip.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const stops = await pool.query(
      'SELECT * FROM pickup_locations WHERE trip_id = $1 ORDER BY sort_order ASC',
      [req.params.id]
    );

    res.json({ trip: formatTrip(trip.rows[0], stops.rows) });
  } catch (err) {
    console.error('Get trip error:', err);
    res.status(500).json({ error: 'Failed to fetch trip.' });
  }
});

// ─── POST /api/trips ────────────────────────────────────────────────
router.post('/', authenticate, authorize('ngo', 'admin'), async (req, res) => {
  try {
    const { name, receivingCentreName, receivingCentreAddress, receivingCentreLat,
            receivingCentreLng, expectedHandoverTime, stops } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'Trip name is required.' });
    }

    const trip = await pool.query(
      `INSERT INTO collection_trips
        (name, ngo_id, receiving_centre_name, receiving_centre_address,
         receiving_centre_lat, receiving_centre_lng, expected_handover_time)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [name, req.user.id, receivingCentreName || null, receivingCentreAddress || null,
       receivingCentreLat || null, receivingCentreLng || null, expectedHandoverTime || null]
    );

    // Insert stops if provided
    const insertedStops = [];
    if (stops && Array.isArray(stops)) {
      for (let i = 0; i < stops.length; i++) {
        const s = stops[i];
        const stopResult = await pool.query(
          `INSERT INTO pickup_locations
            (trip_id, name, type, food, quantity, unit, ready_time, location, lat, lng, image, sort_order)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
           RETURNING *`,
          [trip.rows[0].id, s.name, s.type || null, s.food || null, s.quantity || null,
           s.unit || null, s.readyTime || null, s.location || null,
           s.lat || null, s.lng || null, s.image || '🍱', i]
        );
        insertedStops.push(stopResult.rows[0]);
      }
    }

    res.status(201).json({ trip: formatTrip(trip.rows[0], insertedStops) });
  } catch (err) {
    console.error('Create trip error:', err);
    res.status(500).json({ error: 'Failed to create trip.' });
  }
});

// ─── PUT /api/trips/:tripId/stops/:stopId/status ────────────────────
router.put('/:tripId/stops/:stopId/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['Pending', 'Arrived', 'Picked Up'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: `Status must be one of: ${validStatuses.join(', ')}` });
    }

    const result = await pool.query(
      `UPDATE pickup_locations SET status = $1, updated_at = NOW()
       WHERE id = $2 AND trip_id = $3
       RETURNING *`,
      [status, req.params.stopId, req.params.tripId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Stop not found.' });
    }

    res.json({ stop: formatStop(result.rows[0]) });
  } catch (err) {
    console.error('Update stop status error:', err);
    res.status(500).json({ error: 'Failed to update stop status.' });
  }
});

// ─── PUT /api/trips/:id/delivery ────────────────────────────────────
router.put('/:id/delivery', authenticate, async (req, res) => {
  try {
    const { confirmed } = req.body;
    const result = await pool.query(
      `UPDATE collection_trips SET delivery_confirmed = $1, status = $2, updated_at = NOW()
       WHERE id = $3 RETURNING *`,
      [confirmed !== false, confirmed !== false ? 'completed' : 'in_progress', req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Trip not found.' });
    }

    const stops = await pool.query(
      'SELECT * FROM pickup_locations WHERE trip_id = $1 ORDER BY sort_order ASC',
      [req.params.id]
    );

    res.json({ trip: formatTrip(result.rows[0], stops.rows) });
  } catch (err) {
    console.error('Update delivery error:', err);
    res.status(500).json({ error: 'Failed to update delivery status.' });
  }
});

function formatStop(row) {
  return {
    id: row.id,
    tripId: row.trip_id,
    name: row.name,
    type: row.type,
    food: row.food,
    quantity: row.quantity,
    unit: row.unit,
    readyTime: row.ready_time,
    location: row.location,
    lat: row.lat,
    lng: row.lng,
    status: row.status,
    image: row.image,
    sortOrder: row.sort_order,
  };
}

function formatTrip(row, stops = []) {
  return {
    id: row.id,
    name: row.name,
    volunteerId: row.volunteer_id,
    ngoId: row.ngo_id,
    status: row.status,
    receivingCentreName: row.receiving_centre_name,
    receivingCentreAddress: row.receiving_centre_address,
    receivingCentreLat: row.receiving_centre_lat,
    receivingCentreLng: row.receiving_centre_lng,
    expectedHandoverTime: row.expected_handover_time,
    deliveryConfirmed: row.delivery_confirmed,
    stops: stops.map(formatStop),
    createdAt: row.created_at,
  };
}

export default router;
