import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/* A pressed well that fills with navy ink when on. The knob is paper, not
   white, so it reads as the same material as the page it sits on. */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[22px] w-[36px] shrink-0 cursor-pointer items-center rounded-full",
        "border transition-[background-color,border-color] duration-150 ease-[var(--ease-paper)]",
        "data-[state=checked]:border-navy data-[state=checked]:bg-navy",
        "data-[state=unchecked]:border-rule data-[state=unchecked]:bg-paper-sunk",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-navy",
        "disabled:cursor-not-allowed disabled:opacity-45",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[16px] rounded-full bg-paper-raised shadow-[var(--shadow-hairline)]",
          "transition-transform duration-150 ease-[var(--ease-paper)]",
          "data-[state=checked]:translate-x-[17px] data-[state=unchecked]:translate-x-[3px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
