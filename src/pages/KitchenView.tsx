import { useState, useEffect } from "react";
import { Clock, CheckCircle, ChefHat, Timer, AlertTriangle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface OrderItem {
  id: string;
  quantity: number;
  unit_price: number;
  special_instructions?: string;
  menu_item_id: string;
  menu_item?: {
    name: string;
    prep_time: number;
  };
}

interface Order {
  id: string;
  table_number: number;
  customer_name?: string;
  status: 'pending' | 'cooking' | 'ready' | 'delivered';
  created_at: string;
  total_amount: number;
  estimated_time?: number;
  order_items: OrderItem[];
}

export default function KitchenView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Fetch orders from database
  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for orders
    const channel = supabase
      .channel('kitchen-orders')
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
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'order_items'
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const { data: ordersData, error } = await supabase
        .from('orders')
        .select(`
          id,
          table_number,
          customer_name,
          status,
          created_at,
          total_amount,
          estimated_time,
          order_items (
            id,
            quantity,
            unit_price,
            special_instructions,
            menu_item_id,
            menu_items (
              name,
              prep_time
            )
          )
        `)
        .in('status', ['pending', 'cooking', 'ready'])
        .order('created_at', { ascending: false });

      if (error) throw error;

      // Transform data to match our interface
      const transformedOrders: Order[] = ordersData?.map(order => ({
        id: order.id,
        table_number: order.table_number,
        customer_name: order.customer_name,
        status: order.status as Order['status'],
        created_at: order.created_at,
        total_amount: order.total_amount,
        estimated_time: order.estimated_time,
        order_items: order.order_items.map(item => ({
          id: item.id,
          quantity: item.quantity,
          unit_price: item.unit_price,
          special_instructions: item.special_instructions,
          menu_item_id: item.menu_item_id,
          menu_item: item.menu_items
        }))
      })) || [];

      setOrders(transformedOrders);
    } catch (error) {
      console.error('Error fetching orders:', error);
      toast({
        title: "Error",
        description: "Failed to fetch orders",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: Order['status']) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ 
          status: newStatus,
          estimated_time: newStatus === 'cooking' ? calculateEstimatedTime(orderId) : undefined
        })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Status Updated",
        description: `Order moved to ${newStatus}`,
        variant: "default",
      });

      // Optimistically update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));
    } catch (error) {
      console.error('Error updating order status:', error);
      toast({
        title: "Error",
        description: "Failed to update order status",
        variant: "destructive",
      });
    }
  };

  const calculateEstimatedTime = (orderId: string): number => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return 20;
    
    const maxPrepTime = Math.max(
      ...order.order_items.map(item => item.menu_item?.prep_time || 15)
    );
    
    return maxPrepTime + 5; // Add 5 minutes buffer
  };

  const getTimeElapsed = (orderTime: string) => {
    const elapsed = Math.floor((currentTime.getTime() - new Date(orderTime).getTime()) / 60000);
    return elapsed;
  };

  const getTimeClass = (orderTime: string, estimatedTime: number = 20) => {
    const elapsed = getTimeElapsed(orderTime);
    if (elapsed > estimatedTime + 10) return 'text-red-600 font-bold animate-pulse';
    if (elapsed > estimatedTime) return 'text-orange-600 font-semibold';
    return 'text-green-600';
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <ChefHat className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading kitchen orders...</p>
          </div>
        </div>
      </div>
    );
  }

  const activeOrders = orders.filter(order => 
    ['pending', 'cooking', 'ready'].includes(order.status)
  );

  const pendingOrders = activeOrders.filter(order => order.status === 'pending');
  const cookingOrders = activeOrders.filter(order => order.status === 'cooking');
  const readyOrders = activeOrders.filter(order => order.status === 'ready');

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <ChefHat className="w-8 h-8 text-primary" />
            Kitchen Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Active orders and cooking queue</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            Current Time: {currentTime.toLocaleTimeString()}
          </div>
          <StatusBadge variant="cooking" className="animate-pulse">
            {activeOrders.length} Active Orders
          </StatusBadge>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-amber-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-amber-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{pendingOrders.length}</p>
              <p className="text-sm text-muted-foreground">Pending Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <ChefHat className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{cookingOrders.length}</p>
              <p className="text-sm text-muted-foreground">Cooking Now</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{readyOrders.length}</p>
              <p className="text-sm text-muted-foreground">Ready to Serve</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Order Columns */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Pending Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-amber-400"></div>
            Pending ({pendingOrders.length})
          </h2>
          <div className="space-y-3">
            {pendingOrders.map((order) => (
              <Card key={order.id} className="glass-card border-l-4 border-l-amber-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">
                        #{order.table_number}
                      </span>
                      {order.id}
                    </CardTitle>
                    <div className={`text-sm font-medium ${getTimeClass(order.created_at, order.estimated_time)}`}>
                      {getTimeElapsed(order.created_at)}m
                    </div>
                  </div>
                  {order.customer_name && (
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.menu_item?.name || 'Unknown Item'}</p>
                        <p className="text-xs text-muted-foreground">
                          Prep time: {item.menu_item?.prep_time || 15} min
                        </p>
                        {item.special_instructions && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        ×{item.quantity}
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    onClick={() => updateOrderStatus(order.id, 'cooking')}
                    className="btn-primary w-full mt-4"
                  >
                    Start Cooking
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Cooking Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            Cooking ({cookingOrders.length})
          </h2>
          <div className="space-y-3">
            {cookingOrders.map((order) => (
              <Card key={order.id} className="glass-card border-l-4 border-l-blue-400">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center text-sm font-bold animate-pulse">
                        #{order.table_number}
                      </span>
                      {order.id}
                    </CardTitle>
                    <div className={`text-sm font-medium ${getTimeClass(order.created_at, order.estimated_time)}`}>
                      {getTimeElapsed(order.created_at)}m
                    </div>
                  </div>
                  {order.customer_name && (
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-start">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.menu_item?.name || 'Unknown Item'}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <Timer className="w-3 h-3 text-blue-600" />
                          <span className="text-xs text-blue-600">
                            {item.menu_item?.prep_time || 15} min prep
                          </span>
                        </div>
                        {item.special_instructions && (
                          <p className="text-xs text-orange-600 mt-1">
                            ⚠️ {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        ×{item.quantity}
                      </Badge>
                    </div>
                  ))}
                  <Button 
                    onClick={() => updateOrderStatus(order.id, 'ready')}
                    className="btn-secondary w-full mt-4"
                  >
                    Mark as Ready
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Ready Orders */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            Ready to Serve ({readyOrders.length})
          </h2>
          <div className="space-y-3">
            {readyOrders.map((order) => (
              <Card key={order.id} className="glass-card border-l-4 border-l-green-400 animate-pulse-glow">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg flex items-center gap-2">
                      <span className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center text-sm font-bold">
                        #{order.table_number}
                      </span>
                      {order.id}
                    </CardTitle>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <div className="text-sm font-medium text-green-600">
                        Ready!
                      </div>
                    </div>
                  </div>
                  {order.customer_name && (
                    <p className="text-sm text-muted-foreground">{order.customer_name}</p>
                  )}
                </CardHeader>
                <CardContent className="space-y-3">
                  {order.order_items.map((item, index) => (
                    <div key={index} className="flex justify-between items-center">
                      <div className="flex-1">
                        <p className="font-medium text-foreground">{item.menu_item?.name || 'Unknown Item'}</p>
                        {item.special_instructions && (
                          <p className="text-xs text-orange-600">
                            ⚠️ {item.special_instructions}
                          </p>
                        )}
                      </div>
                      <Badge variant="secondary" className="ml-2">
                        ×{item.quantity}
                      </Badge>
                    </div>
                  ))}
                  <div className="text-center mt-4 p-3 bg-green-50 rounded-lg border border-green-200">
                    <p className="text-sm font-medium text-green-700">
                      🔔 Ready for pickup by waiter
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}