import { useState } from "react";
import { Users, ArrowRight, Circle, CheckCircle } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { mockTables, mockOrders } from "@/data/mockData";
import { useNavigate } from "react-router-dom";

export default function WaiterTableSelection() {
  const navigate = useNavigate();
  
  const occupiedTables = mockTables.filter(table => table.isOccupied);
  const availableTables = mockTables.filter(table => !table.isOccupied);

  const getTableOrder = (tableNumber: number) => {
    return mockOrders.find(order => order.tableNumber === tableNumber && order.status !== 'delivered');
  };

  const handleTakeOrder = (tableNumber: number) => {
    navigate(`/menu?table=${tableNumber}&waiter=true`);
  };

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground flex items-center gap-3">
            <Users className="w-8 h-8 text-primary" />
            Table Management
          </h1>
          <p className="text-muted-foreground mt-1">Select a table to take an order</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="secondary" className="text-sm">
            {occupiedTables.length} Occupied
          </Badge>
          <Badge variant="outline" className="text-sm">
            {availableTables.length} Available
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="glass-card">
          <CardContent className="flex items-center gap-4 p-6">
            <div className="w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{availableTables.length}</p>
              <p className="text-sm text-muted-foreground">Available Tables</p>
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
              <Circle className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-foreground">{mockTables.length}</p>
              <p className="text-sm text-muted-foreground">Total Tables</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Tables */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-400"></div>
            Available Tables ({availableTables.length})
          </h2>
          
          <div className="grid gap-3">
            {availableTables.map((table) => (
              <Card key={table.id} className="glass-card border-l-4 border-l-green-400">
                <CardContent className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-full bg-green-600 text-white flex items-center justify-center font-bold">
                      #{table.number}
                    </div>
                    <div>
                      <p className="font-semibold text-foreground">Table {table.number}</p>
                      <p className="text-sm text-muted-foreground">
                        {table.capacity} seats • Available
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => handleTakeOrder(table.number)}
                    className="btn-primary"
                  >
                    Take Order
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Occupied Tables */}
        <div className="space-y-4">
          <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-orange-400"></div>
            Occupied Tables ({occupiedTables.length})
          </h2>
          
          <div className="grid gap-3">
            {occupiedTables.map((table) => {
              const tableOrder = getTableOrder(table.number);
              
              return (
                <Card key={table.id} className="glass-card border-l-4 border-l-orange-400">
                  <CardContent className="flex items-center justify-between p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-12 h-12 rounded-full bg-orange-600 text-white flex items-center justify-center font-bold">
                        #{table.number}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">Table {table.number}</p>
                        <p className="text-sm text-muted-foreground">
                          {table.capacity} seats • {tableOrder ? `Order ${tableOrder.id}` : 'Occupied'}
                        </p>
                        {tableOrder && (
                          <Badge 
                            variant={
                              tableOrder.status === 'ready' ? 'default' :
                              tableOrder.status === 'cooking' ? 'secondary' : 'outline'
                            }
                            className="text-xs mt-1"
                          >
                            {tableOrder.status.charAt(0).toUpperCase() + tableOrder.status.slice(1)}
                          </Badge>
                        )}
                      </div>
                    </div>
                    <Button 
                      onClick={() => handleTakeOrder(table.number)}
                      variant="outline"
                    >
                      Add Items
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}