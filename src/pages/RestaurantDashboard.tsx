import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { StatusBadge } from '@/components/ui/status-badge';
import { 
  DollarSign, 
  TrendingUp, 
  Users, 
  Clock, 
  Star, 
  ChefHat,
  LogOut,
  Settings,
  Menu,
  Calendar
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useRestaurant } from '@/hooks/useRestaurant';
import { useToast } from '@/hooks/use-toast';

interface DashboardStats {
  dailyRevenue: number;
  activeOrders: number;
  occupiedTables: number;
  totalTables: number;
  avgOrderTime: number;
}

interface Order {
  id: string;
  table_number: number;
  customer_name: string;
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  total_amount: number;
  created_at: string;
  order_items_count: number;
}

export default function RestaurantDashboard() {
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { restaurant } = useRestaurant();
  const { toast } = useToast();
  
  const [stats, setStats] = useState<DashboardStats>({
    dailyRevenue: 0,
    activeOrders: 0,
    occupiedTables: 0,
    totalTables: 0,
    avgOrderTime: 0,
  });
  
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (restaurant) {
      fetchDashboardData();
    }
  }, [restaurant]);

  const fetchDashboardData = async () => {
    if (!restaurant) return;

    try {
      setIsLoading(true);

      // Fetch today's orders for revenue calculation
      const today = new Date().toISOString().split('T')[0];
      const { data: todaysOrders } = await supabase
        .from('orders')
        .select('total_amount, status')
        .eq('restaurant_id', restaurant.id)
        .gte('created_at', `${today}T00:00:00.000Z`)
        .lt('created_at', `${today}T23:59:59.999Z`);

      // Fetch active orders
      const { data: activeOrdersData } = await supabase
        .from('orders')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .in('status', ['pending', 'cooking', 'ready']);

      // Fetch table statistics
      const { data: tablesData } = await supabase
        .from('restaurant_tables')
        .select('is_occupied')
        .eq('restaurant_id', restaurant.id);

      // Fetch recent orders with item count
      const { data: ordersData } = await supabase
        .from('orders')
        .select(`
          id,
          table_number,
          customer_name,
          status,
          total_amount,
          created_at,
          order_items(count)
        `)
        .eq('restaurant_id', restaurant.id)
        .order('created_at', { ascending: false })
        .limit(5);

      // Calculate stats
      const dailyRevenue = todaysOrders?.reduce((sum, order) => sum + parseFloat(order.total_amount.toString()), 0) || 0;
      const activeOrders = activeOrdersData?.length || 0;
      const occupiedTables = tablesData?.filter(table => table.is_occupied).length || 0;
      const totalTables = tablesData?.length || 0;

      setStats({
        dailyRevenue,
        activeOrders,
        occupiedTables,
        totalTables,
        avgOrderTime: 18, // Placeholder - would calculate from actual data
      });

      setRecentOrders(ordersData?.map(order => ({
        ...order,
        status: order.status as 'pending' | 'cooking' | 'ready' | 'delivered',
        order_items_count: order.order_items?.[0]?.count || 0,
      })) || []);

    } catch (error) {
      console.error('Error fetching dashboard data:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to load dashboard data",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const getTimeAgo = (dateString: string) => {
    const now = new Date();
    const orderTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - orderTime.getTime()) / 60000);
    
    if (diffInMinutes < 60) {
      return `${diffInMinutes}m ago`;
    } else if (diffInMinutes < 1440) {
      return `${Math.floor(diffInMinutes / 60)}h ago`;
    } else {
      return `${Math.floor(diffInMinutes / 1440)}d ago`;
    }
  };

  if (!restaurant) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="glass-card p-8 text-center">
          <p className="text-muted-foreground mb-4">No restaurant found</p>
          <Button onClick={() => navigate('/register-restaurant')} className="btn-primary">
            Register Restaurant
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          {restaurant.logo_url && (
            <img 
              src={restaurant.logo_url} 
              alt={restaurant.name}
              className="w-12 h-12 rounded-lg object-cover"
            />
          )}
          <div>
            <h1 className="text-3xl font-bold text-foreground">{restaurant.name}</h1>
            <p className="text-muted-foreground mt-1">Restaurant Dashboard</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <StatusBadge variant="ready" className="animate-pulse-glow">
            Live Updates
          </StatusBadge>
          <Button variant="outline" size="sm" onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}>
            <Menu className="w-4 h-4 mr-2" />
            Manage Menu
          </Button>
          <Button variant="outline" size="sm" onClick={() => navigate('/settings')}>
            <Settings className="w-4 h-4 mr-2" />
            Settings
          </Button>
          <Button variant="outline" size="sm" onClick={handleSignOut}>
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Daily Revenue</CardTitle>
            <DollarSign className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">${stats.dailyRevenue.toFixed(2)}</div>
            <p className="text-xs text-secondary font-medium mt-1">
              Today's earnings
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.activeOrders}</div>
            <p className="text-xs text-secondary font-medium mt-1">
              In progress
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Table Occupancy</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">
              {stats.occupiedTables}/{stats.totalTables}
            </div>
            <p className="text-xs text-secondary font-medium mt-1">
              {stats.totalTables > 0 ? Math.round((stats.occupiedTables / stats.totalTables) * 100) : 0}% occupied
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{stats.avgOrderTime} min</div>
            <p className="text-xs text-secondary font-medium mt-1">
              Kitchen performance
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent Orders */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <ChefHat className="w-5 h-5" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isLoading ? (
              <div className="space-y-3">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="animate-pulse">
                    <div className="h-16 bg-accent/30 rounded-lg"></div>
                  </div>
                ))}
              </div>
            ) : recentOrders.length > 0 ? (
              recentOrders.map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                      #{order.table_number}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{order.customer_name || 'Table Order'}</p>
                      <p className="text-sm text-muted-foreground">
                        {order.order_items_count} items • ${parseFloat(order.total_amount.toString()).toFixed(2)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge variant={order.status}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </StatusBadge>
                    <span className="text-xs text-muted-foreground">
                      {getTimeAgo(order.created_at)}
                    </span>
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <ChefHat className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No recent orders</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Quick Actions */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Settings className="w-5 h-5" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Button 
              className="w-full justify-start btn-primary" 
              onClick={() => navigate('/kitchen')}
            >
              <ChefHat className="w-4 h-4 mr-3" />
              Kitchen View
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/waiter')}
            >
              <Users className="w-4 h-4 mr-3" />
              Waiter View
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate(`/restaurants/${restaurant.id}/menu`)}
            >
              <Menu className="w-4 h-4 mr-3" />
              Manage Menu
            </Button>
            
            <Button 
              className="w-full justify-start" 
              variant="outline"
              onClick={() => navigate('/table-management')}
            >
              <Calendar className="w-4 h-4 mr-3" />
              Manage Tables
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}