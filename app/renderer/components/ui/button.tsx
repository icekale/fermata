import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* One button, both surfaces.

   The popover's actions were plain <button> elements with their own CSS while
   the window used this component, so "the primary action" was gold in one place
   and green in the other. A control that means the same thing in two surfaces
   is the same control; the tray renders <Button size="sm"> now.

   Fills: primary is the accent (gold) — reserved for the action a surface
   exists to offer. The wash is the quiet fill, and `ghost` is for the third
   action in a row. Green is NOT a button colour: it means "running" or
   "progress" everywhere else, and a colour cannot mean two things. */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-[10px]",
    "font-sans font-medium",
    "transition-[background-color,color,opacity,transform] duration-150 ease-[var(--ease-paper)]",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
    "disabled:pointer-events-none disabled:opacity-40",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "bg-primary text-primary-foreground hover:brightness-105 active:scale-[0.97]",
        secondary:
          "bg-wash text-foreground-soft hover:bg-wash-hover active:scale-[0.97]",
        outline:
          "border border-border bg-transparent text-foreground-soft hover:bg-wash",
        ghost:
          "bg-transparent text-muted-foreground hover:bg-wash hover:text-foreground-soft",
        destructive:
          "bg-destructive text-destructive-foreground hover:brightness-105 active:scale-[0.97]",
        link: "bg-transparent text-primary hover:underline underline-offset-4",
      },
      size: {
        sm: "h-8 px-3 text-[12px]",
        default: "h-9 px-4 text-[13px]",
        lg: "h-10 px-5 text-[13px]",
        icon: "size-8",
        quiet: "h-8 w-full justify-start px-3 text-[12px] font-normal",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

function Button({
  className,
  variant,
  size,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
