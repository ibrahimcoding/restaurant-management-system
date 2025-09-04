import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';
import { useRestaurant } from './useRestaurant';

type UserRole = 'admin' | 'chef' | 'waiter' | null;

interface UserRoleContextType {
  role: UserRole;
  loading: boolean;
  isAdmin: boolean;
  isChef: boolean;
  isWaiter: boolean;
  canManageMenu: boolean;
  refreshRole: () => Promise<void>;
}

const UserRoleContext = createContext<UserRoleContextType>({
  role: null,
  loading: true,
  isAdmin: false,
  isChef: false,
  isWaiter: false,
  canManageMenu: false,
  refreshRole: async () => {},
});

export const useUserRole = () => {
  const context = useContext(UserRoleContext);
  if (!context) {
    throw new Error('useUserRole must be used within a UserRoleProvider');
  }
  return context;
};

export function UserRoleProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading } = useRestaurant();
  const [role, setRole] = useState<UserRole>(null);
  const [loading, setLoading] = useState(true);

  const fetchRole = async () => {
    if (!user || !restaurant) {
      setRole(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      
      // Check if user is the restaurant owner
      if (restaurant.owner_id === user.id) {
        setRole('admin');
        return;
      }

      // Check staff role
      const { data: staffRecord } = await supabase
        .from('restaurant_staff')
        .select('role')
        .eq('user_id', user.id)
        .eq('restaurant_id', restaurant.id)
        .eq('is_active', true)
        .maybeSingle();

      if (staffRecord?.role) {
        setRole(staffRecord.role as UserRole);
      } else {
        setRole(null);
      }
    } catch (error) {
      console.error('Error fetching user role:', error);
      setRole(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !restaurantLoading) {
      fetchRole();
    }
  }, [user, restaurant, authLoading, restaurantLoading]);

  const isAdmin = role === 'admin';
  const isChef = role === 'chef';
  const isWaiter = role === 'waiter';
  const canManageMenu = isAdmin; // Only admins can manage menu

  return (
    <UserRoleContext.Provider value={{
      role,
      loading,
      isAdmin,
      isChef,
      isWaiter,
      canManageMenu,
      refreshRole: fetchRole,
    }}>
      {children}
    </UserRoleContext.Provider>
  );
}