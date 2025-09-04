import { useState, useEffect } from "react";
import { DollarSign, TrendingUp, Users, Clock, Star, ChefHat } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  menu_item_id: string;
  menu_item?: {
    name: string;
  };
}

interface Order {
  id: string;
  table_number: number;
  customer_name?: string;
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  created_at: string;
  total_amount: number;
  order_items: OrderItem[];
}

interface Table {
  id: string;
  table_number: number;
  capacity: number;
  is_occupied: boolean;
}

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('admin-orders')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    const tablesChannel = supabase
      .channel('admin-tables')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'restaurant_tables'
        },
        () => {
          fetchTables();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(ordersChannel);
      supabase.removeChannel(tablesChannel);
    };
  }, []);

  const fetchData = async () => {
    await Promise.all([fetchOrders(), fetchTables()]);
    setLoading(false);
  };

  const fetchOrders = async () => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          id,
          table_number,
          customer_name,
          status,
          created_at,
          total_amount,
          order_items (
            id,
            quantity,
            unit_price,
            menu_item_id,
            menu_items (
              name
            )
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;

      const transformedOrders: Order[] = data?.map(order => ({
        id: order.id,
        table_number: order.table_number,
        customer_name: order.customer_name,
        status: order.status as Order['status'],
        created_at: order.created_at,
        total_amount: order.total_amount,
        order_items: order.order_items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          menu_item_id: item.menu_item_id,
          menu_item: item.menu_items
        }))
      })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };

  const fetchTables = async () => {
    try {
      const { data, error } = await supabase
        .from('restaurant_tables')
        .select('*')
        .order('table_number', { ascending: true });

      if (error) throw error;
      setTables(data || []);
    } catch (error) {
      console.error('Error fetching tables:', error);
    }
  };

  const occupiedTables = tables.filter(table => table.is_occupied).length;
  const activeOrders = orders.filter(order => order.status !== 'delivered').length;
  const avgOrderTime = 18; // minutes
  
  const dailyRevenue = orders
    .filter(order => {
      const today = new Date();
      const orderDate = new Date(order.created_at);
      return orderDate.toDateString() === today.toDateString();
    })
    .reduce((sum, order) => sum + order.total_amount, 0);

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <TrendingUp className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading admin dashboard...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Admin Dashboard</h1>
          <p className="text-muted-foreground mt-1">Overview of restaurant operations</p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge variant="ready" className="animate-pulse-glow">
            Live Updates
          </StatusBadge>
          <div className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleTimeString()}
          </div>
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
            <div className="text-2xl font-bold text-foreground">${dailyRevenue.toFixed(2)}</div>
            <p className="text-xs text-secondary font-medium mt-1">
              +12.5% from yesterday
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Orders</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{activeOrders}</div>
            <p className="text-xs text-secondary font-medium mt-1">
              {orders.filter(o => o.status === 'pending').length} pending
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Occupied Tables</CardTitle>
            <Users className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{occupiedTables}/{tables.length}</div>
            <p className="text-xs text-secondary font-medium mt-1">
              {tables.length > 0 ? ((occupiedTables / tables.length) * 100).toFixed(0) : 0}% occupancy
            </p>
          </CardContent>
        </Card>

        <Card className="glass-card hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Avg Order Time</CardTitle>
            <Clock className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground">{avgOrderTime} min</div>
            <p className="text-xs text-secondary font-medium mt-1">
              -2 min improvement
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
            {orders.slice(0, 5).map((order) => (
              <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-accent/30 border border-border/30">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-semibold text-sm">
                    #{order.table_number}
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{order.customer_name || `Table ${order.table_number}`}</p>
                    <p className="text-sm text-muted-foreground">
                      {order.order_items.length} items • ${order.total_amount.toFixed(2)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge variant={order.status}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </StatusBadge>
                  <span className="text-xs text-muted-foreground">
                    {Math.floor((Date.now() - new Date(order.created_at).getTime()) / 60000)}m ago
                  </span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Table Status */}
        <Card className="glass-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="w-5 h-5" />
              Table Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-4 gap-3">
              {tables.map((table) => (
                <div
                  key={table.id}
                  className={`p-3 rounded-lg border text-center transition-all duration-200 hover:scale-105 ${
                    table.is_occupied 
                      ? 'bg-orange-50 border-orange-200 text-orange-700' 
                      : 'bg-emerald-50 border-emerald-200 text-emerald-700'
                  }`}
                >
                  <div className="font-semibold">{table.table_number}</div>
                  <div className="text-xs">
                    {table.is_occupied ? 'Occupied' : 'Available'}
                  </div>
                  <div className="text-xs opacity-70">
                    {table.capacity} seats
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Selling Items */}
      <Card className="glass-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-foreground">
            <Star className="w-5 h-5" />
            Top Selling Items Today
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {orders.length === 0 ? (
              <div className="col-span-3 text-center text-muted-foreground py-8">
                No orders yet to show analytics
              </div>
            ) : (
              // Show top menu items from recent orders
              orders
                .flatMap(order => order.order_items)
                .reduce((acc, item) => {
                  const existing = acc.find(i => i.menu_item_id === item.menu_item_id);
                  if (existing) {
                    existing.count += item.quantity;
                  } else {
                    acc.push({
                      menu_item_id: item.menu_item_id,
                      name: item.menu_item?.name || 'Unknown Item',
                      count: item.quantity,
                      price: item.unit_price
                    });
                  }
                  return acc;
                }, [] as any[])
                .sort((a, b) => b.count - a.count)
                .slice(0, 3)
                .map((item, index) => (
                  <div key={item.menu_item_id} className="flex items-center gap-4 p-4 rounded-lg bg-accent/30 border border-border/30">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      index === 0 ? 'bg-yellow-100 text-yellow-700' :
                      index === 1 ? 'bg-gray-100 text-gray-700' :
                      'bg-orange-100 text-orange-700'
                    }`}>
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{item.name}</p>
                      <p className="text-sm text-muted-foreground">{item.count} orders</p>
                    </div>
                    <div className="text-lg font-bold text-primary">
                      ${item.price.toFixed(2)}
                    </div>
                  </div>
                ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}