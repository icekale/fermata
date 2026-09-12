import * as React from "react";

import { cn } from "@/lib/utils";

/* A well, not a box: sunk paper behind a hairline, so a form reads as one
   printed sheet instead of a grid of white rectangles. */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "flex h-9 w-full min-w-0 rounded-[var(--radius-md)] border border-rule bg-paper-sunk px-3 py-1",
        "font-[family-name:var(--font-serif)] text-[14px] text-ink",
        "placeholder:text-stone",
        "transition-[border-color,box-shadow] duration-150 ease-[var(--ease-paper)]",
        "outline-none focus-visible:border-navy focus-visible:shadow-[0_0_0_3px_var(--navy-wash)]",
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-45",
        "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_var(--stamp-tint)]",
        "selection:bg-[var(--navy-wash)] selection:text-ink",
        "file:mr-3 file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-[13px] file:font-medium file:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
