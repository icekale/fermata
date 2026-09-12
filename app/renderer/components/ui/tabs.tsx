import * as TabsPrimitive from "@radix-ui/react-tabs";
import * as React from "react";

import { cn } from "@/lib/utils";

function Tabs({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Root>) {
  return (
    <TabsPrimitive.Root
      data-slot="tabs"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

/* The section index. mole.fit's nav is "a quiet translucent track with a
   hairline border and no drop shadow" — that is exactly what a settings window
   needs for its top-level sections, so rather than inventing a second pattern
   the tab bar is that nav: parchment glass, one hairline, pills inside. */
function TabsList({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.List>) {
  return (
    <TabsPrimitive.List
      data-slot="tabs-list"
      className={cn(
        "inline-flex w-full items-center gap-1 rounded-full p-1",
        "border border-rule-soft bg-[color-mix(in_srgb,var(--paper-raised)_72%,transparent)]",
        "backdrop-blur-[14px]",
        className,
      )}
      {...props}
    />
  );
}

function TabsTrigger({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Trigger>) {
  return (
    <TabsPrimitive.Trigger
      data-slot="tabs-trigger"
      className={cn(
        "inline-flex flex-1 items-center justify-center gap-2 whitespace-nowrap rounded-full px-3 py-1.5",
        "font-[family-name:var(--font-serif)] text-[14px] font-medium",
        "text-stone transition-[background-color,color] duration-150 ease-[var(--ease-paper)]",
        "hover:bg-paper-sunk hover:text-ink-soft",
        "data-[state=active]:bg-navy data-[state=active]:text-[color:var(--primary-foreground)]",
        "data-[state=active]:hover:bg-navy",
        "outline-none focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-navy",
        "disabled:pointer-events-none disabled:opacity-45",
        "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
        className,
      )}
      {...props}
    />
  );
}

function TabsContent({
  className,
  ...props
}: React.ComponentProps<typeof TabsPrimitive.Content>) {
  return (
    <TabsPrimitive.Content
      data-slot="tabs-content"
      className={cn("flex-1 outline-none", className)}
      {...props}
    />
  );
}

export { Tabs, TabsContent, TabsList, TabsTrigger };
