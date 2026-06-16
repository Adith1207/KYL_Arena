-- Database Migration: Add Tour Completed Column to Profiles
-- Date: 2026-06-16
-- Purpose: Track if the user has completed the dashboard onboarding tour.

ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS tour_completed BOOLEAN DEFAULT FALSE;
