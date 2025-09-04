import { useState, useEffect } from "react";
import { CheckCircle, Clock, Users, Utensils, MapPin, AlertTriangle } from "lucide-react";
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

export default function WaiterView() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchData();
    
    // Set up real-time subscriptions
    const ordersChannel = supabase
      .channel('waiter-orders')
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
      .channel('waiter-tables')
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
            special_instructions,
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
          special_instructions: item.special_instructions,
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

  const markAsDelivered = async (orderId: string) => {
    try {
      const { error } = await supabase
        .from('orders')
        .update({ status: 'delivered' })
        .eq('id', orderId);

      if (error) throw error;

      toast({
        title: "Order Delivered",
        description: "Order marked as delivered successfully",
        variant: "default",
      });

      // Optimistically update local state
      setOrders(orders.map(order => 
        order.id === orderId ? { ...order, status: 'delivered' } : order
      ));
    } catch (error) {
      console.error('Error marking order as delivered:', error);
      toast({
        title: "Error",
        description: "Failed to mark order as delivered",
        variant: "destructive",
      });
    }
  };

  const readyOrders = orders.filter(order => order.status === 'ready');
  const deliveredToday = orders.filter(order => order.status === 'delivered');
  const occupiedTables = tables.filter(table => table.is_occupied);

  const getTableDetails = (tableNumber: number) => {
    return tables.find(table => table.table_number === tableNumber);
  };

  const getTimeElapsed = (orderTime: string) => {
    const elapsed = Math.floor((Date.now() - new Date(orderTime).getTime()) / 60000);
    return elapsed;
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6 animate-fade-in">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <Users className="w-12 h-12 text-primary mx-auto mb-4 animate-pulse" />
            <p className="text-muted-foreground">Loading waiter dashboard...</p>
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
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Waiter Dashboard
          </h1>
          <p className="text-muted-foreground mt-1">Ready orders and table service</p>
        </div>
        <div className="flex items-center gap-4">
          <StatusBadge variant="ready" className="animate-pulse-glow">
            {readyOrders.length} Ready to Serve
          </StatusBadge>
          <div className="text-sm text-muted-foreground">
            {deliveredToday.length} delivered today
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{readyOrders.length}</p>
              <p className="text-sm text-muted-foreground">Ready Orders</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center">
              <Users className="w-6 h-6 text-orange-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{occupiedTables.length}</p>
              <p className="text-sm text-muted-foreground">Occupied Tables</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center">
              <Utensils className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{deliveredToday.length}</p>
              <p className="text-sm text-muted-foreground">Served Today</p>
            </div>
          </CardContent>
        </Card>

        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-purple-100 flex items-center justify-center">
              <Clock className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">
                {readyOrders.length > 0 
                  ? Math.round(readyOrders.reduce((acc, order) => acc + getTimeElapsed(order.created_at), 0) / readyOrders.length)
                  : 0
                }m
              </p>
              <p className="text-sm text-muted-foreground">Avg Wait Time</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ready Orders - Priority Section */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400 animate-pulse"></div>
            Ready for Delivery ({readyOrders.length})
          </h2>
          
          {readyOrders.length === 0 ? (
            <Card className="glass-card">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <CheckCircle className="w-12 h-12 text-green-400 mb-4 opacity-50" />
                <p className="text-lg font-medium text-foreground">All caught up! 🎉</p>
                <p className="text-muted-foreground">No orders ready for delivery right now.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {readyOrders.map((order) => {
                const table = getTableDetails(order.table_number);
                const waitTime = getTimeElapsed(order.created_at);
                const isUrgent = waitTime > 30;
                
                return (
                  <Card key={order.id} className={`glass-card border-l-4 border-l-green-400 ${isUrgent ? 'animate-pulse-glow' : ''}`}>
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-lg flex items-center gap-2">
                          <div className="flex items-center gap-2">
                            <span className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${
                              isUrgent ? 'bg-red-500 text-white animate-pulse' : 'bg-green-600 text-white'
                            }`}>
                              #{order.table_number}
                            </span>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-bold">{order.id}</span>
                                {isUrgent && <AlertTriangle className="w-4 h-4 text-red-500" />}
                              </div>
                              {table && (
                                <span className="text-xs text-muted-foreground">
                                  {table.capacity} seats
                                </span>
                              )}
                            </div>
                          </div>
                        </CardTitle>
                        <div className="text-right">
                          <div className={`text-sm font-medium ${
                            isUrgent ? 'text-red-600 font-bold' : 'text-green-600'
                          }`}>
                            {waitTime}m waiting
                          </div>
                          {isUrgent && (
                            <div className="text-xs text-red-500 font-medium">
                              URGENT!
                            </div>
                          )}
                        </div>
                      </div>
                      {order.customer_name && (
                        <p className="text-sm text-muted-foreground flex items-center gap-2">
                          <MapPin className="w-3 h-3" />
                          {order.customer_name}
                        </p>
                      )}
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="space-y-2">
                        {order.order_items.map((item, index) => (
                          <div key={index} className="flex justify-between items-center py-2 px-3 rounded bg-accent/30">
                            <div className="flex-1">
                              <p className="font-medium text-foreground">{item.menu_item?.name || 'Unknown Item'}</p>
                              {item.special_instructions && (
                                <p className="text-xs text-orange-600 mt-1">
                                  📝 {item.special_instructions}
                                </p>
                              )}
                            </div>
                            <Badge variant="secondary" className="ml-2">
                              ×{item.quantity}
                            </Badge>
                          </div>
                        ))}
                      </div>
                      
                      <div className="flex items-center justify-between pt-3 border-t border-border/30">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="w-4 h-4" />
                          <span>Ordered at {new Date(order.created_at).toLocaleTimeString()}</span>
                        </div>
                        <div className="text-lg font-bold text-primary">
                          ${order.total_amount.toFixed(2)}
                        </div>
                      </div>
                      
                      <Button 
                        onClick={() => markAsDelivered(order.id)}
                        className={`w-full ${isUrgent ? 'bg-red-600 hover:bg-red-700' : 'btn-primary'}`}
                        size="lg"
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Mark as Delivered
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>

        {/* Table Status & Management */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5" />
            Table Management
          </h2>
          
          {/* Occupied Tables */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Occupied Tables</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {occupiedTables.map((table) => {
                const tableOrder = orders.find(order => order.table_number === table.table_number && order.status !== 'delivered');
                
                return (
                  <div key={table.id} className="flex items-center justify-between p-3 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
                      #{table.table_number}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        Table {table.table_number}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {table.capacity} seats • {tableOrder ? `Order ${tableOrder.id}` : 'No active order'}
                      </p>
                    </div>
                    </div>
                    {tableOrder && (
                      <StatusBadge variant={tableOrder.status}>
                        {tableOrder.status.charAt(0).toUpperCase() + tableOrder.status.slice(1)}
                      </StatusBadge>
                    )}
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Recent Deliveries */}
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Recent Deliveries</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {deliveredToday.slice(0, 5).map((order) => (
                <div key={order.id} className="flex items-center justify-between p-3 rounded-lg bg-green-50 border border-green-200">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-green-600 text-white flex items-center justify-center font-semibold text-sm">
                      #{order.table_number}
                    </div>
                    <div>
                      <p className="font-medium text-foreground">
                        {order.customer_name || `Table ${order.table_number}`}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        ${order.total_amount.toFixed(2)} • {order.order_items.length} items
                      </p>
                    </div>
                  </div>
                  <div className="text-xs text-green-600 font-medium">
                    {getTimeElapsed(order.created_at)}m ago
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}