
-- Subscriptions table
CREATE TABLE public.subscriptions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT '€',
  category text NOT NULL DEFAULT 'Other',
  billing_cycle text NOT NULL DEFAULT 'Monthly',
  billing_date integer NOT NULL DEFAULT 1,
  color text NOT NULL DEFAULT 'hsl(215 12% 50%)',
  icon text NOT NULL DEFAULT '📦',
  reminder_days integer NOT NULL DEFAULT 1,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own subscriptions" ON public.subscriptions
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Savings goals table
CREATE TABLE public.savings_goals (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid NOT NULL,
  name text NOT NULL,
  total_amount numeric NOT NULL,
  target_date date NOT NULL,
  interval text NOT NULL DEFAULT 'weekly',
  paid_periods integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone DEFAULT now()
);

ALTER TABLE public.savings_goals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own savings goals" ON public.savings_goals
  FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
