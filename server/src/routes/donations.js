import { Router } from 'express';
import pool from '../db.js';
import { authenticate, authorize } from '../middleware/auth.js';

const router = Router();

// ─── GET /api/donations ─────────────────────────────────────────────
// List donations visible to the current user
router.get('/', authenticate, async (req, res) => {
  try {
    const { status } = req.query;
    let query = 'SELECT * FROM donations WHERE 1=1';
    const params = [];

    // Role-based filtering: donors see their own, NGOs see theirs, admin sees all
    if (req.user.role === 'donor') {
      params.push(req.user.id);
      query += ` AND donor_id = $${params.length}`;
    } else if (req.user.role === 'ngo') {
      params.push(req.user.id);
      query += ` AND ngo_id = $${params.length}`;
    } else if (req.user.role === 'volunteer') {
      params.push(req.user.id);
      query += ` AND volunteer_id = $${params.length}`;
    }
    // admin sees all

    if (status) {
      params.push(status);
      query += ` AND status = $${params.length}`;
    }

    query += ' ORDER BY created_at DESC';
    const result = await pool.query(query, params);

    // Fetch history for each donation
    const donations = [];
    for (const row of result.rows) {
      const histResult = await pool.query(
        'SELECT * FROM donation_status_history WHERE donation_id = $1 ORDER BY created_at DESC',
        [row.id]
      );
      donations.push(formatDonation(row, histResult.rows));
    }

    res.json({ donations });
  } catch (err) {
    console.error('List donations error:', err);
    res.status(500).json({ error: 'Failed to fetch donations.' });
  }
});

// ─── GET /api/donations/:id ─────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM donations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    const donation = result.rows[0];

    // Authorization: only related parties + admin can view
    if (req.user.role !== 'admin' &&
        donation.donor_id !== req.user.id &&
        donation.ngo_id !== req.user.id &&
        donation.volunteer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized to view this donation.' });
    }

    const histResult = await pool.query(
      'SELECT * FROM donation_status_history WHERE donation_id = $1 ORDER BY created_at DESC',
      [donation.id]
    );

    res.json({ donation: formatDonation(donation, histResult.rows) });
  } catch (err) {
    console.error('Get donation error:', err);
    res.status(500).json({ error: 'Failed to fetch donation.' });
  }
});

