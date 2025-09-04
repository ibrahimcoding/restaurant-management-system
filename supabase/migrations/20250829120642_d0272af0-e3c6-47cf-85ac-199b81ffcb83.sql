-- Create restaurants table
CREATE TABLE public.restaurants (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  phone TEXT,
  email TEXT,
  address TEXT,
  city TEXT,
  state TEXT,
  zip_code TEXT,
  logo_url TEXT,
  website TEXT,
  cuisine_type TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create restaurant staff table for multiple users per restaurant
CREATE TABLE public.restaurant_staff (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role TEXT NOT NULL CHECK (role IN ('owner', 'manager', 'staff', 'kitchen')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, user_id)
);

-- Create menu items table (restaurant-specific)
CREATE TABLE public.menu_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  image_url TEXT,
  category TEXT NOT NULL,
  is_available BOOLEAN NOT NULL DEFAULT true,
  prep_time INTEGER NOT NULL DEFAULT 15,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create tables table (restaurant-specific)
CREATE TABLE public.restaurant_tables (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_number INTEGER NOT NULL,
  capacity INTEGER NOT NULL,
  is_occupied BOOLEAN NOT NULL DEFAULT false,
  qr_code TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(restaurant_id, table_number)
);

-- Create orders table (restaurant-specific)
CREATE TABLE public.orders (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  restaurant_id UUID NOT NULL REFERENCES public.restaurants(id) ON DELETE CASCADE,
  table_id UUID REFERENCES public.restaurant_tables(id),
  table_number INTEGER,
  customer_name TEXT,
  status TEXT NOT NULL CHECK (status IN ('pending', 'cooking', 'ready', 'delivered', 'cancelled')) DEFAULT 'pending',
  total_amount DECIMAL(10,2) NOT NULL,
  estimated_time INTEGER,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create order items table
CREATE TABLE public.order_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  menu_item_id UUID NOT NULL REFERENCES public.menu_items(id) ON DELETE CASCADE,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  special_instructions TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.menu_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restaurant_tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;

-- Create RLS policies for restaurants
CREATE POLICY "Restaurant owners can manage their restaurant" 
ON public.restaurants 
FOR ALL 
USING (owner_id = auth.uid());

CREATE POLICY "Restaurant staff can view their restaurant" 
ON public.restaurants 
FOR SELECT 
USING (id IN (SELECT restaurant_id FROM public.restaurant_staff WHERE user_id = auth.uid()));

-- Create RLS policies for restaurant staff
CREATE POLICY "Restaurant owners can manage staff" 
ON public.restaurant_staff 
FOR ALL 
USING (restaurant_id IN (SELECT id FROM public.restaurants WHERE owner_id = auth.uid()));

CREATE POLICY "Staff can view their own record" 
ON public.restaurant_staff 
FOR SELECT 
USING (user_id = auth.uid());

-- Create RLS policies for menu items
CREATE POLICY "Restaurant staff can manage menu items" 
ON public.menu_items 
FOR ALL 
USING (restaurant_id IN (SELECT restaurant_id FROM public.restaurant_staff WHERE user_id = auth.uid()));

CREATE POLICY "Public can view available menu items" 
ON public.menu_items 
FOR SELECT 
USING (is_available = true);

-- Create RLS policies for tables
CREATE POLICY "Restaurant staff can manage tables" 
ON public.restaurant_tables 
FOR ALL 
USING (restaurant_id IN (SELECT restaurant_id FROM public.restaurant_staff WHERE user_id = auth.uid()));

CREATE POLICY "Public can view tables for ordering" 
ON public.restaurant_tables 
FOR SELECT 
USING (true);

-- Create RLS policies for orders
CREATE POLICY "Restaurant staff can manage orders" 
ON public.orders 
FOR ALL 
USING (restaurant_id IN (SELECT restaurant_id FROM public.restaurant_staff WHERE user_id = auth.uid()));

CREATE POLICY "Public can create orders" 
ON public.orders 
FOR INSERT 
WITH CHECK (true);

-- Create RLS policies for order items
CREATE POLICY "Restaurant staff can view order items" 
ON public.order_items 
FOR SELECT 
USING (order_id IN (SELECT id FROM public.orders WHERE restaurant_id IN (SELECT restaurant_id FROM public.restaurant_staff WHERE user_id = auth.uid())));

CREATE POLICY "Public can create order items" 
ON public.order_items 
FOR INSERT 
WITH CHECK (true);

-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for automatic timestamp updates
CREATE TRIGGER update_restaurants_updated_at
  BEFORE UPDATE ON public.restaurants
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_menu_items_updated_at
  BEFORE UPDATE ON public.menu_items
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restaurant_tables_updated_at
  BEFORE UPDATE ON public.restaurant_tables
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_orders_updated_at
  BEFORE UPDATE ON public.orders
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- Create storage bucket for restaurant logos
INSERT INTO storage.buckets (id, name, public) VALUES ('restaurant-logos', 'restaurant-logos', true);

-- Create storage policies for restaurant logos
CREATE POLICY "Restaurant logos are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'restaurant-logos');

CREATE POLICY "Authenticated users can upload restaurant logos" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'restaurant-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can update their restaurant logos" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'restaurant-logos' AND auth.uid() IS NOT NULL);

CREATE POLICY "Users can delete their restaurant logos" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'restaurant-logos' AND auth.uid() IS NOT NULL);