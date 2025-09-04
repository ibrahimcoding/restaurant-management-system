import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ShoppingCart } from "lucide-react";

interface TableNumberDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (tableNumber: number, customerName?: string) => void;
  totalAmount: number;
  totalItems: number;
}

export default function TableNumberDialog({ 
  open, 
  onOpenChange, 
  onConfirm, 
  totalAmount, 
  totalItems 
}: TableNumberDialogProps) {
  const [tableNumber, setTableNumber] = useState("");
  const [customerName, setCustomerName] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleConfirm = async () => {
    if (!tableNumber || isNaN(Number(tableNumber))) {
      return;
    }

    setIsSubmitting(true);
    try {
      await onConfirm(Number(tableNumber), customerName.trim() || undefined);
      setTableNumber("");
      setCustomerName("");
      onOpenChange(false);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" />
            Confirm Your Order
          </DialogTitle>
          <DialogDescription>
            Please enter your table number to place your order.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Order Summary */}
          <div className="bg-accent/20 rounded-lg p-4 space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Items:</span>
              <span className="font-medium">{totalItems}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Total:</span>
              <span className="text-xl font-bold text-primary">${totalAmount.toFixed(2)}</span>
            </div>
          </div>

          {/* Table Number Input */}
          <div className="space-y-2">
            <Label htmlFor="table-number">Table Number *</Label>
            <Input
              id="table-number"
              type="number"
              placeholder="Enter table number"
              value={tableNumber}
              onChange={(e) => setTableNumber(e.target.value)}
              min="1"
              max="100"
            />
          </div>

          {/* Customer Name Input */}
          <div className="space-y-2">
            <Label htmlFor="customer-name">Customer Name (Optional)</Label>
            <Input
              id="customer-name"
              type="text"
              placeholder="Enter your name"
              value={customerName}
              onChange={(e) => setCustomerName(e.target.value)}
              maxLength={50}
            />
          </div>
        </div>

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            onClick={() => onOpenChange(false)}
            className="flex-1"
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button 
            onClick={handleConfirm}
            disabled={!tableNumber || isNaN(Number(tableNumber)) || isSubmitting}
            className="flex-1 btn-primary"
          >
            {isSubmitting ? "Placing Order..." : "Place Order"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}