// ─── POST /api/donations ────────────────────────────────────────────
// NGO claims a food listing, creating a donation tracking record
router.post('/', authenticate, authorize('ngo', 'admin'), async (req, res) => {
  try {
    const { listingId, destinationName, destinationAddress, destinationLat, destinationLng,
            volunteerName, volunteerPhone, volunteerVehicle, volunteerAvatar } = req.body;

    if (!listingId) {
      return res.status(400).json({ error: 'listingId is required.' });
    }

    // Get the listing
    const listingResult = await pool.query(
      `SELECT fl.*, u.name as donor_name, u.location as donor_location,
              u.lat as donor_lat, u.lng as donor_lng, u.phone as donor_phone
       FROM food_listings fl JOIN users u ON fl.donor_id = u.id
       WHERE fl.id = $1`,
      [listingId]
    );
    if (listingResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listing not found.' });
    }
    const listing = listingResult.rows[0];

    // Get NGO user info
    const ngoResult = await pool.query('SELECT * FROM users WHERE id = $1', [req.user.id]);
    const ngo = ngoResult.rows[0];

    const result = await pool.query(
      `INSERT INTO donations
        (listing_id, food_name, description, quantity, unit, category, image,
         donor_id, donor_name, donor_location, donor_lat, donor_lng, donor_phone,
         pickup_instructions, food_safety,
         ngo_id, ngo_name, ngo_location, ngo_lat, ngo_lng, ngo_phone,
         destination_name, destination_address, destination_lat, destination_lng,
         status, requested_at,
         volunteer_name, volunteer_phone, volunteer_vehicle, volunteer_avatar)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17,$18,$19,$20,$21,$22,$23,$24,$25,$26,$27,$28,$29,$30,$31)
       RETURNING *`,
      [
        listing.id, listing.food_name, listing.description, listing.quantity, listing.unit,
        listing.category, listing.image,
        listing.donor_id, listing.donor_name, listing.donor_location, listing.donor_lat, listing.donor_lng, listing.donor_phone,
        listing.pickup_instructions, listing.food_safety,
        req.user.id, ngo.name, ngo.location, ngo.lat, ngo.lng, ngo.phone,
        destinationName || 'Local Community Shelter', destinationAddress || ngo.location,
        destinationLat || ngo.lat, destinationLng || ngo.lng,
        'ACCEPTED', new Date().toISOString(),
        volunteerName || 'Assigned Volunteer', volunteerPhone || null,
        volunteerVehicle || 'Cargo Scooter', volunteerAvatar || '🛵',
      ]
    );

    const donation = result.rows[0];

    // Create initial status history entries
    await pool.query(
      `INSERT INTO donation_status_history (donation_id, status, updated_by_user_id, updated_by_name, note)
       VALUES ($1, 'AVAILABLE', $2, $3, 'Listed surplus food for donation.')`,
      [donation.id, listing.donor_id, listing.donor_name]
    );
    await pool.query(
      `INSERT INTO donation_status_history (donation_id, status, updated_by_user_id, updated_by_name, note)
       VALUES ($1, 'ACCEPTED', $2, $3, 'Claimed and accepted by NGO for distribution.')`,
      [donation.id, req.user.id, ngo.name]
    );

    // Update listing status
    await pool.query(
      `UPDATE food_listings SET status = 'ACCEPTED', claimed_by_ngo_id = $1, updated_at = NOW() WHERE id = $2`,
      [req.user.id, listing.id]
    );

    // Fetch full history
    const histResult = await pool.query(
      'SELECT * FROM donation_status_history WHERE donation_id = $1 ORDER BY created_at DESC',
      [donation.id]
    );

    res.status(201).json({ donation: formatDonation(donation, histResult.rows) });
  } catch (err) {
    console.error('Create donation error:', err);
    res.status(500).json({ error: 'Failed to create donation.' });
  }
});

