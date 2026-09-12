import { useT } from "@/i18n";
import type { MessageKey } from "../../../i18n";

interface PageHeadProps {
  /** 1-based, rendered as `01`. */
  index: number;
  /** The group's name — the same string the rail shows, so the eyebrow and the
   *  navigation agree. */
  labelKey: MessageKey;
  titleKey: MessageKey;
  ledeKey: MessageKey;
}

/* The chapter mark at the top of each page.

   Before this the largest thing in a 1040px-wide window was a 17px section
   heading, which is why the result read as a form with nice colours on it. The
   reference's own section head runs eyebrow / 32px title / 16px lede, and the
   span between 32 and 13 is most of what makes it look designed. */
export default function PageHead({
  index,
  labelKey,
  titleKey,
  ledeKey,
}: PageHeadProps) {
  const t = useT();

  return (
    <header className="mb-11">
      <p className="page-num tnum">
        {String(index).padStart(2, "0")} · {t(labelKey)}
      </p>
      <h2 className="page-title">{t(titleKey)}</h2>
      <p className="page-lede max-w-[58ch]">{t(ledeKey)}</p>
    </header>
  );
}
