import React from "react";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";

interface FormGroupProps {
  label?: string;
  labelInfo?: string;
  className?: string;
  children: React.ReactNode;
}

export function FormGroup({
  label,
  labelInfo,
  className,
  children,
}: FormGroupProps) {
  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <div className="flex items-baseline gap-2">
          <Label>{label}</Label>
          {labelInfo && <span className="u-label">{labelInfo}</span>}
        </div>
      )}
      <div className="space-y-2">{children}</div>
    </div>
  );
}
