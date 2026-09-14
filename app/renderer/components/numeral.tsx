import { cn } from "@/lib/utils";

/* Mole reads number-first: the figure large, its unit as small trailing
   legend — and neither is glued to the other. "15m 55s" / "15分55秒" /
   "1小时28分" all resolve to digit+unit pairs: 3px inside a pair, 7px
   between pairs. A string with no digits (the "-" at rest) passes through. */
export function Numeral({
  text,
  unit,
  className,
}: {
  text: string;
  unit: string;
  className?: string;
}) {
  if (!/\d/.test(text)) return <>{text}</>;
  const pairs = text.match(/\d+\D*/g) ?? [text];
  return (
    <span className={className}>
      {pairs.map((pair, i) => {
        const num = pair.match(/\d+/)?.[0] ?? pair;
        const u = pair.slice(num.length).trim();
        return (
          <span
            key={i}
            className={cn("inline-flex items-baseline", i > 0 && "ml-[7px]")}
          >
            <span>{num}</span>
            {u && <span className={cn(unit, "ml-[3px]")}>{u}</span>}
          </span>
        );
      })}
    </span>
  );
}
