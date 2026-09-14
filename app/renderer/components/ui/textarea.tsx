import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[10px] bg-well px-3 py-2",
        "font-sans text-[13px] leading-relaxed text-foreground",
        "placeholder:text-muted-foreground",
        "transition-[box-shadow] duration-150 ease-[var(--ease-paper)]",
        "outline-none focus-visible:ring-2 focus-visible:ring-primary/45",
        "disabled:cursor-not-allowed disabled:opacity-40",
        "aria-invalid:ring-2 aria-invalid:ring-destructive/50",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
