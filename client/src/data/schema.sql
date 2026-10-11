-- ====================================================================
-- FoodLink AI: Live Food Donation Tracking System Schema & Migrations
-- PostgreSQL Migration SQL
-- ====================================================================

-- 1. Enum for 9-stage donation tracking lifecycle
DO $$ BEGIN
    CREATE TYPE donation_status_enum AS ENUM (
      'AVAILABLE',
      'ACCEPTED',
      'PICKUP_SCHEDULED',
      'ON_THE_WAY',
      'ARRIVED',
      'PICKED_UP',
      'DELIVERED',
      'COMPLETED',
      'CANCELLED'
    );
EXCEPTION
    WHEN duplicate_object THEN null;
END $$;

-- 2. Extend Food Listings / Donations Table
ALTER TABLE food_listings 
  ADD COLUMN IF NOT EXISTS status donation_status_enum DEFAULT 'AVAILABLE',
  ADD COLUMN IF NOT EXISTS scheduled_pickup_time TIMESTAMP WITH TIME ZONE,
  ADD COLUMN IF NOT EXISTS claimed_by_ngo_id INTEGER,
  ADD COLUMN IF NOT EXISTS volunteer_id INTEGER,
  ADD COLUMN IF NOT EXISTS cancel_reason TEXT,
  ADD COLUMN IF NOT EXISTS handover_confirmed_by_donor BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS handover_confirmed_by_ngo BOOLEAN DEFAULT FALSE;

-- 3. Donation Status Audit History Table
CREATE TABLE IF NOT EXISTS donation_status_history (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL,
  status donation_status_enum NOT NULL,
  updated_by_user_id INTEGER NOT NULL,
  updated_by_name VARCHAR(255) NOT NULL,
  note TEXT,
  lat DOUBLE PRECISION,
  lng DOUBLE PRECISION,
  location_name VARCHAR(255),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_status_history_donation ON donation_status_history(donation_id);

-- 4. Volunteer Location Logs (Opt-in live GPS tracking)
CREATE TABLE IF NOT EXISTS volunteer_location_logs (
  id SERIAL PRIMARY KEY,
  donation_id INTEGER NOT NULL,
  volunteer_id INTEGER NOT NULL,
  lat DOUBLE PRECISION NOT NULL,
  lng DOUBLE PRECISION NOT NULL,
  accuracy_meters DOUBLE PRECISION,
  is_live_sharing BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_volunteer_location_donation ON volunteer_location_logs(donation_id, created_at DESC);

-- 5. In-App Notifications Table
CREATE TABLE IF NOT EXISTS notifications (
  id SERIAL PRIMARY KEY,
  user_id INTEGER NOT NULL,
  donation_id INTEGER,
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  type VARCHAR(50) DEFAULT 'status_update',
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, is_read);
