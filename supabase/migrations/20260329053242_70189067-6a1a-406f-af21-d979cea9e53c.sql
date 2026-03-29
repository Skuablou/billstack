CREATE TABLE public.premium_users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.premium_users ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own premium status"
  ON public.premium_users FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own premium status"
  ON public.premium_users FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());
