import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface Restaurant {
  id: string;
  name: string;
  description?: string;
  phone?: string;
  email?: string;
  address?: string;
  city?: string;
  state?: string;
  zip_code?: string;
  logo_url?: string;
  website?: string;
  cuisine_type?: string;
  is_active: boolean;
  owner_id: string;
}

interface RestaurantContextType {
  restaurant: Restaurant | null;
  loading: boolean;
  hasRestaurant: boolean;
  refreshRestaurant: () => Promise<void>;
}

const RestaurantContext = createContext<RestaurantContextType>({
  restaurant: null,
  loading: true,
  hasRestaurant: false,
  refreshRestaurant: async () => {},
});

export const useRestaurant = () => {
  const context = useContext(RestaurantContext);
  if (!context) {
    throw new Error('useRestaurant must be used within a RestaurantProvider');
  }
  return context;
};

export function RestaurantProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [restaurant, setRestaurant] = useState<Restaurant | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchRestaurant = async () => {
    if (!user) {
      setRestaurant(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // First try to get restaurant as owner
      const { data: ownedRestaurant, error: ownerError } = await supabase
        .from('restaurants')
        .select('*')
        .eq('owner_id', user.id)
        .maybeSingle();

      if (ownedRestaurant) {
        setRestaurant(ownedRestaurant);
        setLoading(false);
        return;
      }

      // If not owner, check if user is staff
      const { data: staffRecord, error: staffError } = await supabase
        .from('restaurant_staff')
        .select('restaurant_id, restaurants(*)')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffRecord?.restaurants) {
        setRestaurant(staffRecord.restaurants as Restaurant);
      } else {
        setRestaurant(null);
      }
    } catch (error) {
      console.error('Error fetching restaurant:', error);
      setRestaurant(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading) {
      fetchRestaurant();
    }
  }, [user, authLoading]);

  return (
    <RestaurantContext.Provider value={{
      restaurant,
      loading,
      hasRestaurant: !!restaurant,
      refreshRestaurant: fetchRestaurant,
    }}>
      {children}
    </RestaurantContext.Provider>
  );
}