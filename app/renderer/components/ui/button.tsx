import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

/* Every button is a pill. The paper world has exactly two button shapes: the
   filled pill (a noun: Save, Apply) and the hairline pill (a verb you can take
   back). Anything else — grey fills, drop shadows, 6px corners — is chrome the
   reference world does not have. */
const buttonVariants = cva(
  [
    "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full",
    "font-[family-name:var(--font-serif)] font-medium",
    "transition-[background-color,border-color,color,transform] duration-150 ease-[var(--ease-paper)]",
    "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
    "disabled:pointer-events-none disabled:opacity-45",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  ].join(" "),
  {
    variants: {
      variant: {
        default:
          "border-[1.5px] border-navy bg-navy text-[color:var(--primary-foreground)] hover:border-navy-light hover:bg-navy-light hover:-translate-y-px active:translate-y-0",
        outline:
          "border-[1.5px] border-navy bg-transparent text-navy hover:bg-navy-tint hover:-translate-y-px active:translate-y-0",
        ghost:
          "border-[1.5px] border-transparent bg-transparent text-ink-soft hover:bg-paper-sunk hover:text-ink",
        secondary:
          "border-[1.5px] border-transparent bg-sand text-ink-soft hover:bg-rule-soft hover:text-ink",
        destructive:
          "border-[1.5px] border-stamp bg-stamp text-[color:var(--paper-raised)] hover:brightness-90",
        link: "text-navy underline decoration-navy/35 underline-offset-4 hover:decoration-navy",
      },
      size: {
        default: "h-9 px-5 text-[14px] has-[>svg]:pr-3.5",
        sm: "h-7.5 px-3.5 text-[13px] has-[>svg]:pr-2.5",
        lg: "h-10.5 px-6 text-[15px] has-[>svg]:pr-4",
        icon: "size-8 text-[13px]",
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
