import { useState, useEffect, useMemo } from "react";
import { ShoppingCart, LogIn } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockMenuItems, menuCategories, type MenuItem, type OrderItem } from "@/data/mockData";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { useIsMobile } from "@/hooks/use-mobile";
import { useToast } from "@/hooks/use-toast";
import MenuFilters, { type FilterState } from "@/components/MenuFilters";
import MenuGrid from "@/components/MenuGrid";
import TableNumberDialog from "@/components/TableNumberDialog";

interface CartItem extends OrderItem {
  id: string;
}

const ITEMS_PER_PAGE = 12;

export default function CustomerMenu() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const isMobile = useIsMobile();
  const { toast } = useToast();
  const [cart, setCart] = useState<CartItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [showTableDialog, setShowTableDialog] = useState(false);
  const [filters, setFilters] = useState<FilterState>({
    searchQuery: "",
    selectedCategories: [],
    selectedMealTimes: [],
    priceRange: ""
  });
  const tableNumber = parseInt(searchParams.get('table') || '5');
  const isWaiterMode = searchParams.get('waiter') === 'true';
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMenuItems();
  }, []);

  const fetchMenuItems = async () => {
    try {
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true);

      if (error) {
        console.error('Error fetching menu items:', error);
        setMenuItems(mockMenuItems);
      } else if (data && data.length > 0) {
        const transformedItems: MenuItem[] = data.map(item => ({
          id: item.id,
          name: item.name,
          description: item.description || '',
          price: parseFloat(item.price.toString()),
          image: item.image_url || '/api/placeholder/300/200',
          category: item.category,
          isAvailable: item.is_available,
          prepTime: item.prep_time,
        }));
        setMenuItems(transformedItems);
      } else {
        setMenuItems(mockMenuItems);
      }
    } catch (error) {
      console.error('Error fetching menu items:', error);
      setMenuItems(mockMenuItems);
    } finally {
      setLoading(false);
    }
  };

  const filteredItems = useMemo(() => {
    let items = menuItems;

    if (filters.searchQuery) {
      items = items.filter(item =>
        item.name.toLowerCase().includes(filters.searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(filters.searchQuery.toLowerCase())
      );
    }

    if (filters.selectedCategories.length > 0) {
      items = items.filter(item => filters.selectedCategories.includes(item.category));
    }

    if (filters.priceRange) {
      const [min, max] = filters.priceRange.includes('+') 
        ? [30, Infinity] 
        : filters.priceRange.split('-').map(Number);
      items = items.filter(item => item.price >= min && (max === Infinity || item.price <= max));
    }

    return items;
  }, [menuItems, filters]);

  const totalPages = Math.ceil(filteredItems.length / ITEMS_PER_PAGE);
  const paginatedItems = useMemo(() => {
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    return filteredItems.slice(startIndex, startIndex + ITEMS_PER_PAGE);
  }, [filteredItems, currentPage]);

  useEffect(() => {
    setCurrentPage(1);
  }, [filters]);

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setCart(cart.map(item => 
        item.menuItemId === menuItem.id 
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      const newCartItem: CartItem = {
        id: `cart-${Date.now()}`,
        menuItemId: menuItem.id,
        menuItem,
        quantity: 1
      };
      setCart([...cart, newCartItem]);
    }
  };

  const removeFromCart = (menuItemId: string) => {
    const existingItem = cart.find(item => item.menuItemId === menuItemId);
    
    if (existingItem && existingItem.quantity > 1) {
      setCart(cart.map(item => 
        item.menuItemId === menuItemId 
          ? { ...item, quantity: item.quantity - 1 }
          : item
      ));
    } else {
      setCart(cart.filter(item => item.menuItemId !== menuItemId));
    }
  };

  const getCartItemQuantity = (menuItemId: string) => {
    const item = cart.find(item => item.menuItemId === menuItemId);
    return item ? item.quantity : 0;
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const getTotalItems = () => {
    return cart.reduce((total, item) => total + item.quantity, 0);
  };

  const placeOrder = async (tableNumber: number, customerName?: string) => {
    try {
      // Validation
      if (!tableNumber || tableNumber < 1) {
        toast({
          title: "Invalid Table Number",
          description: "Please enter a valid table number.",
          variant: "destructive",
        });
        return;
      }

      if (cart.length === 0) {
        toast({
          title: "Empty Cart",
          description: "Please add items to your cart before placing an order.",
          variant: "destructive",
        });
        return;
      }

      // Get restaurant ID from the first menu item since all items should be from the same restaurant
      let restaurantId = searchParams.get('restaurant');
      
      if (!restaurantId && menuItems.length > 0) {
        // Try to get restaurant_id from the fetched menu items
        const { data: menuItem, error } = await supabase
          .from('menu_items')
          .select('restaurant_id')
          .eq('id', menuItems[0].id)
          .single();
        
        if (menuItem && !error) {
          restaurantId = menuItem.restaurant_id;
        }
      }

      if (!restaurantId) {
        toast({
          title: "Restaurant Not Found",
          description: "Unable to identify the restaurant. Please try again.",
          variant: "destructive",
        });
        return;
      }
      
      // Calculate total amount
      const totalAmount = getTotalAmount();
      
      // Create the order
      const { data: order, error: orderError } = await supabase
        .from('orders')
        .insert({
          restaurant_id: restaurantId,
          table_number: tableNumber,
          total_amount: totalAmount,
          status: 'pending',
          customer_name: customerName || null,
          special_instructions: null
        })
        .select()
        .single();

      if (orderError) throw orderError;

      // Create order items
      const orderItems = cart.map(item => ({
        order_id: order.id,
        menu_item_id: item.menuItemId,
        quantity: item.quantity,
        unit_price: item.menuItem.price,
        special_instructions: null
      }));

      const { error: itemsError } = await supabase
        .from('order_items')
        .insert(orderItems);

      if (itemsError) throw itemsError;

      // Update table status to occupied (don't fail the order if this fails)
      try {
        await supabase
          .from('restaurant_tables')
          .update({ is_occupied: true })
          .eq('restaurant_id', restaurantId)
          .eq('table_number', tableNumber);
      } catch (tableError) {
        console.warn('Could not update table status:', tableError);
      }

      // Clear cart and show success message
      setCart([]);
      toast({
        title: "Order Placed Successfully!",
        description: `Your order for table #${tableNumber} has been sent to the kitchen.`,
      });

    } catch (error) {
      console.error('Error placing order:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast({
        title: "Order Failed",
        description: `There was an error placing your order: ${errorMessage}. Please try again.`,
        variant: "destructive",
      });
      throw error;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-secondary/10">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border/50 shadow-sm">
        <div className="container max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary to-primary-glow flex items-center justify-center shadow-lg">
                <span className="text-primary-foreground font-bold text-lg">#{tableNumber}</span>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-foreground">Welcome to RestaurantOS</h1>
                <p className="text-muted-foreground">Multi-vendor Restaurant Management</p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <Button 
                variant="outline" 
                onClick={() => navigate('/auth')}
                className="hover-lift"
              >
                <LogIn className="w-4 h-4 mr-2" />
                Restaurant Login
              </Button>
              
              {cart.length > 0 && (
                <Button 
                  className="btn-primary relative"
                  onClick={() => {/* TODO: Open cart modal */}}
                >
                  <ShoppingCart className="w-4 h-4 mr-2" />
                  View Cart
                  {getTotalItems() > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground min-w-[1.25rem] h-5 rounded-full text-xs">
                      {getTotalItems()}
                    </Badge>
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container max-w-7xl mx-auto px-4 py-8">
        <div className="flex gap-6">
          {/* Desktop Sidebar */}
          {!isMobile && (
            <div className="w-80 flex-shrink-0">
              <MenuFilters
                filters={filters}
                onFiltersChange={setFilters}
                categories={menuCategories}
              />
            </div>
          )}

          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Mobile Filter Button */}
            {isMobile && (
              <div className="mb-6">
                <MenuFilters
                  filters={filters}
                  onFiltersChange={setFilters}
                  categories={menuCategories}
                />
              </div>
            )}

            {/* Results Info */}
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold text-foreground">
                {filteredItems.length} {filteredItems.length === 1 ? 'item' : 'items'}
                {filters.searchQuery && ` for "${filters.searchQuery}"`}
              </h2>
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
            </div>

            {/* Menu Items Grid */}
            {paginatedItems.length > 0 ? (
              <MenuGrid
                menuItems={paginatedItems}
                cart={cart}
                onAddToCart={addToCart}
                onRemoveFromCart={removeFromCart}
                getCartItemQuantity={getCartItemQuantity}
              />
            ) : (
              <div className="text-center py-12">
                <p className="text-lg text-muted-foreground mb-2">No menu items found</p>
                <p className="text-sm text-muted-foreground">
                  Try adjusting your filters or search query
                </p>
              </div>
            )}

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="mt-8 flex justify-center">
                <Pagination>
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious 
                        onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                        className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    
                    {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                      <PaginationItem key={page}>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    ))}
                    
                    <PaginationItem>
                      <PaginationNext 
                        onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                        className={currentPage === totalPages ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              </div>
            )}
          </div>
        </div>

        {/* Cart Summary */}
        {cart.length > 0 && (
          <Card className="glass-card sticky bottom-4 animate-fade-in shadow-xl mt-8">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-primary flex items-center justify-center">
                    <ShoppingCart className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {getTotalItems()} {getTotalItems() === 1 ? 'item' : 'items'} in cart
                    </p>
                    <p className="text-2xl font-bold text-primary">
                      ${getTotalAmount().toFixed(2)}
                    </p>
                  </div>
                </div>
                
                <Button 
                  size="lg" 
                  className="btn-primary shadow-lg"
                  onClick={() => setShowTableDialog(true)}
                >
                  Place Order
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Table Number Dialog */}
        <TableNumberDialog
          open={showTableDialog}
          onOpenChange={setShowTableDialog}
          onConfirm={placeOrder}
          totalAmount={getTotalAmount()}
          totalItems={getTotalItems()}
        />
      </div>
    </div>
  );
}