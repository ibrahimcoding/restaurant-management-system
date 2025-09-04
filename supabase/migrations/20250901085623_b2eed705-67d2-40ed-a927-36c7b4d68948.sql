-- Fix security warnings by setting search_path for functions
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT restaurant_id 
  FROM public.restaurant_staff 
  WHERE restaurant_staff.user_id = $1 
    AND is_active = true
  LIMIT 1;
$$;

-- Also fix the existing update_updated_at_column function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;