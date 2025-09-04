import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Loader2, Store, ChefHat } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
  requireRestaurant?: boolean;
}

export default function ProtectedRoute({ 
  children, 
  requireAuth = false, 
  requireRestaurant = false 
}: ProtectedRouteProps) {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { restaurant, loading: restaurantLoading, hasRestaurant } = useRestaurant();

  useEffect(() => {
    if (!authLoading) {
      if (requireAuth && !user) {
        navigate('/auth');
        return;
      }
      
      if (requireRestaurant && user && !restaurantLoading && !hasRestaurant) {
        navigate('/register-restaurant');
        return;
      }
    }
  }, [user, restaurant, authLoading, restaurantLoading, hasRestaurant, requireAuth, requireRestaurant, navigate]);

  // Show loading state
  if (authLoading || (requireRestaurant && restaurantLoading)) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/10 flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4 text-primary" />
          <p className="text-muted-foreground">Loading...</p>
        </Card>
      </div>
    );
  }

  // Check authentication
  if (requireAuth && !user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/10 flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <ChefHat className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Authentication Required</h2>
          <p className="text-muted-foreground mb-4">Please sign in to access this page</p>
          <Button onClick={() => navigate('/auth')} className="btn-primary">
            Sign In
          </Button>
        </Card>
      </div>
    );
  }

  // Check restaurant requirement
  if (requireRestaurant && user && !hasRestaurant) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/10 flex items-center justify-center">
        <Card className="glass-card p-8 text-center">
          <Store className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h2 className="text-xl font-semibold text-foreground mb-2">Restaurant Required</h2>
          <p className="text-muted-foreground mb-4">Please register your restaurant to access this page</p>
          <Button onClick={() => navigate('/register-restaurant')} className="btn-primary">
            Register Restaurant
          </Button>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}