// ─── PUT /api/donations/:id/status ──────────────────────────────────
// Update donation status (role-based, validated transitions)
router.put('/:id/status', authenticate, async (req, res) => {
  try {
    const { targetStatus, note, scheduledTime, cancelReason } = req.body;

    if (!targetStatus) {
      return res.status(400).json({ error: 'targetStatus is required.' });
    }

    const result = await pool.query('SELECT * FROM donations WHERE id = $1', [req.params.id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Donation not found.' });
    }

    const donation = result.rows[0];

    // Validate status transition
    const TRANSITIONS = {
      AVAILABLE: ['ACCEPTED', 'CANCELLED'],
      ACCEPTED: ['PICKUP_SCHEDULED', 'ON_THE_WAY', 'CANCELLED'],
      PICKUP_SCHEDULED: ['ON_THE_WAY', 'CANCELLED'],
      ON_THE_WAY: ['ARRIVED', 'CANCELLED'],
      ARRIVED: ['PICKED_UP', 'CANCELLED'],
      PICKED_UP: ['DELIVERED', 'CANCELLED'],
      DELIVERED: ['COMPLETED', 'CANCELLED'],
      COMPLETED: [],
      CANCELLED: [],
    };

    const allowed = TRANSITIONS[donation.status] || [];
    if (!allowed.includes(targetStatus)) {
      return res.status(400).json({
        error: `Cannot transition from ${donation.status} to ${targetStatus}.`,
      });
    }

    // Build update
    const updates = [`status = $1`, `updated_at = NOW()`];
    const params = [targetStatus];
    let paramIdx = 2;

    if (scheduledTime) {
      updates.push(`scheduled_pickup_time = $${paramIdx}`);
      params.push(scheduledTime);
      paramIdx++;
    }
    if (targetStatus === 'CANCELLED' && (cancelReason || note)) {
      updates.push(`cancel_reason = $${paramIdx}`);
      params.push(cancelReason || note);
      paramIdx++;
    }

    params.push(req.params.id);
    await pool.query(
      `UPDATE donations SET ${updates.join(', ')} WHERE id = $${paramIdx}`,
      params
    );

    // Insert status history
    const updatedByName = `${req.user.name} (${req.user.role.toUpperCase()})`;
    await pool.query(
      `INSERT INTO donation_status_history (donation_id, status, updated_by_user_id, updated_by_name, note)
       VALUES ($1, $2, $3, $4, $5)`,
      [req.params.id, targetStatus, req.user.id, updatedByName,
       note || cancelReason || `Status updated to ${targetStatus.replace(/_/g, ' ')}`]
    );

    // Create notification
    const notifTitles = {
      ACCEPTED: 'Donation Accepted 🤝', PICKUP_SCHEDULED: 'Pickup Scheduled 📅',
      ON_THE_WAY: 'Volunteer On The Way 🛵', ARRIVED: 'Volunteer Arrived 📍',
      PICKED_UP: 'Food Collected 🍱', DELIVERED: 'Food Handed Over 🚚',
      COMPLETED: 'Donation Completed 🎉', CANCELLED: 'Donation Cancelled ❌',
    };
    const notifTitle = notifTitles[targetStatus] || `Status: ${targetStatus}`;
    const notifMsg = `${donation.food_name} (${donation.quantity} ${donation.unit}) is now ${targetStatus.replace(/_/g, ' ')}.`;

    // Notify donor and NGO
    const notifyUsers = [donation.donor_id, donation.ngo_id].filter(Boolean);
    for (const uid of notifyUsers) {
      await pool.query(
        `INSERT INTO notifications (user_id, donation_id, title, message) VALUES ($1, $2, $3, $4)`,
        [uid, donation.id, notifTitle, notifMsg]
      );
    }

    // Return updated donation
    const updated = await pool.query('SELECT * FROM donations WHERE id = $1', [req.params.id]);
    const histResult = await pool.query(
      'SELECT * FROM donation_status_history WHERE donation_id = $1 ORDER BY created_at DESC',
      [req.params.id]
    );

    res.json({ donation: formatDonation(updated.rows[0], histResult.rows) });
  } catch (err) {
    console.error('Update status error:', err);
    res.status(500).json({ error: 'Failed to update status.' });
  }
});

function formatDonation(row, history = []) {
  return {
    id: row.id,
    listingId: row.listing_id,
    foodName: row.food_name,
    description: row.description,
    quantity: row.quantity,
    unit: row.unit,
    category: row.category,
    image: row.image,
    donorId: row.donor_id,
    donorName: row.donor_name,
    donorLocation: row.donor_location,
    donorLat: row.donor_lat,
    donorLng: row.donor_lng,
    donorPhone: row.donor_phone,
    pickupInstructions: row.pickup_instructions,
    foodSafety: row.food_safety,
    ngoId: row.ngo_id,
    ngoName: row.ngo_name,
    ngoLocation: row.ngo_location,
    ngoLat: row.ngo_lat,
    ngoLng: row.ngo_lng,
    ngoPhone: row.ngo_phone,
    destinationName: row.destination_name,
    destinationAddress: row.destination_address,
    destinationLat: row.destination_lat,
    destinationLng: row.destination_lng,
    status: row.status,
    scheduledPickupTime: row.scheduled_pickup_time,
    requestedAt: row.requested_at,
    cancelReason: row.cancel_reason,
    volunteer: {
      id: row.volunteer_id,
      name: row.volunteer_name,
      phone: row.volunteer_phone,
      vehicle: row.volunteer_vehicle,
      avatar: row.volunteer_avatar,
      liveSharing: row.volunteer_live_sharing,
      currentLat: row.volunteer_current_lat,
      currentLng: row.volunteer_current_lng,
      lastUpdated: row.volunteer_last_updated
        ? new Date(row.volunteer_last_updated).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })
        : 'Not yet',
    },
    history: history.map((h) => ({
      id: h.id,
      status: h.status,
      updatedByName: h.updated_by_name,
      timestamp: h.created_at,
      note: h.note,
      location: h.lat ? { lat: h.lat, lng: h.lng, name: h.location_name } : null,
    })),
  };
}

export default router;
