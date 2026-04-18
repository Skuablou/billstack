UPDATE public.monthly_tracker_settings SET onboarding_completed = false WHERE user_id = auth.uid();
-- Fallback: reset for all (dev) in case auth.uid() is null in migration context
UPDATE public.monthly_tracker_settings SET onboarding_completed = false;