import { Toaster as Sonner, ToasterProps } from "sonner";

/* The toast is the same sheet as a menu: opaque, one hairline, accent border
   only when the news is bad. Sonner paints its own inline styles, so the
   palette is handed over as its CSS variables rather than fought with
   `important` in a stylesheet. `theme` is pinned dark: this app has one
   appearance, and a light toast over the earth panel was the last surface still
   changing colour with the OS. */
const Toaster = ({ ...props }: ToasterProps) => {
  return (
    <Sonner
      theme="dark"
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--raised)",
          "--normal-text": "var(--foreground)",
          "--normal-border": "var(--border)",
          "--success-bg": "var(--raised)",
          "--success-text": "var(--foreground)",
          "--success-border": "var(--border)",
          "--error-bg": "var(--raised)",
          "--error-text": "var(--foreground)",
          "--error-border": "var(--destructive)",
          "--border-radius": "12px",
          "--font-family": "var(--font-sans)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
