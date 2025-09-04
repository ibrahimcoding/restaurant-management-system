import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

const statusBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        pending: "bg-amber-50 text-amber-700 border-amber-200 shadow-sm",
        cooking: "bg-blue-50 text-blue-700 border-blue-200 shadow-sm",
        ready: "bg-green-50 text-green-700 border-green-200 shadow-sm animate-pulse-glow",
        delivered: "bg-slate-50 text-slate-600 border-slate-200 shadow-sm",
        occupied: "bg-orange-50 text-orange-700 border-orange-200 shadow-sm",
        available: "bg-emerald-50 text-emerald-700 border-emerald-200 shadow-sm",
      },
    },
    defaultVariants: {
      variant: "pending",
    },
  }
);

export interface StatusBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof statusBadgeVariants> {
  children: React.ReactNode;
}

function StatusBadge({ className, variant, children, ...props }: StatusBadgeProps) {
  return (
    <div className={cn(statusBadgeVariants({ variant }), className)} {...props}>
      {children}
    </div>
  );
}

export { StatusBadge, statusBadgeVariants };