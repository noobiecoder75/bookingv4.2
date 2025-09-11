import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center whitespace-nowrap rounded-xl text-sm font-semibold transition-smooth focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 shadow-soft hover:shadow-medium hover:-translate-y-0.5",
  {
    variants: {
      variant: {
        default: "bg-gradient-primary text-white hover:shadow-strong hover-glow border-0",
        destructive:
          "bg-gradient-to-r from-rose-500 to-red-500 text-white hover:shadow-strong",
        outline:
          "border border-gray-200 bg-white/70 backdrop-blur-sm hover:bg-white hover:border-gray-300 text-gray-700 shadow-soft",
        secondary:
          "bg-gradient-to-r from-purple-500 to-purple-600 text-white hover:shadow-strong",
        ghost: "hover:bg-gray-100 hover:text-gray-900 shadow-none hover:shadow-soft",
        link: "text-primary underline-offset-4 hover:underline shadow-none hover:shadow-none",
        glass: "glass-white text-white border-glass hover:bg-white/20 hover-lift",
      },
      size: {
        default: "h-11 px-6 py-3",
        sm: "h-9 rounded-lg px-4 text-sm",
        lg: "h-14 rounded-xl px-10 text-base",
        icon: "h-11 w-11",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };