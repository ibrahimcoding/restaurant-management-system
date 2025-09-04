import { Plus, Minus, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/ui/status-badge";
import { type MenuItem } from "@/data/mockData";

interface CartItem {
  id: string;
  menuItemId: string;
  menuItem: MenuItem;
  quantity: number;
}

interface MenuGridProps {
  menuItems: MenuItem[];
  cart: CartItem[];
  onAddToCart: (item: MenuItem) => void;
  onRemoveFromCart: (itemId: string) => void;
  getCartItemQuantity: (itemId: string) => number;
}

export default function MenuGrid({ 
  menuItems, 
  cart, 
  onAddToCart, 
  onRemoveFromCart, 
  getCartItemQuantity 
}: MenuGridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {menuItems.map((item) => {
        const cartQuantity = getCartItemQuantity(item.id);
        
        return (
          <Card key={item.id} className={`glass-card hover-lift transition-all duration-300 ${!item.isAvailable ? 'opacity-60' : ''}`}>
            <CardHeader className="pb-3">
              <div className="aspect-video bg-gradient-to-br from-accent to-muted rounded-lg mb-3 overflow-hidden relative">
                {item.image && !item.image.includes('/api/placeholder') ? (
                  <img 
                    src={item.image} 
                    alt={item.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                    onError={(e) => {
                      const target = e.currentTarget as HTMLImageElement;
                      const fallback = target.parentElement?.querySelector('.fallback-content') as HTMLElement;
                      if (fallback) {
                        target.style.display = 'none';
                        fallback.style.display = 'flex';
                      }
                    }}
                  />
                ) : null}
                <div 
                  className={`fallback-content absolute inset-0 w-full h-full flex items-center justify-center text-muted-foreground ${
                    item.image && !item.image.includes('/api/placeholder') ? 'hidden' : 'flex'
                  }`}
                >
                  <div className="text-center">
                    <span className="text-4xl mb-2 block">🍽️</span>
                    <span className="text-xs">Photo Coming Soon</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg mb-1 text-foreground">{item.name}</CardTitle>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {item.category}
                    </Badge>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="w-3 h-3" />
                      <span className="text-xs">{item.prepTime} min</span>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xl font-bold text-primary">${item.price}</div>
                  {!item.isAvailable && (
                    <StatusBadge variant="delivered">Unavailable</StatusBadge>
                  )}
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="pt-0">
              <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
                {item.description}
              </p>
              
              <div className="flex items-center gap-2">
                {cartQuantity > 0 ? (
                  <div className="flex items-center gap-3 flex-1">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onRemoveFromCart(item.id)}
                      className="w-8 h-8 rounded-full p-0"
                    >
                      <Minus className="w-4 h-4" />
                    </Button>
                    
                    <span className="text-lg font-semibold text-foreground min-w-[2rem] text-center">
                      {cartQuantity}
                    </span>
                    
                    <Button
                      size="sm"
                      onClick={() => onAddToCart(item)}
                      disabled={!item.isAvailable}
                      className="btn-primary w-8 h-8 rounded-full p-0"
                    >
                      <Plus className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    onClick={() => onAddToCart(item)}
                    disabled={!item.isAvailable}
                    className="btn-primary flex-1"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add to Cart
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}