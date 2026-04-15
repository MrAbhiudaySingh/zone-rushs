
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS roll_number TEXT,
  ADD COLUMN IF NOT EXISTS year TEXT,
  ADD COLUMN IF NOT EXISTS course TEXT,
  ADD COLUMN IF NOT EXISTS specialisation TEXT;

CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_roll_number ON public.profiles(roll_number) WHERE roll_number IS NOT NULL;
