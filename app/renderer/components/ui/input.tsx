import * as React from "react";

import { cn } from "@/lib/utils";

/* A well, not a box: pressed into the panel, no border, because a field and the
   surface it sits on are the same material. The ring on focus is the accent —
   the only thing that changes is where you are. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-[10px] bg-well px-3 py-1.5",
        "font-sans text-[13px] text-foreground",
        "placeholder:text-muted-foreground",
        "transition-[box-shadow] duration-150 ease-[var(--ease-paper)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
