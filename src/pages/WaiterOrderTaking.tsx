import { useState } from "react";
import { ArrowLeft, Plus, Minus, ShoppingCart, Users } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { mockMenuItems, mockTables, menuCategories, MenuItem, OrderItem } from "@/data/mockData";
import { useNavigate, useParams } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";

export default function WaiterOrderTaking() {
  const navigate = useNavigate();
  const { tableNumber } = useParams();
  const { toast } = useToast();
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>(menuCategories[0]);
  const [customerName, setCustomerName] = useState("");
  const [specialInstructions, setSpecialInstructions] = useState("");

  const table = mockTables.find(t => t.number === parseInt(tableNumber || "0"));
  const filteredItems = mockMenuItems.filter(item => 
    item.category === selectedCategory && item.isAvailable
  );

  const addToCart = (menuItem: MenuItem) => {
    const existingItem = cart.find(item => item.menuItemId === menuItem.id);
    
    if (existingItem) {
      setCart(cart.map(item =>
        item.menuItemId === menuItem.id
          ? { ...item, quantity: item.quantity + 1 }
          : item
      ));
    } else {
      setCart([...cart, {
        menuItemId: menuItem.id,
        menuItem,
        quantity: 1
      }]);
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

  const updateItemInstructions = (menuItemId: string, instructions: string) => {
    setCart(cart.map(item =>
      item.menuItemId === menuItemId
        ? { ...item, specialInstructions: instructions }
        : item
    ));
  };

  const getTotalAmount = () => {
    return cart.reduce((total, item) => total + (item.menuItem.price * item.quantity), 0);
  };

  const handleSubmitOrder = () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to the cart before submitting the order.",
        variant: "destructive",
      });
      return;
    }

    // In a real app, this would submit to the backend
    toast({
      title: "Order Placed Successfully!",
      description: `Order for Table ${tableNumber} has been sent to the kitchen.`,
    });
    
    navigate('/waiter');
  };

  if (!table) {
    return (
      <div className="p-6">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-foreground">Table Not Found</h1>
          <Button onClick={() => navigate('/waiter/tables')} className="mt-4">
            Back to Tables
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            onClick={() => navigate('/waiter/tables')}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Tables
          </Button>
          <div>
            <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
              <Users className="w-8 h-8 text-primary" />
              Taking Order - Table {tableNumber}
            </h1>
            <p className="text-muted-foreground mt-1">
              {table.capacity} seats • {table.isOccupied ? 'Occupied' : 'Available'}
            </p>
          </div>
        </div>
        {cart.length > 0 && (
          <Badge variant="secondary" className="flex items-center gap-2">
            <ShoppingCart className="w-4 h-4" />
            {cart.reduce((total, item) => total + item.quantity, 0)} items
          </Badge>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Menu Categories & Items */}
        <div className="lg:col-span-2 space-y-4">
          {/* Category Tabs */}
          <div className="flex flex-wrap gap-2">
            {menuCategories.map((category) => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                onClick={() => setSelectedCategory(category)}
                className="text-sm"
              >
                {category}
              </Button>
            ))}
          </div>

          {/* Menu Items Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredItems.map((item) => {
              const cartItem = cart.find(cartItem => cartItem.menuItemId === item.id);
              
              return (
                <Card key={item.id} className="glass-card">
                  <div className="aspect-video relative overflow-hidden rounded-t-lg">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = '/api/placeholder/300/200';
                      }}
                    />
                    <div className="absolute top-2 right-2">
                      <Badge variant="secondary" className="text-xs">
                        {item.prepTime}min
                      </Badge>
                    </div>
                  </div>
                  
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <h3 className="font-semibold text-foreground">{item.name}</h3>
                        <span className="text-lg font-bold text-primary">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {item.description}
                      </p>
                      
                      <div className="flex items-center justify-between pt-2">
                        {cartItem ? (
                          <div className="flex items-center gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => removeFromCart(item.id)}
                            >
                              <Minus className="w-3 h-3" />
                            </Button>
                            <span className="font-semibold min-w-[2rem] text-center">
                              {cartItem.quantity}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => addToCart(item)}
                            >
                              <Plus className="w-3 h-3" />
                            </Button>
                          </div>
                        ) : (
                          <Button
                            size="sm"
                            onClick={() => addToCart(item)}
                            className="flex items-center gap-1"
                          >
                            <Plus className="w-3 h-3" />
                            Add
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>

        {/* Order Summary */}
        <div className="space-y-4">
          <Card className="glass-card">
            <CardHeader>
              <CardTitle className="text-lg text-foreground">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Customer Name */}
              <div>
                <label className="text-sm font-medium text-foreground">Customer Name</label>
                <Input
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  placeholder="Enter customer name (optional)"
                  className="mt-1"
                />
              </div>

              {/* Cart Items */}
              {cart.length === 0 ? (
                <div className="text-center py-8">
                  <ShoppingCart className="w-12 h-12 text-muted-foreground/50 mx-auto mb-3" />
                  <p className="text-muted-foreground">No items in cart</p>
                  <p className="text-sm text-muted-foreground">Start adding items from the menu</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {cart.map((item) => (
                    <div key={item.menuItemId} className="space-y-2">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <p className="font-medium text-foreground">{item.menuItem.name}</p>
                          <p className="text-sm text-muted-foreground">
                            ${item.menuItem.price.toFixed(2)} × {item.quantity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => removeFromCart(item.menuItemId)}
                          >
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="font-semibold min-w-[2rem] text-center">
                            {item.quantity}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => addToCart(item.menuItem)}
                          >
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                      
                      {/* Item Special Instructions */}
                      <Textarea
                        placeholder="Special instructions for this item..."
                        value={item.specialInstructions || ""}
                        onChange={(e) => updateItemInstructions(item.menuItemId, e.target.value)}
                        className="text-sm"
                        rows={2}
                      />
                    </div>
                  ))}
                </div>
              )}

              {/* General Special Instructions */}
              {cart.length > 0 && (
                <div>
                  <label className="text-sm font-medium text-foreground">General Instructions</label>
                  <Textarea
                    value={specialInstructions}
                    onChange={(e) => setSpecialInstructions(e.target.value)}
                    placeholder="Any special instructions for the entire order..."
                    className="mt-1"
                    rows={3}
                  />
                </div>
              )}

              {/* Total */}
              {cart.length > 0 && (
                <div className="border-t border-border pt-4">
                  <div className="flex justify-between items-center">
                    <span className="text-lg font-semibold text-foreground">Total:</span>
                    <span className="text-2xl font-bold text-primary">
                      ${getTotalAmount().toFixed(2)}
                    </span>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <Button 
                onClick={handleSubmitOrder}
                className="w-full btn-primary"
                size="lg"
                disabled={cart.length === 0}
              >
                <ShoppingCart className="w-4 h-4 mr-2" />
                Submit Order
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}