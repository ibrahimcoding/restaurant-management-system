import { useState, useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useUserRole } from '@/hooks/useUserRole';
import { useRestaurant } from '@/hooks/useRestaurant';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Edit, Trash2, Eye, EyeOff } from 'lucide-react';
import { MenuItemDialog } from '@/components/menu/MenuItemDialog';
import { DeleteConfirmDialog } from '@/components/menu/DeleteConfirmDialog';

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  category: string;
  image_url: string | null;
  is_available: boolean;
  prep_time: number;
  restaurant_id: string;
  created_at: string;
  updated_at: string;
}

export default function MenuManagement() {
  const { restaurantId } = useParams<{ restaurantId: string }>();
  const { role, canManageMenu, loading: roleLoading } = useUserRole();
  const { restaurant } = useRestaurant();
  const { toast } = useToast();
  
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedItem, setSelectedItem] = useState<MenuItem | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [itemToDelete, setItemToDelete] = useState<MenuItem | null>(null);

  // Redirect if user doesn't have access
  if (!roleLoading && !role) {
    return <Navigate to="/" replace />;
  }

  // Redirect if restaurant ID doesn't match current restaurant
  if (restaurant && restaurantId !== restaurant.id) {
    return <Navigate to={`/restaurants/${restaurant.id}/menu`} replace />;
  }

  useEffect(() => {
    if (restaurant) {
      fetchMenuItems();
    }
  }, [restaurant]);

  const fetchMenuItems = async () => {
    if (!restaurant) return;

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('menu_items')
        .select('*')
        .eq('restaurant_id', restaurant.id)
        .order('category', { ascending: true })
        .order('name', { ascending: true });

      if (error) throw error;
      setMenuItems(data || []);
    } catch (error) {
      console.error('Error fetching menu items:', error);
      toast({
        title: "Error",
        description: "Failed to load menu items",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAddItem = () => {
    setSelectedItem(null);
    setShowDialog(true);
  };

  const handleEditItem = (item: MenuItem) => {
    setSelectedItem(item);
    setShowDialog(true);
  };

  const handleDeleteClick = (item: MenuItem) => {
    setItemToDelete(item);
    setShowDeleteDialog(true);
  };

  const handleDeleteConfirm = async () => {
    if (!itemToDelete) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .delete()
        .eq('id', itemToDelete.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Menu item deleted successfully",
      });

      fetchMenuItems();
    } catch (error) {
      console.error('Error deleting menu item:', error);
      toast({
        title: "Error",
        description: "Failed to delete menu item",
        variant: "destructive",
      });
    } finally {
      setShowDeleteDialog(false);
      setItemToDelete(null);
    }
  };

  const toggleAvailability = async (item: MenuItem) => {
    if (!canManageMenu) return;

    try {
      const { error } = await supabase
        .from('menu_items')
        .update({ is_available: !item.is_available })
        .eq('id', item.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: `${item.name} ${!item.is_available ? 'enabled' : 'disabled'}`,
      });

      fetchMenuItems();
    } catch (error) {
      console.error('Error updating availability:', error);
      toast({
        title: "Error",
        description: "Failed to update availability",
        variant: "destructive",
      });
    }
  };

  const groupedItems = menuItems.reduce((groups, item) => {
    if (!groups[item.category]) {
      groups[item.category] = [];
    }
    groups[item.category].push(item);
    return groups;
  }, {} as Record<string, MenuItem[]>);

  if (roleLoading || loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Menu Management</h1>
          <p className="text-muted-foreground">
            {canManageMenu ? 'Manage your restaurant menu items' : 'View menu items (read-only)'}
          </p>
        </div>
        {canManageMenu && (
          <Button onClick={handleAddItem}>
            <Plus className="w-4 h-4 mr-2" />
            Add Menu Item
          </Button>
        )}
      </div>

      {Object.entries(groupedItems).map(([category, items]) => (
        <Card key={category}>
          <CardHeader>
            <CardTitle>{category}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                <Card key={item.id} className="overflow-hidden">
                  <div className="aspect-video relative">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full bg-muted flex items-center justify-center">
                        <span className="text-muted-foreground">No Image</span>
                      </div>
                    )}
                    <div className="absolute top-2 right-2 flex gap-1">
                      <Badge variant={item.is_available ? 'default' : 'secondary'}>
                        {item.is_available ? 'Available' : 'Unavailable'}
                      </Badge>
                    </div>
                  </div>
                  <CardContent className="p-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start">
                        <h3 className="font-semibold line-clamp-1">{item.name}</h3>
                        <span className="text-lg font-bold">${item.price}</span>
                      </div>
                      {item.description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {item.description}
                        </p>
                      )}
                      <p className="text-xs text-muted-foreground">
                        Prep time: {item.prep_time} minutes
                      </p>
                      <div className="flex gap-2 pt-2">
                        {canManageMenu ? (
                          <>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleEditItem(item)}
                            >
                              <Edit className="w-3 h-3 mr-1" />
                              Edit
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => toggleAvailability(item)}
                            >
                              {item.is_available ? (
                                <EyeOff className="w-3 h-3 mr-1" />
                              ) : (
                                <Eye className="w-3 h-3 mr-1" />
                              )}
                              {item.is_available ? 'Disable' : 'Enable'}
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(item)}
                            >
                              <Trash2 className="w-3 h-3 mr-1" />
                              Delete
                            </Button>
                          </>
                        ) : (
                          <Badge variant="secondary">Read Only</Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      ))}

      {Object.keys(groupedItems).length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-muted-foreground">No menu items found.</p>
            {canManageMenu && (
              <Button onClick={handleAddItem} className="mt-4">
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Menu Item
              </Button>
            )}
          </CardContent>
        </Card>
      )}

      <MenuItemDialog
        open={showDialog}
        onOpenChange={setShowDialog}
        item={selectedItem}
        restaurantId={restaurant?.id || ''}
        onSuccess={() => {
          fetchMenuItems();
          setShowDialog(false);
        }}
      />

      <DeleteConfirmDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        onConfirm={handleDeleteConfirm}
        itemName={itemToDelete?.name || ''}
      />
    </div>
  );
}