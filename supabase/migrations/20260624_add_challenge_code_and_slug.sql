-- Migration: Add challenge_code and slug to challenges
-- Date: 2026-06-24
-- Purpose: Support clean identifiers instead of raw UUIDs for challenges.

-- 1. Add columns to public.challenges
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS challenge_code TEXT;
ALTER TABLE public.challenges ADD COLUMN IF NOT EXISTS slug TEXT;

-- 2. Backfill existing challenges with unique slugs and codes
-- '11111111-1111-1111-1111-111111111111' -> KYL Summer Century
UPDATE public.challenges 
SET challenge_code = 'KYL-2026-001', slug = 'kyl-summer-century'
WHERE id = '11111111-1111-1111-1111-111111111111';

-- '22222222-2222-2222-2222-222222222222' -> June Run Challenge
UPDATE public.challenges 
SET challenge_code = 'KYL-2026-002', slug = 'june-run-challenge'
WHERE id = '22222222-2222-2222-2222-222222222222';

-- '33333333-3333-3333-3333-333333333333' -> July Elevation Climb
UPDATE public.challenges 
SET challenge_code = 'KYL-2026-003', slug = 'july-elevation-climb'
WHERE id = '33333333-3333-3333-3333-333333333333';

-- '44444444-4444-4444-4444-444444444444' -> May Walkathon
UPDATE public.challenges 
SET challenge_code = 'KYL-2026-004', slug = 'may-walkathon'
WHERE id = '44444444-4444-4444-4444-444444444444';

-- Ensure all other existing challenges get values if any exist
UPDATE public.challenges
SET challenge_code = 'KYL-' || to_char(start_date, 'YYYY') || '-' || substring(id::text from 1 for 4),
    slug = lower(regexp_replace(title, '[^a-zA-Z0-9\s-]', '', 'g'))
WHERE challenge_code IS NULL OR slug IS NULL;

-- 3. Make them UNIQUE and NOT NULL
ALTER TABLE public.challenges ALTER COLUMN challenge_code SET NOT NULL;
ALTER TABLE public.challenges ALTER COLUMN slug SET NOT NULL;

-- Drop constraints if they already exist to avoid errors, then recreate
ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_challenge_code_key;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_challenge_code_key UNIQUE (challenge_code);

ALTER TABLE public.challenges DROP CONSTRAINT IF EXISTS challenges_slug_key;
ALTER TABLE public.challenges ADD CONSTRAINT challenges_slug_key UNIQUE (slug);

-- 4. Create trigger to auto-generate code and slug on challenge creation
CREATE OR REPLACE FUNCTION public.generate_challenge_code_and_slug()
RETURNS TRIGGER AS $$
DECLARE
  year_str TEXT;
  next_num INT;
  base_slug TEXT;
  temp_slug TEXT;
  slug_counter INT := 1;
BEGIN
  -- Generate challenge_code if not provided
  IF NEW.challenge_code IS NULL OR NEW.challenge_code = '' THEN
    year_str := to_char(NEW.start_date, 'YYYY');
    
    SELECT COALESCE(MAX(SUBSTRING(challenge_code FROM 10 FOR 3)::INT), 0) + 1
    INTO next_num
    FROM public.challenges
    WHERE challenge_code LIKE 'KYL-' || year_str || '-%';
    
    NEW.challenge_code := 'KYL-' || year_str || '-' || lpad(next_num::text, 3, '0');
  END IF;

  -- Generate slug if not provided
  IF NEW.slug IS NULL OR NEW.slug = '' THEN
    base_slug := lower(regexp_replace(NEW.title, '[^a-zA-Z0-9\s-]', '', 'g'));
    base_slug := regexp_replace(base_slug, '[\s_-]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    
    temp_slug := base_slug;
    WHILE EXISTS (SELECT 1 FROM public.challenges WHERE slug = temp_slug) LOOP
      temp_slug := base_slug || '-' || slug_counter;
      slug_counter := slug_counter + 1;
    END LOOP;
    
    NEW.slug := temp_slug;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS tr_generate_challenge_code_and_slug ON public.challenges;
CREATE TRIGGER tr_generate_challenge_code_and_slug
  BEFORE INSERT ON public.challenges
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_challenge_code_and_slug();
