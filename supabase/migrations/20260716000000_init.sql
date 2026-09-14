-- ============================================================
-- Page237 — Initial Schema Migration
-- ============================================================

-- Enable UUID generation
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================
-- 1. PROFILES
-- ============================================================
CREATE TABLE IF NOT EXISTS profiles (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id     UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name   TEXT NOT NULL,
  whatsapp_number TEXT NOT NULL UNIQUE,
  email       TEXT NOT NULL,
  role        TEXT NOT NULL DEFAULT 'buyer' CHECK (role IN ('buyer', 'seller')),
  is_admin    BOOLEAN NOT NULL DEFAULT FALSE,  -- manual flag, never exposed in public app
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Index for lookups by user_id (auth.uid())
CREATE INDEX IF NOT EXISTS idx_profiles_user_id ON profiles(user_id);

-- ============================================================
-- 2. SECTIONS
-- ============================================================
CREATE TABLE IF NOT EXISTS sections (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name          TEXT NOT NULL UNIQUE,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 3. CLASSES
-- ============================================================
CREATE TABLE IF NOT EXISTS classes (
  id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  section_id    UUID NOT NULL REFERENCES sections(id) ON DELETE CASCADE,
  name          TEXT NOT NULL,
  display_order INT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(section_id, name)
);

CREATE INDEX IF NOT EXISTS idx_classes_section_id ON classes(section_id);

-- ============================================================
-- 4. SUBJECTS
-- ============================================================
CREATE TABLE IF NOT EXISTS subjects (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name       TEXT NOT NULL UNIQUE,
  active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 5. LISTINGS
-- ============================================================
CREATE TABLE IF NOT EXISTS listings (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  seller_id   UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  title       TEXT NOT NULL,
  author      TEXT,
  description TEXT,
  price       DECIMAL(10, 2) NOT NULL CHECK (price >= 0),
  condition   TEXT NOT NULL CHECK (condition IN ('new', 'good', 'fair', 'worn')),
  section_id  UUID NOT NULL REFERENCES sections(id),
  class_id    UUID NOT NULL REFERENCES classes(id),
  subject_id  UUID NOT NULL REFERENCES subjects(id),
  image_urls  TEXT[] NOT NULL DEFAULT '{}',
  status      TEXT NOT NULL DEFAULT 'available' CHECK (status IN ('available', 'sold', 'removed')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_listings_seller_id ON listings(seller_id);
CREATE INDEX IF NOT EXISTS idx_listings_status ON listings(status);
CREATE INDEX IF NOT EXISTS idx_listings_section_class ON listings(section_id, class_id);
CREATE INDEX IF NOT EXISTS idx_listings_subject ON listings(subject_id);
CREATE INDEX IF NOT EXISTS idx_listings_created_at ON listings(created_at DESC);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS set_listings_updated_at ON listings;
CREATE TRIGGER set_listings_updated_at
  BEFORE UPDATE ON listings
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ============================================================
-- 6. REPORTS
-- ============================================================
CREATE TABLE IF NOT EXISTS reports (
  id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  listing_id  UUID NOT NULL REFERENCES listings(id) ON DELETE CASCADE,
  reporter_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  reason      TEXT NOT NULL,
  status      TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'resolved')),
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_reports_listing_id ON reports(listing_id);
CREATE INDEX IF NOT EXISTS idx_reports_status ON reports(status);

-- ============================================================
-- RLS POLICIES
-- ============================================================

-- Helper: check if current user is admin
CREATE OR REPLACE FUNCTION is_admin()
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND is_admin = TRUE
  );
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Helper: get current user's profile id
CREATE OR REPLACE FUNCTION get_profile_id()
RETURNS UUID AS $$
  SELECT id FROM profiles
  WHERE user_id = auth.uid()
  LIMIT 1;
$$ LANGUAGE sql SECURITY DEFINER STABLE;

-- Enable RLS on all tables
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE classes ENABLE ROW LEVEL SECURITY;
ALTER TABLE subjects ENABLE ROW LEVEL SECURITY;
ALTER TABLE listings ENABLE ROW LEVEL SECURITY;
ALTER TABLE reports ENABLE ROW LEVEL SECURITY;

-- 1. Profiles Policies
DROP POLICY IF EXISTS "profiles_select_public" ON profiles;
CREATE POLICY "profiles_select_public" ON profiles FOR SELECT USING (true);

DROP POLICY IF EXISTS "profiles_insert_own" ON profiles;
CREATE POLICY "profiles_insert_own" ON profiles FOR INSERT WITH CHECK (user_id = auth.uid());

DROP POLICY IF EXISTS "profiles_update_own" ON profiles;
CREATE POLICY "profiles_update_own" ON profiles FOR UPDATE USING (user_id = auth.uid())
  WITH CHECK (
    user_id = auth.uid()
    AND is_admin = (SELECT is_admin FROM profiles WHERE user_id = auth.uid())
  );

DROP POLICY IF EXISTS "profiles_update_admin" ON profiles;
CREATE POLICY "profiles_update_admin" ON profiles FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "profiles_delete_admin" ON profiles;
CREATE POLICY "profiles_delete_admin" ON profiles FOR DELETE USING (is_admin());

-- 2. Sections Policies
DROP POLICY IF EXISTS "sections_select_public" ON sections;
CREATE POLICY "sections_select_public" ON sections FOR SELECT USING (true);

DROP POLICY IF EXISTS "sections_insert_admin" ON sections;
CREATE POLICY "sections_insert_admin" ON sections FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "sections_update_admin" ON sections;
CREATE POLICY "sections_update_admin" ON sections FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "sections_delete_admin" ON sections;
CREATE POLICY "sections_delete_admin" ON sections FOR DELETE USING (is_admin());

-- 3. Classes Policies
DROP POLICY IF EXISTS "classes_select_public" ON classes;
CREATE POLICY "classes_select_public" ON classes FOR SELECT USING (true);

DROP POLICY IF EXISTS "classes_insert_admin" ON classes;
CREATE POLICY "classes_insert_admin" ON classes FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "classes_update_admin" ON classes;
CREATE POLICY "classes_update_admin" ON classes FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "classes_delete_admin" ON classes;
CREATE POLICY "classes_delete_admin" ON classes FOR DELETE USING (is_admin());

-- 4. Subjects Policies
DROP POLICY IF EXISTS "subjects_select_public" ON subjects;
CREATE POLICY "subjects_select_public" ON subjects FOR SELECT USING (true);

DROP POLICY IF EXISTS "subjects_insert_admin" ON subjects;
CREATE POLICY "subjects_insert_admin" ON subjects FOR INSERT WITH CHECK (is_admin());

DROP POLICY IF EXISTS "subjects_update_admin" ON subjects;
CREATE POLICY "subjects_update_admin" ON subjects FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "subjects_delete_admin" ON subjects;
CREATE POLICY "subjects_delete_admin" ON subjects FOR DELETE USING (is_admin());

-- 5. Listings Policies
DROP POLICY IF EXISTS "listings_select_available" ON listings;
CREATE POLICY "listings_select_available" ON listings FOR SELECT USING (status = 'available');

DROP POLICY IF EXISTS "listings_select_own" ON listings;
CREATE POLICY "listings_select_own" ON listings FOR SELECT USING (seller_id = get_profile_id());

DROP POLICY IF EXISTS "listings_select_admin" ON listings;
CREATE POLICY "listings_select_admin" ON listings FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "listings_insert_seller" ON listings;
CREATE POLICY "listings_insert_seller" ON listings FOR INSERT WITH CHECK (
  seller_id = get_profile_id()
  AND EXISTS (
    SELECT 1 FROM profiles
    WHERE user_id = auth.uid() AND role = 'seller'
  )
);

DROP POLICY IF EXISTS "listings_update_own" ON listings;
CREATE POLICY "listings_update_own" ON listings FOR UPDATE USING (seller_id = get_profile_id())
  WITH CHECK (seller_id = get_profile_id());

DROP POLICY IF EXISTS "listings_update_admin" ON listings;
CREATE POLICY "listings_update_admin" ON listings FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "listings_delete_own" ON listings;
CREATE POLICY "listings_delete_own" ON listings FOR DELETE USING (seller_id = get_profile_id());

DROP POLICY IF EXISTS "listings_delete_admin" ON listings;
CREATE POLICY "listings_delete_admin" ON listings FOR DELETE USING (is_admin());

-- 6. Reports Policies
DROP POLICY IF EXISTS "reports_insert_authenticated" ON reports;
CREATE POLICY "reports_insert_authenticated" ON reports FOR INSERT WITH CHECK (
  reporter_id = get_profile_id()
  AND auth.uid() IS NOT NULL
);

DROP POLICY IF EXISTS "reports_select_own" ON reports;
CREATE POLICY "reports_select_own" ON reports FOR SELECT USING (reporter_id = get_profile_id());

DROP POLICY IF EXISTS "reports_select_admin" ON reports;
CREATE POLICY "reports_select_admin" ON reports FOR SELECT USING (is_admin());

DROP POLICY IF EXISTS "reports_update_admin" ON reports;
CREATE POLICY "reports_update_admin" ON reports FOR UPDATE USING (is_admin());

DROP POLICY IF EXISTS "reports_delete_admin" ON reports;
CREATE POLICY "reports_delete_admin" ON reports FOR DELETE USING (is_admin());

-- ============================================================
-- AUTH USER PROFILE SYNC TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.profiles (user_id, full_name, whatsapp_number, email, role, is_admin)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data->>'full_name', ''),
    COALESCE(new.raw_user_meta_data->>'whatsapp_number', ''),
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'buyer'),
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- SEED DATA
-- ============================================================

-- Anglophone Section
INSERT INTO sections (name, display_order) 
VALUES ('Anglophone', 1)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

WITH ang AS (SELECT id FROM sections WHERE name = 'Anglophone')
INSERT INTO classes (section_id, name, display_order)
SELECT ang.id, c.name, c.ord FROM ang,
(VALUES
  ('Nursery', 1),
  ('Class 1', 2), ('Class 2', 3), ('Class 3', 4),
  ('Class 4', 5), ('Class 5', 6), ('Class 6', 7),
  ('Form 1', 8), ('Form 2', 9), ('Form 3', 10),
  ('Form 4', 11), ('Form 5', 12),
  ('Lower Sixth', 13), ('Upper Sixth', 14)
) AS c(name, ord)
ON CONFLICT (section_id, name) DO UPDATE SET display_order = EXCLUDED.display_order;

-- Francophone Section
INSERT INTO sections (name, display_order) 
VALUES ('Francophone', 2)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

WITH fra AS (SELECT id FROM sections WHERE name = 'Francophone')
INSERT INTO classes (section_id, name, display_order)
SELECT fra.id, c.name, c.ord FROM fra,
(VALUES
  ('Maternelle', 1),
  ('SIL', 2),
  ('CP', 3), ('CE1', 4), ('CE2', 5),
  ('CM1', 6), ('CM2', 7),
  ('6ème', 8), ('5ème', 9), ('4ème', 10), ('3ème', 11),
  ('2nde', 12), ('1ère', 13), ('Terminale', 14)
) AS c(name, ord)
ON CONFLICT (section_id, name) DO UPDATE SET display_order = EXCLUDED.display_order;

-- Higher Ed / General Section
INSERT INTO sections (name, display_order) 
VALUES ('Higher Ed / General', 3)
ON CONFLICT (name) DO UPDATE SET display_order = EXCLUDED.display_order;

WITH hed AS (SELECT id FROM sections WHERE name = 'Higher Ed / General')
INSERT INTO classes (section_id, name, display_order)
SELECT hed.id, c.name, c.ord FROM hed,
(VALUES
  ('University', 1),
  ('Professional', 2),
  ('General Reading', 3)
) AS c(name, ord)
ON CONFLICT (section_id, name) DO UPDATE SET display_order = EXCLUDED.display_order;

-- Common Subjects (starter set)
INSERT INTO subjects (name) VALUES
  ('Mathematics'),
  ('English Language'),
  ('French Language'),
  ('Physics'),
  ('Chemistry'),
  ('Biology'),
  ('Computer Science'),
  ('Geography'),
  ('History'),
  ('Economics'),
  ('Philosophy'),
  ('Literature'),
  ('Accounting'),
  ('Commerce'),
  ('Religious Studies'),
  ('Citizenship'),
  ('General Knowledge'),
  ('Other')
ON CONFLICT (name) DO NOTHING;


-- ============================================================
-- Page237 — Grant base table privileges
-- (Required because "Automatically expose new tables" was
-- intentionally disabled at project creation. RLS policies only
-- restrict WHICH rows a role can touch — Postgres still requires
-- a base GRANT before RLS is ever evaluated. Without this, every
-- query fails with 42501 regardless of how correct your RLS
-- policies are.)
-- ============================================================

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- Sections / Classes / Subjects: public read (taxonomy is
-- browsable by anyone, including logged-out visitors)
GRANT SELECT ON public.sections TO anon, authenticated;
GRANT SELECT ON public.classes TO anon, authenticated;
GRANT SELECT ON public.subjects TO anon, authenticated;

-- Listings: public read (RLS narrows this to status = 'available'
-- for anon; sellers/admin see more via their own RLS policies)
GRANT SELECT ON public.listings TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.listings TO authenticated;

-- Profiles: public read (RLS policy profiles_select_public already
-- allows this); writes restricted to authenticated, further
-- narrowed by RLS to "own row" or admin
GRANT SELECT ON public.profiles TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.profiles TO authenticated;

-- Reports: authenticated users only, RLS narrows further
GRANT SELECT, INSERT ON public.reports TO authenticated;
GRANT UPDATE, DELETE ON public.reports TO authenticated;

-- Note: the admin dashboard, if it uses the service_role key
-- server-side, bypasses RLS and these grants entirely by design —
-- no additional grants needed for that path. These GRANTs are only
-- for the anon/authenticated roles used by the public-facing app.


-- ============================================================
-- Page237 — Storage policies for the listing-images bucket
-- Run in Supabase SQL Editor after creating the bucket in the
-- Storage tab (bucket must already exist, named 'listing-images').
-- ============================================================

-- Public read — anyone can view listing photos, logged in or not
DROP POLICY IF EXISTS "listing_images_select_public" ON storage.objects;
CREATE POLICY "listing_images_select_public"
ON storage.objects FOR SELECT
USING (bucket_id = 'listing-images');

-- Authenticated sellers can upload — restrict to their own folder
-- (recommended pattern: store as listing-images/{seller_id}/{filename}
-- so ownership is enforceable without a DB lookup)
DROP POLICY IF EXISTS "listing_images_insert_own" ON storage.objects;
CREATE POLICY "listing_images_insert_own"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Sellers can delete their own uploaded images
DROP POLICY IF EXISTS "listing_images_delete_own" ON storage.objects;
CREATE POLICY "listing_images_delete_own"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'listing-images'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Admin: full access via service_role key already bypasses RLS,
-- no additional policy needed for the admin app.

-- Making images public for every to see
DROP POLICY IF EXISTS "listing_images_select_public" ON storage.objects;

-- Setting my account as admin
UPDATE profiles
SET is_admin = TRUE
WHERE email = 'your-actual-signup-email@example.com';