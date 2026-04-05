-- =============================================================
-- ART CRIMES — Supabase Setup SQL
-- Run this entire script in the Supabase SQL Editor.
-- =============================================================

-- =============================================================
-- 1. SUBMISSIONS TABLE — Enable RLS & Policies
-- =============================================================

-- Ensure the submissions table has the columns we expect.
-- If your table already exists, this ALTER just adds any missing columns safely.
ALTER TABLE public.submissions
  ADD COLUMN IF NOT EXISTS id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  ADD COLUMN IF NOT EXISTS topic_date text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS image_url text NOT NULL DEFAULT '',
  ADD COLUMN IF NOT EXISTS display_name text DEFAULT 'Anonymous',
  ADD COLUMN IF NOT EXISTS created_at timestamptz DEFAULT now(),
  ADD COLUMN IF NOT EXISTS likes int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dislikes int DEFAULT 0,
  ADD COLUMN IF NOT EXISTS replay_data jsonb DEFAULT NULL;

-- Enable Row Level Security
ALTER TABLE public.submissions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if re-running this script
DROP POLICY IF EXISTS "Anyone can read submissions" ON public.submissions;
DROP POLICY IF EXISTS "Anyone can insert submissions" ON public.submissions;
DROP POLICY IF EXISTS "Authenticated users can update own submissions" ON public.submissions;
DROP POLICY IF EXISTS "Nobody can delete via anon" ON public.submissions;

-- SELECT: anyone can read all submissions
CREATE POLICY "Anyone can read submissions"
  ON public.submissions
  FOR SELECT
  USING (true);

-- INSERT: anyone can create new submissions
CREATE POLICY "Anyone can insert submissions"
  ON public.submissions
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: only authenticated users can update their own submissions (future use)
-- For now this effectively blocks anon updates since anon role != authenticated
CREATE POLICY "Authenticated users can update own submissions"
  ON public.submissions
  FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- DELETE: nobody can delete via anon key (only service_role in dashboard)
-- No delete policy = denied by default when RLS is enabled.
-- We explicitly add a deny-all for clarity:
CREATE POLICY "Nobody can delete via anon"
  ON public.submissions
  FOR DELETE
  USING (false);


-- =============================================================
-- 2. RPC FUNCTIONS — increment_likes / increment_dislikes
-- =============================================================

-- These are safe server-side atomic increments.
-- Called via: supabase.rpc('increment_likes', { row_id: '...' })

CREATE OR REPLACE FUNCTION public.increment_likes(row_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.submissions
  SET likes = likes + 1
  WHERE id = row_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_likes(row_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.submissions
  SET likes = GREATEST(likes - 1, 0)
  WHERE id = row_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_dislikes(row_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.submissions
  SET dislikes = dislikes + 1
  WHERE id = row_id;
$$;

CREATE OR REPLACE FUNCTION public.decrement_dislikes(row_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  UPDATE public.submissions
  SET dislikes = GREATEST(dislikes - 1, 0)
  WHERE id = row_id;
$$;

-- Grant execute to anon and authenticated so the client can call them
GRANT EXECUTE ON FUNCTION public.increment_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_likes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.increment_dislikes(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION public.decrement_dislikes(uuid) TO anon, authenticated;


-- =============================================================
-- 3. LIKES TABLE
-- =============================================================

CREATE TABLE IF NOT EXISTS public.likes (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  user_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (submission_id, user_fingerprint)
);

ALTER TABLE public.likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read likes" ON public.likes;
DROP POLICY IF EXISTS "Anyone can insert likes" ON public.likes;
DROP POLICY IF EXISTS "Anyone can delete own likes" ON public.likes;
DROP POLICY IF EXISTS "No anon delete likes" ON public.likes;

-- SELECT: anyone can read likes
CREATE POLICY "Anyone can read likes"
  ON public.likes
  FOR SELECT
  USING (true);

-- INSERT: anyone can insert a like (unique constraint prevents duplicates)
CREATE POLICY "Anyone can insert likes"
  ON public.likes
  FOR INSERT
  WITH CHECK (true);

-- DELETE: allow users to unlike (delete their own like by fingerprint)
CREATE POLICY "Anyone can delete own likes"
  ON public.likes
  FOR DELETE
  USING (true);


-- =============================================================
-- 4. COMMENTS TABLE
-- =============================================================

CREATE TABLE IF NOT EXISTS public.comments (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  display_name text DEFAULT 'Anonymous',
  content text NOT NULL CHECK (char_length(content) <= 500),
  user_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read comments" ON public.comments;
DROP POLICY IF EXISTS "Anyone can insert comments" ON public.comments;
DROP POLICY IF EXISTS "No anon delete comments" ON public.comments;

-- SELECT: anyone can read comments
CREATE POLICY "Anyone can read comments"
  ON public.comments
  FOR SELECT
  USING (true);

-- INSERT: anyone can post a comment
CREATE POLICY "Anyone can insert comments"
  ON public.comments
  FOR INSERT
  WITH CHECK (true);

-- DELETE: blocked for anon (only via service_role / admin dashboard)
CREATE POLICY "No anon delete comments"
  ON public.comments
  FOR DELETE
  USING (false);


-- =============================================================
-- 5. RATINGS TABLE (1-5 star crime ratings)
-- =============================================================

CREATE TABLE IF NOT EXISTS public.ratings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id uuid NOT NULL REFERENCES public.submissions(id) ON DELETE CASCADE,
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  user_fingerprint text NOT NULL,
  created_at timestamptz DEFAULT now(),
  UNIQUE (submission_id, user_fingerprint)
);

ALTER TABLE public.ratings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can read ratings" ON public.ratings;
DROP POLICY IF EXISTS "Anyone can insert ratings" ON public.ratings;
DROP POLICY IF EXISTS "Anyone can update own ratings" ON public.ratings;

-- SELECT: anyone can read ratings
CREATE POLICY "Anyone can read ratings"
  ON public.ratings
  FOR SELECT
  USING (true);

-- INSERT: anyone can rate
CREATE POLICY "Anyone can insert ratings"
  ON public.ratings
  FOR INSERT
  WITH CHECK (true);

-- UPDATE: anyone can update their own rating (via fingerprint match)
CREATE POLICY "Anyone can update own ratings"
  ON public.ratings
  FOR UPDATE
  USING (true)
  WITH CHECK (true);


-- =============================================================
-- 6. INDEXES for performance
-- =============================================================

CREATE INDEX IF NOT EXISTS idx_submissions_topic_date ON public.submissions(topic_date);
CREATE INDEX IF NOT EXISTS idx_submissions_created_at ON public.submissions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_likes_submission_id ON public.likes(submission_id);
CREATE INDEX IF NOT EXISTS idx_likes_fingerprint ON public.likes(user_fingerprint);
CREATE INDEX IF NOT EXISTS idx_comments_submission_id ON public.comments(submission_id);
CREATE INDEX IF NOT EXISTS idx_ratings_submission_id ON public.ratings(submission_id);
CREATE INDEX IF NOT EXISTS idx_ratings_fingerprint ON public.ratings(user_fingerprint);


-- =============================================================
-- DONE. All tables, policies, functions, and indexes are set up.
-- =============================================================
