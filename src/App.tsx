import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "./components/layout/AppLayout";
import { AuthProvider } from "./hooks/useAuth";
import { RestaurantProvider } from "./hooks/useRestaurant";
import { UserRoleProvider } from "./hooks/useUserRole";
import CustomerMenu from "./pages/CustomerMenu";
import AdminDashboard from "./pages/AdminDashboard";
import KitchenView from "./pages/KitchenView";
import WaiterView from "./pages/WaiterView";
import WaiterTableSelection from "./pages/WaiterTableSelection";
import WaiterOrderTaking from "./pages/WaiterOrderTaking";
import AuthPage from "./pages/AuthPage";
import RestaurantRegistration from "./pages/RestaurantRegistration";
import RestaurantDashboard from "./pages/RestaurantDashboard";
import MenuManagement from "./pages/MenuManagement";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <RestaurantProvider>
        <UserRoleProvider>
          <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public customer menu */}
              <Route path="/" element={<AppLayout><CustomerMenu /></AppLayout>} />
              <Route path="/menu" element={<AppLayout><CustomerMenu /></AppLayout>} />
              
              {/* Authentication routes */}
              <Route path="/auth" element={<AuthPage />} />
              
              {/* Protected restaurant routes */}
              <Route path="/register-restaurant" element={
                <ProtectedRoute requireAuth={true}>
                  <RestaurantRegistration />
                </ProtectedRoute>
              } />
              
              <Route path="/dashboard" element={
                <ProtectedRoute requireAuth={true} requireRestaurant={true}>
                  <AppLayout>
                    <RestaurantDashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/admin" element={
                <ProtectedRoute requireAuth={true} requireRestaurant={true}>
                  <AppLayout>
                    <AdminDashboard />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/kitchen" element={
                <ProtectedRoute requireAuth={true} requireRestaurant={true}>
                  <AppLayout>
                    <KitchenView />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/waiter" element={
                <ProtectedRoute requireAuth={true} requireRestaurant={true}>
                  <AppLayout>
                    <WaiterView />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/waiter/tables" element={
                <ProtectedRoute requireAuth={true} requireRestaurant={true}>
                  <AppLayout>
                    <WaiterTableSelection />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/waiter/order/:tableNumber" element={
                <ProtectedRoute requireAuth={true} requireRestaurant={true}>
                  <AppLayout>
                    <WaiterOrderTaking />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              <Route path="/restaurants/:restaurantId/menu" element={
                <ProtectedRoute requireAuth={true} requireRestaurant={true}>
                  <AppLayout>
                    <MenuManagement />
                  </AppLayout>
                </ProtectedRoute>
              } />
              
              {/* Redirect old routes */}
              <Route path="/login" element={<Navigate to="/auth" replace />} />
              
              {/* 404 */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
        </UserRoleProvider>
      </RestaurantProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
