import { useTheme } from "next-themes";
import { Toaster as Sonner, ToasterProps } from "sonner";

/* Toasts are paper slips. Their colour and shape are set from index.css
   against sonner's own data attributes, because the classes sonner lets you
   pass have to be forced with `important` to beat its inline styles, and a
   stylesheet beats an inline style without that fight. */
const Toaster = ({ ...props }: ToasterProps) => {
  const { theme = "system" } = useTheme();

  return (
    <Sonner
      theme={theme as ToasterProps["theme"]}
      className="toaster group"
      style={
        {
          "--normal-bg": "var(--paper-raised)",
          "--normal-text": "var(--ink)",
          "--normal-border": "var(--rule)",
          "--border-radius": "var(--radius-lg)",
          "--success-bg": "var(--paper-raised)",
          "--success-text": "var(--ink)",
          "--success-border": "var(--rule)",
          "--error-bg": "var(--paper-raised)",
          "--error-text": "var(--ink)",
          "--error-border": "var(--stamp)",
          "--font-family": "var(--font-serif)",
        } as React.CSSProperties
      }
      {...props}
    />
  );
};

export { Toaster };
