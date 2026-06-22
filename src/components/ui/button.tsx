import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-medium border border-brand-orange/30 ring-offset-background transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-orange/60 focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-brand-orange text-brand-white border-brand-orange hover:bg-brand-orange/90 hover:border-brand-orange/90 shadow-sm",
        destructive: "bg-destructive text-destructive-foreground border-destructive hover:bg-destructive/90",
        outline: "border-brand-orange/40 bg-background text-foreground hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange",
        secondary: "bg-secondary text-secondary-foreground border-brand-orange/20 hover:bg-brand-orange/10 hover:border-brand-orange/50",
        ghost: "border-transparent hover:bg-brand-orange/10 hover:text-brand-orange hover:border-brand-orange/30",
        link: "border-transparent text-brand-orange underline-offset-4 hover:underline",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-9 px-3",
        lg: "h-11 px-8",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button";
    return <Comp className={cn(buttonVariants({ variant, size, className }))} ref={ref} {...props} />;
  },
);
Button.displayName = "Button";

export { Button, buttonVariants };
