import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";

import { cn } from "@/lib/utils";

/* Off, the track is a well pressed into the panel; on, it fills with the accent.
   The knob is the same off-white as the values, so the control reads as part of
   the surface rather than a widget dropped on it. */
function Switch({
  className,
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root>) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      className={cn(
        "peer inline-flex h-[22px] w-[38px] shrink-0 cursor-pointer items-center rounded-full",
        "transition-colors duration-200 ease-[var(--ease-paper)]",
        "data-[state=checked]:bg-primary",
        "data-[state=unchecked]:bg-well",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary",
        "disabled:cursor-not-allowed disabled:opacity-40",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className={cn(
          "pointer-events-none block size-[18px] rounded-full bg-ink-hi shadow-sm",
          "transition-transform duration-200 ease-[var(--ease-paper)]",
          "data-[state=checked]:translate-x-[18px] data-[state=unchecked]:translate-x-[2px]",
        )}
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
