import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent } from "@/components/ui/tabs";
import { useEffect, useMemo, useState } from "react";
import {
  NotificationType,
  Settings,
  SoundType,
  TrayTextMode,
} from "../../types/settings";
import { useSetLanguage, useT } from "../i18n";
import { BreakPalette, deriveVeil } from "../../types/palettes";
import { toast } from "../toaster";
import AdvancedCard from "./settings/advanced-card";
import AudioCard from "./settings/audio-card";
import { IconGlobe, IconWeek } from "./icons";
import PageHead from "./settings/page-head";
import VeilCard from "./settings/veil-card";
import BreaksCard from "./settings/breaks-card";
import SettingsSection from "./settings/settings-section";
import SettingsRail, { SCROLL_ID } from "./settings/settings-rail";
import SkipCard from "./settings/skip-card";
import SmartBreaksCard from "./settings/smart-breaks-card";
import SnoozeCard from "./settings/snooze-card";
import StartupCard from "./settings/startup-card";
import BreakScreenCard from "./settings/break-screen-card";
import TrayCard from "./settings/tray-card";
import WorkingHoursSettings from "./settings/working-hours";
import WelcomeModal from "./welcome-modal";

export default function SettingsEl() {
  const [settingsDraft, setSettingsDraft] = useState<Settings | null>(null);
  const [settings, setSettings] = useState<Settings | null>(null);
  const [showWelcomeModal, setShowWelcomeModal] = useState(false);
  const [activeGroup, setActiveGroup] = useState("break-settings");

  const t = useT();
  const setLanguage = useSetLanguage();

  useEffect(() => {
    (async () => {
      const settings = (await ipcRenderer.invokeGetSettings()) as Settings;
      setSettingsDraft(settings);
      setSettings(settings);

      // Check if this is the first time running the app
      const appInitialized = await ipcRenderer.invokeGetAppInitialized();
      setShowWelcomeModal(!appInitialized);
    })();
  }, []);

  const dirty = useMemo(() => {
    return JSON.stringify(settingsDraft) !== JSON.stringify(settings);
  }, [settings, settingsDraft]);

  if (settings === null || settingsDraft === null) {
    return null;
  }

  const handleNotificationTypeChange = (value: string): void => {
    const notificationType = value as NotificationType;
    setSettingsDraft({ ...settingsDraft, notificationType });
  };

  const handleDateChange = (fieldName: string, newVal: Date): void => {
    const seconds =
      newVal.getHours() * 3600 + newVal.getMinutes() * 60 + newVal.getSeconds();

    let secondsField: keyof Settings;
    if (fieldName === "breakFrequency") {
      secondsField = "breakFrequencySeconds";
    } else if (fieldName === "breakLength") {
      secondsField = "breakLengthSeconds";
    } else if (fieldName === "postponeLength") {
      secondsField = "postponeLengthSeconds";
    } else if (fieldName === "idleResetLength") {
      secondsField = "idleResetLengthSeconds";
    } else {
      return;
    }

    setSettingsDraft({
      ...settingsDraft,
      [secondsField]: seconds,
    });
  };

  const handlePostponeLimitChange = (value: string): void => {
    const postponeLimit = Number(value);
    setSettingsDraft({ ...settingsDraft, postponeLimit });
  };

  const handleTextChange = (
    field: string,
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ): void => {
    setSettingsDraft({
      ...settingsDraft,
      [field]: e.target.value,
    });
  };

  const handleSwitchChange = (field: string, checked: boolean): void => {
    setSettingsDraft({
      ...settingsDraft,
      [field]: checked,
    });
  };

  const handleSliderChange = (
    field: keyof Settings,
    values: number[],
  ): void => {
    setSettingsDraft({
      ...settingsDraft,
      [field]: values[0],
    });
  };

  const handleSoundTypeChange = (soundType: SoundType): void => {
    setSettingsDraft({
      ...settingsDraft,
      soundType,
    });
  };

  const handleTrayTextModeChange = (value: string): void => {
    if (value === "hidden") {
      setSettingsDraft({
        ...settingsDraft,
        trayTextEnabled: false,
      });
      return;
    }

    setSettingsDraft({
      ...settingsDraft,
      trayTextEnabled: true,
      trayTextMode: value as TrayTextMode,
    });
  };

  const handleColorChange = (
    field: "backgroundColor" | "textColor",
    value: string,
  ): void => {
    setSettingsDraft({
      ...settingsDraft,
      [field]: value,
      ...(field === "backgroundColor" ? { veilColor: deriveVeil(value) } : {}),
    });
  };

  const handlePaletteChange = (palette: BreakPalette): void => {
    setSettingsDraft({
      ...settingsDraft,
      backgroundColor: palette.background,
      textColor: palette.text,
      veilColor: palette.veil,
    });
  };

  const handleLanguageChange = (value: string): void => {
    const language = value as Settings["language"];
    setSettingsDraft({ ...settingsDraft, language });
    setLanguage(language);
  };

  const handleSave = async () => {
    await ipcRenderer.invokeSetSettings(settingsDraft);
    toast(t("toast.saved"));
    setSettings(settingsDraft);
  };

  return (
    <div className="flex h-screen w-full bg-background">
      <Tabs
        value={activeGroup}
        onValueChange={setActiveGroup}
        orientation="vertical"
        className="flex h-full w-full flex-row"
      >
        <SettingsRail
          activeGroup={activeGroup}
          showSave={dirty}
          onSave={handleSave}
        />
        <div id={SCROLL_ID} className="min-h-0 flex-1 overflow-auto px-9 py-8">
          <TabsContent
            value="break-settings"
            className="stagger m-0 space-y-10"
          >
            <PageHead
              index={1}
              labelKey="nav.general"
              titleKey="page.general.title"
              ledeKey="page.general.lede"
            />

            <BreaksCard
              settingsDraft={settingsDraft}
              onNotificationTypeChange={handleNotificationTypeChange}
              onDateChange={handleDateChange}
              onTextChange={handleTextChange}
              onSwitchChange={handleSwitchChange}
            />

            <SmartBreaksCard
              settingsDraft={settingsDraft}
              onSwitchChange={handleSwitchChange}
              onDateChange={handleDateChange}
            />

            <SnoozeCard
              settingsDraft={settingsDraft}
              onSwitchChange={handleSwitchChange}
              onDateChange={handleDateChange}
              onPostponeLimitChange={handlePostponeLimitChange}
            />

            <SkipCard
              settingsDraft={settingsDraft}
              onSwitchChange={handleSwitchChange}
            />

            <AdvancedCard
              settingsDraft={settingsDraft}
              onSwitchChange={handleSwitchChange}
            />
          </TabsContent>

          <TabsContent value="working-hours" className="stagger m-0">
            <PageHead
              index={2}
              labelKey="nav.hours"
              titleKey="page.hours.title"
              ledeKey="page.hours.lede"
            />

            <SettingsSection
              id="sec-hours"
              icon={<IconWeek size={19} />}
              title={t("sec.hours.title")}
              toggle={{
                checked: settingsDraft.workingHoursEnabled,
                onCheckedChange: (checked) =>
                  handleSwitchChange("workingHoursEnabled", checked),
                disabled: !settingsDraft.breaksEnabled,
              }}
            >
              <WorkingHoursSettings
                settingsDraft={settingsDraft}
                setSettingsDraft={setSettingsDraft}
              />
            </SettingsSection>
          </TabsContent>

          <TabsContent value="customization" className="stagger m-0 space-y-10">
            <PageHead
              index={3}
              labelKey="nav.customization"
              titleKey="page.customization.title"
              ledeKey="page.customization.lede"
            />

            <BreakScreenCard
              settingsDraft={settingsDraft}
              onPaletteChange={handlePaletteChange}
              onColorChange={handleColorChange}
            />

            <VeilCard
              settingsDraft={settingsDraft}
              onSwitchChange={handleSwitchChange}
              onSliderChange={handleSliderChange}
            />

            <AudioCard
              settingsDraft={settingsDraft}
              onSoundTypeChange={handleSoundTypeChange}
              onSliderChange={handleSliderChange}
            />
          </TabsContent>

          {processEnv.SNAP === undefined && (
            <TabsContent value="system" className="stagger m-0 space-y-10">
              <PageHead
                index={4}
                labelKey="nav.system"
                titleKey="page.system.title"
                ledeKey="page.system.lede"
              />

              <SettingsSection
                id="sec-language"
                icon={<IconGlobe size={19} />}
                title={t("sec.language.title")}
                helperText={t("sec.language.helper")}
              >
                <Select
                  value={settingsDraft.language}
                  onValueChange={handleLanguageChange}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="system">{t("lang.system")}</SelectItem>
                    <SelectItem value="en">{t("lang.en")}</SelectItem>
                    <SelectItem value="zh">{t("lang.zh")}</SelectItem>
                  </SelectContent>
                </Select>
              </SettingsSection>

              <StartupCard
                settingsDraft={settingsDraft}
                onSwitchChange={handleSwitchChange}
              />
              {processPlatform === "darwin" && (
                <TrayCard
                  settingsDraft={settingsDraft}
                  onSwitchChange={handleSwitchChange}
                  onTrayTextModeChange={handleTrayTextModeChange}
                />
              )}
            </TabsContent>
          )}
        </div>
      </Tabs>
      <WelcomeModal
        open={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  );
}
