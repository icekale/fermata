import { describe, expect, it } from "vitest";
import {
  dictionaries,
  locales,
  pluralKey,
  localeFromTag,
  resolveLocale,
  translate,
} from ".";
import { en } from "./en";
import { zh } from "./zh";

describe("message catalogues", () => {
  it("has every English key in every other locale", () => {
    const keys = Object.keys(en) as (keyof typeof en)[];
    for (const locale of locales) {
      const missing = keys.filter(
        (key) => dictionaries[locale][key] === undefined,
      );
      expect(missing, `${locale} is missing ${missing.join(", ")}`).toEqual([]);
    }
  });

  it("has no key left as an empty string", () => {
    for (const locale of locales) {
      const empty = (Object.keys(en) as (keyof typeof en)[]).filter(
        (key) => dictionaries[locale][key].trim() === "",
      );
      expect(empty, `${locale} has blank ${empty.join(", ")}`).toEqual([]);
    }
  });

  it("uses the same interpolation placeholders in both languages", () => {
    const vars = (text: string) =>
      [...text.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort();
    const drifted = (Object.keys(en) as (keyof typeof en)[]).filter(
      (key) => vars(en[key]).join(",") !== vars(zh[key]).join(","),
    );
    expect(
      drifted,
      `${drifted.join(", ")} interpolate different variables`,
    ).toEqual([]);
  });

  it("actually translates", () => {
    expect(translate("zh", "tray.enable")).toBe("启用");
    expect(translate("en", "tray.enable")).toBe("Enable");
  });

  it("falls back to English then to the key itself", () => {
    expect(translate("en", "nav.save")).toBe("Save");
  });
});

describe("interpolation", () => {
  it("substitutes every occurrence", () => {
    expect(translate("en", "ledger.copyCount.other", { count: 4 })).toBe(
      "Copy to 4 days",
    );
    expect(translate("zh", "since.minutes", { minutes: 12 })).toBe(
      "距上次休息 12 分钟",
    );
  });

  it("leaves an unknown placeholder alone rather than printing undefined", () => {
    expect(translate("en", "notif.idleBody")).toBe("Away for {time}");
  });
});

describe("plural keys", () => {
  it("picks the singular only at one", () => {
    expect(pluralKey("ledger.copyCount", 1)).toBe("ledger.copyCount.one");
    expect(pluralKey("ledger.copyCount", 2)).toBe("ledger.copyCount.other");
    expect(pluralKey("ledger.copyCount", 0)).toBe("ledger.copyCount.other");
  });

  it("gives Chinese the same wording either way, as the language does", () => {
    expect(translate("zh", "ledger.copyCount.one", { count: 1 })).toBe(
      translate("zh", "ledger.copyCount.other", { count: 1 }),
    );
  });
});

describe("resolving the system language", () => {
  it("reads any zh tag as Chinese", () => {
    expect(localeFromTag("zh-CN")).toBe("zh");
    expect(localeFromTag("zh-Hant-TW")).toBe("zh");
    expect(localeFromTag("en-GB")).toBe("en");
    expect(localeFromTag(undefined)).toBe("en");
  });

  it("honours an explicit setting over the system tag", () => {
    expect(resolveLocale("en", "zh-CN")).toBe("en");
    expect(resolveLocale("zh", "en-US")).toBe("zh");
    expect(resolveLocale("system", "zh-CN")).toBe("zh");
  });
});
