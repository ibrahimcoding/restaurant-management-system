import { ChefHat, Home, BarChart, Users, Settings, Store, LogIn, LogOut, Menu, ClipboardList } from "lucide-react";
import { 
  Sidebar, 
  SidebarContent, 
  SidebarMenu, 
  SidebarMenuButton, 
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  useSidebar
} from "@/components/ui/sidebar";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useRestaurant } from "@/hooks/useRestaurant";
import { useUserRole } from "@/hooks/useUserRole";

export function AppSidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { setOpenMobile } = useSidebar();
  const { user, signOut } = useAuth();
  const { restaurant } = useRestaurant();
  const { isAdmin, isWaiter, isChef } = useUserRole();

  const handleNavigation = (path: string) => {
    navigate(path);
    setOpenMobile(false);
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  const menuItems = [
    { title: "Customer Menu", icon: Home, path: "/" },
    ...(user && restaurant ? [
      { title: "Dashboard", icon: BarChart, path: "/dashboard" },
      { title: "Kitchen", icon: ChefHat, path: "/kitchen" },
      { title: "Waiter", icon: Users, path: "/waiter" },
      ...(isWaiter || isAdmin ? [
        { title: "Tables", icon: ClipboardList, path: "/waiter/tables" },
      ] : []),
      ...(isAdmin ? [
        { title: "Manage Menu", icon: Menu, path: `/restaurants/${restaurant.id}/menu` },
        { title: "Settings", icon: Settings, path: `/restaurants/${restaurant.id}/settings` },
      ] : [])
    ] : []),
    ...(!user ? [
      { title: "Sign In", icon: LogIn, path: "/auth" },
    ] : []),
  ];

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-sidebar-primary to-sidebar-primary/80 flex items-center justify-center shadow-sm">
            <ChefHat className="w-4 h-4 text-sidebar-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-sidebar-foreground">RestaurantOS</span>
            {restaurant && (
              <span className="text-xs text-sidebar-foreground/70">{restaurant.name}</span>
            )}
          </div>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.path}>
              <SidebarMenuButton
                onClick={() => handleNavigation(item.path)}
                className={`${
                  isActive(item.path) 
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground' 
                    : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
                } transition-colors`}
              >
                <item.icon className="w-4 h-4" />
                <span>{item.title}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-4">
        {user ? (
          <div className="space-y-2">
            <div className="text-xs text-sidebar-foreground/70 mb-2">
              {user.email}
            </div>
            <SidebarMenuButton
              onClick={handleSignOut}
              className="w-full justify-start text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            >
              <LogOut className="w-4 h-4 mr-3" />
              Sign Out
            </SidebarMenuButton>
          </div>
        ) : null}
      </SidebarFooter>
    </Sidebar>
  );
}