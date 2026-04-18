ALTER TABLE public.monthly_tracker_settings
ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN NOT NULL DEFAULT false;

UPDATE public.monthly_tracker_settings
SET onboarding_completed = true
WHERE salary > 0;