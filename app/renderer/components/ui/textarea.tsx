import * as React from "react";

import { cn } from "@/lib/utils";

function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex field-sizing-content min-h-16 w-full rounded-[var(--radius-md)] border border-rule bg-paper-sunk px-3 py-2",
        "font-[family-name:var(--font-serif)] text-[14px] leading-[1.55] text-ink",
        "placeholder:text-stone",
        "transition-[border-color,box-shadow] duration-150 ease-[var(--ease-paper)]",
        "outline-none focus-visible:border-navy focus-visible:shadow-[0_0_0_3px_var(--navy-wash)]",
        "disabled:cursor-not-allowed disabled:opacity-45",
        "aria-invalid:border-destructive aria-invalid:shadow-[0_0_0_3px_var(--stamp-tint)]",
        "selection:bg-[var(--navy-wash)] selection:text-ink",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
