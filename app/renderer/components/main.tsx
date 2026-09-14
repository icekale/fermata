import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/sonner";

/* One page per window: the settings window never renders the break sheet and
   the popover never renders either. Splitting on that boundary keeps
   framer-motion and the break machinery out of the popover's first paint —
   the entry fell to every window at 636 kB otherwise. */
const Break = lazy(() => import("./break"));
const Settings = lazy(() => import("./settings"));
const Sounds = lazy(() => import("./sounds"));
const TrayPanel = lazy(() => import("./tray-panel"));

/* Set before the first paint: a transparent window that flashes the app
   background for one frame shows it as a dark rectangle in the 8px ring. */
const pageName = new URLSearchParams(location.search).get("page") ?? "";
document.documentElement.dataset.page = pageName;

export default function Main() {
  const params = new URLSearchParams(location.search);
  const page = params.get("page");

  return (
    <>
      <Suspense fallback={null}>
        {page === "settings" && <Settings />}
        {page === "sounds" && <Sounds />}
        {page === "break" && <Break />}
        {page === "tray" && <TrayPanel />}
      </Suspense>
      <Toaster />
    </>
  );
}
