
CREATE POLICY "Service role can delete premium status"
ON public.premium_users
FOR DELETE
TO service_role
USING (true);

CREATE POLICY "Service role can update premium status"
ON public.premium_users
FOR UPDATE
TO service_role
USING (true)
WITH CHECK (true);
