-- ====================================================================
-- FoodLink AI — Complete Database Schema
-- PostgreSQL Initial Migration
-- ====================================================================

-- 1. Custom enum types
DO $$ BEGIN
    CREATE TYPE user_role AS ENUM ('donor', 'ngo', 'volunteer', 'admin');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
    CREATE TYPE donation_status_enum AS ENUM (
      'AVAILABLE', 'ACCEPTED', 'PICKUP_SCHEDULED', 'ON_THE_WAY',
      'ARRIVED', 'PICKED_UP', 'DELIVERED', 'COMPLETED', 'CANCELLED'
    );
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Users and roles
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role user_role NOT NULL DEFAULT 'donor',
  phone VARCHAR(50),
  location VARCHAR(255),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  coverage_area VARCHAR(50),
  capacity INTEGER,
  current_load INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- 3. Food listings (donations offered by donors)
CREATE TABLE IF NOT EXISTS food_listings (
  id SERIAL PRIMARY KEY,
  donor_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  food_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL CHECK (quantity > 0),
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  preparation_time TIMESTAMPTZ,
  pickup_deadline TIMESTAMPTZ,
  location VARCHAR(255),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status donation_status_enum DEFAULT 'AVAILABLE',
  food_safety TEXT,
  image VARCHAR(50) DEFAULT '🍱',
  pickup_instructions TEXT,
  scheduled_pickup_time TIMESTAMPTZ,
  claimed_by_ngo_id INTEGER REFERENCES users(id),
  volunteer_id INTEGER REFERENCES users(id),
  cancel_reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_donor ON food_listings(donor_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON food_listings(status);

-- 4. Donations (enriched tracking records linking donor, NGO, volunteer)
CREATE TABLE IF NOT EXISTS donations (
  id SERIAL PRIMARY KEY,
  listing_id INTEGER REFERENCES food_listings(id),
  food_name VARCHAR(255) NOT NULL,
  description TEXT,
  quantity INTEGER NOT NULL,
  unit VARCHAR(50) NOT NULL,
  category VARCHAR(100),
  image VARCHAR(50) DEFAULT '🍱',

  -- Donor info (denormalized for fast reads)
  donor_id INTEGER REFERENCES users(id),
  donor_name VARCHAR(255),
  donor_location VARCHAR(255),
  donor_lat DOUBLE PRECISION,
  donor_lng DOUBLE PRECISION,
  donor_phone VARCHAR(50),
  pickup_instructions TEXT,
  food_safety TEXT,

  -- NGO info
  ngo_id INTEGER REFERENCES users(id),
  ngo_name VARCHAR(255),
  ngo_location VARCHAR(255),
  ngo_lat DOUBLE PRECISION,
  ngo_lng DOUBLE PRECISION,
  ngo_phone VARCHAR(50),

  -- Destination (shelter / distribution site)
  destination_name VARCHAR(255),
  destination_address VARCHAR(255),
  destination_lat DOUBLE PRECISION,
  destination_lng DOUBLE PRECISION,

  -- Tracking status
  status donation_status_enum DEFAULT 'AVAILABLE',
  scheduled_pickup_time TIMESTAMPTZ,
  requested_at TIMESTAMPTZ DEFAULT NOW(),
  cancel_reason TEXT,

  -- Assigned volunteer (denormalized for fast reads)
  volunteer_id INTEGER REFERENCES users(id),
  volunteer_name VARCHAR(255),
  volunteer_phone VARCHAR(50),
  volunteer_vehicle VARCHAR(255),
  volunteer_avatar VARCHAR(50) DEFAULT '🛵',
  volunteer_live_sharing BOOLEAN DEFAULT FALSE,
  volunteer_current_lat DOUBLE PRECISION,
  volunteer_current_lng DOUBLE PRECISION,
  volunteer_last_updated TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_donations_status ON donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_ngo ON donations(ngo_id);
CREATE INDEX IF NOT EXISTS idx_donations_volunteer ON donations(volunteer_id);

-- 5. Collection trips (multi-stop pickup routes)
CREATE TABLE IF NOT EXISTS collection_trips (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255),
  volunteer_id INTEGER REFERENCES users(id),
  ngo_id INTEGER REFERENCES users(id),
  status VARCHAR(50) DEFAULT 'pending',
  receiving_centre_name VARCHAR(255),
  receiving_centre_address VARCHAR(255),
  receiving_centre_lat DOUBLE PRECISION,
  receiving_centre_lng DOUBLE PRECISION,
  expected_handover_time VARCHAR(50),
  delivery_confirmed BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. Pickup locations (stops within collection trips)
CREATE TABLE IF NOT EXISTS pickup_locations (
  id SERIAL PRIMARY KEY,
  trip_id INTEGER NOT NULL REFERENCES collection_trips(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(100),
  food VARCHAR(255),
  quantity INTEGER,
  unit VARCHAR(50),
  ready_time VARCHAR(50),
  location VARCHAR(255),
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  status VARCHAR(50) DEFAULT 'Pending',
  image VARCHAR(50),
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_pickup_locations_trip ON pickup_locations(trip_id, sort_order);

-- 7. GPS location updates (opt-in live tracking)
CREATE TABLE IF NOT EXISTS volunteer_location_logs (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER REFERENCES donations(id),
  trip_id INTEGER REFERENCES collection_trips(id),
  volunteer_id INTEGER NOT NULL REFERENCES users(id),
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  heading DOUBLE PRECISION,
  speed DOUBLE PRECISION,
  is_live_sharing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_vlogs_donation ON volunteer_location_logs(donation_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vlogs_volunteer ON volunteer_location_logs(volunteer_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_vlogs_trip ON volunteer_location_logs(trip_id, created_at DESC);

-- 8. Pickup and delivery status history (audit trail)
CREATE TABLE IF NOT EXISTS donation_status_history (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL REFERENCES donations(id) ON DELETE CASCADE,
  status donation_status_enum NOT NULL,
  updated_by_user_id INTEGER REFERENCES users(id),
  updated_by_name VARCHAR(255) NOT NULL,
  note TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location_name VARCHAR(255),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_status_history_donation ON donation_status_history(donation_id, created_at DESC);

-- 9. In-app notifications
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  donation_id INTEGER REFERENCES donations(id),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'status_update',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id, is_read, created_at DESC);
