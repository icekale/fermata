import { Button } from "@/components/ui/button";
import { Fermata } from "@/components/icons";
import { useT } from "@/i18n";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";

interface WelcomeModalProps {
  open: boolean;
  onClose: () => void;
}

/* The first thing anyone sees is the title page of the manual: a rule, the
   wordmark, the one fact they need, and a single way forward. The old modal
   was a generic dialog — title, grey paragraph, full-width button — which said
   the right thing in the voice of a form. */
export default function WelcomeModal({ open, onClose }: WelcomeModalProps) {
  const handleUnderstood = () => {
    ipcRenderer.invokeSetAppInitialized();
    onClose();
  };

  const t = useT();

  return (
    /* Dismissing by Escape or outside click counts as understood: this is an
       acknowledgement, not a choice to make, and an Esc-dead dialog traps a
       keyboard user in a page with one button. */
    <Dialog
      open={open}
      onOpenChange={(next) => next === false && handleUnderstood()}
    >
      <DialogContent
        className="w-[420px] max-w-[420px] gap-0 overflow-hidden border-border p-0"
        showCloseButton={false}
      >
        <div className="border-b border-border px-7 py-6">
          <Fermata size={30} animated />
          <span className="tile-label mt-4 block">{t("welcome.eyebrow")}</span>
          <DialogTitle className="mt-2 text-[23px] leading-[1.2]">
            {t("welcome.title")}
          </DialogTitle>
        </div>

        <div className="px-7 py-6">
          <p className="text-[14px] leading-[1.65] text-foreground-soft">
            {t(
              processPlatform === "darwin"
                ? "welcome.body"
                : "welcome.body.tray",
            )}
          </p>
          <Button className="mt-6 w-full" onClick={handleUnderstood}>
            {t("welcome.cta")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
