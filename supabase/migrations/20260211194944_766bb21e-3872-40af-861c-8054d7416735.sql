
-- Add 'hostel' to room_type enum
ALTER TYPE public.room_type ADD VALUE IF NOT EXISTS 'hostel';

-- Add hostel-specific columns to properties table
ALTER TABLE public.properties
  ADD COLUMN IF NOT EXISTS beds_per_room INTEGER DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS gender_preference TEXT DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS meals_included BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS common_area BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS locker_available BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS curfew_time TEXT DEFAULT NULL;
