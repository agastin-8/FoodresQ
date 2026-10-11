import { Router } from 'express';
import pool from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── POST /api/tracking/location ────────────────────────────────────
// Volunteer sends GPS coordinates (actual browser geolocation data)
router.post('/location', authenticate, authorize('ngo', 'volunteer', 'admin'), async (req, res) => {
  try {
    const { donationId, tripId, lat, lng, accuracy, heading, speed } = req.body;

    if (lat == null || lng == null) {
      return res.status(400).json({ error: 'lat and lng are required.' });
    }
    if (typeof lat !== 'number' || typeof lng !== 'number') {
      return res.status(400).json({ error: 'lat and lng must be numbers.' });
    }
    if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      return res.status(400).json({ error: 'Invalid coordinate range.' });
    }

    // Store GPS log
    const logResult = await pool.query(
      `INSERT INTO volunteer_location_logs
        (donation_id, trip_id, volunteer_id, lat, lng, accuracy_meters, heading, speed)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [donationId || null, tripId || null, req.user.id,
       lat, lng, accuracy || null, heading || null, speed || null]
    );

    // Also update the denormalized volunteer position on the donation
    if (donationId) {
      await pool.query(
        `UPDATE donations SET
          volunteer_current_lat = $1,
          volunteer_current_lng = $2,
          volunteer_live_sharing = TRUE,
          volunteer_last_updated = NOW(),
          updated_at = NOW()
         WHERE id = $3`,
        [lat, lng, donationId]
      );
    }

    res.json({
      message: 'Location saved.',
      location: {
        id: logResult.rows[0].id,
        lat, lng, accuracy,
        timestamp: logResult.rows[0].created_at,
      },
    });
  } catch (err) {
    console.error('Save location error:', err);
    res.status(500).json({ error: 'Failed to save location.' });
  }
});

// ─── POST /api/tracking/stop ────────────────────────────────────────
// Volunteer stops sharing location
router.post('/stop', authenticate, authorize('ngo', 'volunteer', 'admin'), async (req, res) => {
  try {
    const { donationId } = req.body;

    if (donationId) {
      await pool.query(
        `UPDATE donations SET
          volunteer_live_sharing = FALSE,
          updated_at = NOW()
         WHERE id = $1`,
        [donationId]
      );
    }

    res.json({ message: 'Location sharing stopped.' });
  } catch (err) {
    console.error('Stop tracking error:', err);
    res.status(500).json({ error: 'Failed to stop tracking.' });
  }
});

// ─── GET /api/tracking/location/:donationId ─────────────────────────
// Get latest volunteer location for a donation (authorized users only)
router.get('/location/:donationId', authenticate, async (req, res) => {
  try {
    const donationId = req.params.donationId;

    // Verify authorization: only related parties can see GPS data
    const donation = await pool.query('SELECT * FROM donations WHERE id = $1', [donationId]);
    if (donation.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    const d = donation.rows[0];
    if (req.user.role !== 'admin' &&
        d.donor_id !== req.user.id &&
        d.ngo_id !== req.user.id &&
        d.volunteer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view GPS data for this donation.' });
    }

    // Get latest location
    const result = await pool.query(
      `SELECT * FROM volunteer_location_logs
       WHERE donation_id = $1
       ORDER BY created_at DESC
       LIMIT 1`,
      [donationId]
    );

    if (result.rows.length === 0) {
      return res.json({
        location: null,
        volunteer: {
          lat: d.volunteer_current_lat,
          lng: d.volunteer_current_lng,
          liveSharing: d.volunteer_live_sharing,
          lastUpdated: d.volunteer_last_updated,
        },
      });
    }

    const loc = result.rows[0];
    res.json({
      location: {
        lat: loc.lat,
        lng: loc.lng,
        accuracy: loc.accuracy_meters,
        heading: loc.heading,
        speed: loc.speed,
        timestamp: loc.created_at,
        isLive: loc.is_live_sharing,
      },
      volunteer: {
        lat: d.volunteer_current_lat,
        lng: d.volunteer_current_lng,
        liveSharing: d.volunteer_live_sharing,
        lastUpdated: d.volunteer_last_updated,
      },
    });
  } catch (err) {
    console.error('Get location error:', err);
    res.status(500).json({ error: 'Failed to fetch location.' });
  }
});

// ─── GET /api/tracking/history/:donationId ──────────────────────────
// Get full GPS trail for a donation
router.get('/history/:donationId', authenticate, async (req, res) => {
  try {
    const donationId = req.params.donationId;

    // Authorization check
    const donation = await pool.query('SELECT * FROM donations WHERE id = $1', [donationId]);
    if (donation.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    const d = donation.rows[0];
    if (req.user.role !== 'admin' &&
        d.donor_id !== req.user.id &&
        d.ngo_id !== req.user.id &&
        d.volunteer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized.' });
    }

    const result = await pool.query(
      `SELECT lat, lng, accuracy_meters, heading, speed, created_at
       FROM volunteer_location_logs
       WHERE donation_id = $1
       ORDER BY created_at ASC`,
      [donationId]
    );

    res.json({
      trail: result.rows.map((r) => ({
        lat: r.lat,
        lng: r.lng,
        accuracy: r.accuracy_meters,
        heading: r.heading,
        speed: r.speed,
        timestamp: r.created_at,
      })),
    });
  } catch (err) {
    console.error('Get trail error:', err);
    res.status(500).json({ error: 'Failed to fetch location history.' });
  }
});

export default router;
