import bcrypt from 'bcryptjs';
import pool from './db.js';

async function seedDatabase() {
  console.log('🌱 Seeding database with initial data...');
  try {
    const passwordHash = await bcrypt.hash('password123', 10);

    // 1. Clean existing data
    await pool.query(`
      TRUNCATE notifications, donation_status_history, volunteer_location_logs,
               pickup_locations, collection_trips, donations, food_listings, users
      CASCADE
    `);

    // 2. Insert Users
    const usersResult = await pool.query(`
      INSERT INTO users (id, name, email, password_hash, role, phone, location, lat, lng, coverage_area, capacity, current_load, status)
      VALUES
        (1, 'Green Kitchen Restaurant', 'donor@foodlink.demo', $1, 'donor', '+91 98765 43210', 'Koramangala, Bangalore', 12.9352, 77.6245, NULL, NULL, 0, 'active'),
        (2, 'FeedIndia Foundation', 'ngo@foodlink.demo', $1, 'ngo', '+91 98765 43211', 'Indiranagar, Bangalore', 12.9784, 77.6408, '10 km radius', 200, 45, 'active'),
        (3, 'FoodLink Admin', 'admin@foodlink.demo', $1, 'admin', '+91 98765 43212', 'Bangalore HQ', 12.9716, 77.5946, NULL, NULL, 0, 'active'),
        (4, 'Ramesh Kumar (Volunteer)', 'volunteer@foodlink.demo', $1, 'volunteer', '+91 98765 43213', 'Koramangala, Bangalore', 12.9350, 77.6250, '15 km radius', 100, 20, 'active'),
        (5, 'Taj Hotel Banquets', 'taj@foodlink.demo', $1, 'donor', '+91 98765 43214', 'MG Road, Bangalore', 12.9756, 77.6066, NULL, NULL, 0, 'active'),
        (6, "Baker's Dozen", 'bakers@foodlink.demo', $1, 'donor', '+91 98765 43215', 'HSR Layout, Bangalore', 12.9116, 77.6389, NULL, NULL, 0, 'active'),
        (7, 'Annapoorna Trust', 'annapoorna@foodlink.demo', $1, 'ngo', '+91 98765 43216', 'Jayanagar, Bangalore', 12.9250, 77.5838, '8 km radius', 150, 30, 'active'),
        (8, 'Hope Shelter Bangalore', 'hope@foodlink.demo', $1, 'ngo', '+91 98765 43217', 'Koramangala, Bangalore', 12.9310, 77.6180, '5 km radius', 100, 15, 'active')
      ON CONFLICT (id) DO NOTHING
      RETURNING id, name, role;
    `, [passwordHash]);

    // Reset sequence for users table
    await pool.query(`SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`);

    console.log(`✅ Seeded ${usersResult.rowCount} users`);

    // 3. Insert Food Listings
    const listingsResult = await pool.query(`
      INSERT INTO food_listings (id, donor_id, food_name, description, quantity, unit, category, preparation_time, pickup_deadline, location, lat, lng, status, food_safety, image, pickup_instructions)
      VALUES
        (1, 1, 'Vegetable Biryani', 'Freshly prepared vegetable biryani with raita. Suitable for vegetarians.', 25, 'meals', 'Main Course', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '4 hours', 'Koramangala, Bangalore', 12.9352, 77.6245, 'AVAILABLE', 'Stored at proper temperature. Vegetarian. No nuts.', '🍛', 'Pick up from back kitchen door.'),
        (2, 1, 'Dal Tadka with Rice', 'Yellow dal with tempering served with steamed basmati rice.', 30, 'meals', 'Main Course', NOW() - INTERVAL '3 hours', NOW() + INTERVAL '3 hours', 'Koramangala, Bangalore', 12.9352, 77.6245, 'AVAILABLE', 'Vegan-friendly. Gluten-free. No allergens.', '🍲', 'Ask for Chef Sharma at kitchen dispatch.'),
        (3, 5, 'Assorted Sandwiches', 'Mix of veg and paneer sandwiches from a cancelled corporate event.', 50, 'pieces', 'Snacks', NOW() - INTERVAL '1 hour', NOW() + INTERVAL '5 hours', 'MG Road, Bangalore', 12.9756, 77.6066, 'ON_THE_WAY', 'Contains dairy. Keep refrigerated.', '🥪', 'Reception desk at banquet hall.'),
        (4, 6, 'Fresh Bread Loaves', 'Day-end surplus whole wheat and multigrain bread loaves.', 40, 'loaves', 'Bakery', NOW() - INTERVAL '4 hours', NOW() + INTERVAL '12 hours', 'HSR Layout, Bangalore', 12.9116, 77.6389, 'AVAILABLE', 'Contains gluten. Vegan. Nut-free.', '🍞', 'Side bakery counter.'),
        (5, 5, 'Paneer Butter Masala & Roti', 'Surplus from dinner banquet. 35 fresh meals packed in food-grade trays.', 35, 'meals', 'Main Course', NOW() - INTERVAL '2 hours', NOW() + INTERVAL '6 hours', 'MG Road, Bangalore', 12.9756, 77.6066, 'AVAILABLE', 'Vegetarian. Contains dairy.', '🍱', 'Loading dock B.')
      ON CONFLICT (id) DO NOTHING
      RETURNING id, food_name;
    `);

    await pool.query(`SELECT setval('food_listings_id_seq', (SELECT MAX(id) FROM food_listings));`);
    console.log(`✅ Seeded ${listingsResult.rowCount} food listings`);

    // 4. Insert Donations with rich tracking state
    const donationsResult = await pool.query(`
      INSERT INTO donations (
        id, listing_id, food_name, description, quantity, unit, category, image,
        donor_id, donor_name, donor_location, donor_lat, donor_lng, donor_phone, pickup_instructions, food_safety,
        ngo_id, ngo_name, ngo_location, ngo_lat, ngo_lng, ngo_phone,
        destination_name, destination_address, destination_lat, destination_lng,
        status, scheduled_pickup_time, requested_at,
        volunteer_id, volunteer_name, volunteer_phone, volunteer_vehicle, volunteer_avatar,
        volunteer_live_sharing, volunteer_current_lat, volunteer_current_lng, volunteer_last_updated
      )
      VALUES
        (
          1, 3, 'Assorted Sandwiches', 'Mix of veg and paneer sandwiches from a cancelled corporate event.', 50, 'pieces', 'Snacks', '🥪',
          5, 'Taj Hotel Banquets', 'MG Road, Bangalore', 12.9756, 77.6066, '+91 98765 43214', 'Reception desk at banquet hall.', 'Contains dairy.',
          2, 'FeedIndia Foundation', 'Indiranagar, Bangalore', 12.9784, 77.6408, '+91 98765 43211',
          'FeedIndia Distribution Hub #1', '100 Feet Rd, Indiranagar, Bangalore', 12.9784, 77.6408,
          'ON_THE_WAY', NOW() + INTERVAL '30 minutes', NOW() - INTERVAL '1 hour',
          4, 'Ramesh Kumar', '+91 98765 43213', 'Honda Activa (KA-01-EQ-9876)', '🛵',
          TRUE, 12.9560, 77.6200, NOW()
        ),
        (
          2, 1, 'Vegetable Biryani', 'Freshly prepared vegetable biryani with raita. Suitable for vegetarians.', 25, 'meals', 'Main Course', '🍛',
          1, 'Green Kitchen Restaurant', 'Koramangala, Bangalore', 12.9352, 77.6245, '+91 98765 43210', 'Pick up from back kitchen door.', 'Stored at proper temperature.',
          2, 'FeedIndia Foundation', 'Indiranagar, Bangalore', 12.9784, 77.6408, '+91 98765 43211',
          'Hope Shelter Community Kitchen', 'Koramangala 4th Block, Bangalore', 12.9310, 77.6180,
          'PICKUP_SCHEDULED', NOW() + INTERVAL '1 hour', NOW() - INTERVAL '2 hours',
          4, 'Ramesh Kumar', '+91 98765 43213', 'Honda Activa (KA-01-EQ-9876)', '🛵',
          FALSE, 12.9350, 77.6250, NOW() - INTERVAL '10 minutes'
        )
      ON CONFLICT (id) DO NOTHING
      RETURNING id, food_name;
    `);

    await pool.query(`SELECT setval('donations_id_seq', (SELECT MAX(id) FROM donations));`);
    console.log(`✅ Seeded ${donationsResult.rowCount} donations`);

    // 5. Insert Status History
    await pool.query(`
      INSERT INTO donation_status_history (donation_id, status, updated_by_user_id, updated_by_name, note, lat, lng, location_name)
      VALUES
        (1, 'AVAILABLE', 5, 'Taj Hotel Banquets', 'Food surplus listed for redistribution', 12.9756, 77.6066, 'MG Road'),
        (1, 'ACCEPTED', 2, 'FeedIndia Foundation', 'Claimed by FeedIndia Foundation', 12.9784, 77.6408, 'Indiranagar'),
        (1, 'PICKUP_SCHEDULED', 2, 'FeedIndia Foundation', 'Pickup assigned to Volunteer Ramesh Kumar', 12.9784, 77.6408, 'Indiranagar'),
        (1, 'ON_THE_WAY', 4, 'Ramesh Kumar', 'Volunteer started route to pickup point', 12.9560, 77.6200, 'En Route'),
        (2, 'AVAILABLE', 1, 'Green Kitchen Restaurant', 'Fresh biryani listed for donation', 12.9352, 77.6245, 'Koramangala'),
        (2, 'ACCEPTED', 2, 'FeedIndia Foundation', 'Claimed for Community Kitchen', 12.9784, 77.6408, 'Indiranagar'),
        (2, 'PICKUP_SCHEDULED', 2, 'FeedIndia Foundation', 'Scheduled pickup window 2:00 PM - 3:30 PM', 12.9784, 77.6408, 'Indiranagar')
    `);

    // 6. Insert Collection Trips & Stops
    const tripResult = await pool.query(`
      INSERT INTO collection_trips (
        id, name, volunteer_id, ngo_id, status,
        receiving_centre_name, receiving_centre_address, receiving_centre_lat, receiving_centre_lng,
        expected_handover_time, delivery_confirmed
      )
      VALUES (
        1, 'Central Bangalore Food Recovery Circuit #4', 4, 2, 'in_progress',
        'FeedIndia Main Distribution Centre', 'Indiranagar 100ft Road, Bangalore', 12.9784, 77.6408,
        '4:30 PM', FALSE
      )
      ON CONFLICT (id) DO NOTHING
      RETURNING id, name;
    `);

    await pool.query(`SELECT setval('collection_trips_id_seq', (SELECT MAX(id) FROM collection_trips));`);

    await pool.query(`
      INSERT INTO pickup_locations (
        trip_id, name, type, food, quantity, unit, ready_time, location, lat, lng, status, image, sort_order
      )
      VALUES
        (1, 'Green Kitchen Restaurant', 'Restaurant', 'Vegetable Biryani', 25, 'meals', '12:30 PM', 'Koramangala 5th Block', 12.9352, 77.6245, 'Picked Up', '🍛', 1),
        (1, 'Taj Hotel Banquets', 'Hotel / Banquet', 'Assorted Sandwiches', 50, 'pieces', '1:15 PM', 'MG Road, Central', 12.9756, 77.6066, 'In Progress', '🥪', 2),
        (1, "Baker's Dozen", 'Bakery', 'Fresh Bread Loaves', 40, 'loaves', '2:00 PM', 'HSR Layout Sector 2', 12.9116, 77.6389, 'Pending', '🍞', 3),
        (1, 'Spice Garden Buffet', 'Restaurant', 'Rice & Dal Combo', 30, 'meals', '2:45 PM', 'Indiranagar 12th Main', 12.9710, 77.6350, 'Pending', '🍲', 4)
    `);

    // 7. Insert Initial GPS trail
    await pool.query(`
      INSERT INTO volunteer_location_logs (donation_id, trip_id, volunteer_id, lat, lng, accuracy_meters, heading, speed, is_live_sharing)
      VALUES
        (1, 1, 4, 12.9352, 77.6245, 8.5, 45.0, 15.2, TRUE),
        (1, 1, 4, 12.9420, 77.6220, 7.2, 50.0, 22.4, TRUE),
        (1, 1, 4, 12.9500, 77.6210, 6.0, 48.0, 28.0, TRUE),
        (1, 1, 4, 12.9560, 77.6200, 5.5, 52.0, 25.5, TRUE)
    `);

    // 8. Insert Notifications
    await pool.query(`
      INSERT INTO notifications (user_id, donation_id, title, message, type)
      VALUES
        (1, 2, 'Donation Claimed!', 'FeedIndia Foundation has accepted your Vegetable Biryani donation.', 'status_update'),
        (2, 1, 'Volunteer En Route', 'Volunteer Ramesh Kumar has started the pickup journey for Assorted Sandwiches.', 'status_update'),
        (4, 1, 'Trip Route Assigned', 'You have 4 pickup stops on Circuit #4 ending at FeedIndia Main Centre.', 'trip_assignment')
    `);

    console.log('🎉 Database seeding complete!');
  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedDatabase();
