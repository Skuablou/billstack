
-- Table for storing monthly tracker settings (salary, work schedule)
CREATE TABLE public.monthly_tracker_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  salary numeric NOT NULL DEFAULT 0,
  active_days boolean[] NOT NULL DEFAULT '{true,true,true,true,true,false,false}',
  hours numeric[] NOT NULL DEFAULT '{8,8,8,8,8,0,0}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.monthly_tracker_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tracker settings"
ON public.monthly_tracker_settings
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

-- Table for storing daily expenses
CREATE TABLE public.monthly_tracker_expenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  date date NOT NULL,
  amount numeric NOT NULL,
  created_at timestamptz DEFAULT now()
);

ALTER TABLE public.monthly_tracker_expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own tracker expenses"
ON public.monthly_tracker_expenses
FOR ALL
TO authenticated
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);
