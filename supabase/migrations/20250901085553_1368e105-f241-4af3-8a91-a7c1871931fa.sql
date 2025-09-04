-- Create security definer function to get user's restaurant ID without recursion
CREATE OR REPLACE FUNCTION public.get_user_restaurant_id(user_id uuid)
RETURNS uuid
LANGUAGE sql
SECURITY DEFINER
STABLE
AS $$
  SELECT restaurant_id 
  FROM public.restaurant_staff 
  WHERE restaurant_staff.user_id = $1 
    AND is_active = true
  LIMIT 1;
$$;

-- Drop existing problematic policies
DROP POLICY IF EXISTS "Restaurant staff can view their restaurant" ON public.restaurants;

-- Create new policy using the security definer function
CREATE POLICY "Restaurant staff can view their restaurant" 
ON public.restaurants 
FOR SELECT 
USING (
  owner_id = auth.uid() 
  OR id = public.get_user_restaurant_id(auth.uid())
);