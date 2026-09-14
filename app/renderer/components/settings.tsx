import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
import HealthPane from "./settings/health-pane";
import VeilCard from "./settings/veil-card";
import BreaksCard from "./settings/breaks-card";
import SettingsSection from "./settings/settings-section";
import MoleNav from "./settings/mole-nav";
import { SCROLL_ID } from "./settings/nav";
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
    return (
      <div className="flex h-screen w-full items-center justify-center bg-background text-muted-foreground">
        Fermata
      </div>
    );
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

  /* Language is staged like every other setting: it takes effect on Save, so
     the draft model stays true — closing the window without saving has never
     silently committed anything, including this. */
  const handleLanguageChange = (value: string): void => {
    const language = value as Settings["language"];
    setSettingsDraft({ ...settingsDraft, language });
  };

  const handleSave = async () => {
    await ipcRenderer.invokeSetSettings(settingsDraft);
    toast(t("toast.saved"));
    setSettings(settingsDraft);
    setLanguage(settingsDraft.language);
  };

  const handleRevert = () => {
    setSettingsDraft(settings);
  };

  return (
    <div className="flex h-screen w-full flex-col overflow-hidden bg-background select-none">
      <h1 className="sr-only">Fermata</h1>
      <Tabs
        value={activeGroup}
        onValueChange={setActiveGroup}
        className="flex h-full min-h-0 flex-col"
      >
        <MoleNav
          showSave={dirty}
          onSave={handleSave}
          onRevert={handleRevert}
          breaksEnabled={settingsDraft.breaksEnabled}
        />
        <div
          id={SCROLL_ID}
          className="flex-1 min-h-0 overflow-y-auto px-5 py-4"
        >
          <div className="mx-auto w-full max-w-[1100px]">
            <TabsContent
              value="break-settings"
              className="stagger m-0 space-y-3"
            >
              <div className="grid grid-cols-1 gap-3">
                <HealthPane
                  settingsDraft={settingsDraft}
                  onSwitchChange={handleSwitchChange}
                />
                <BreaksCard
                  settingsDraft={settingsDraft}
                  onNotificationTypeChange={handleNotificationTypeChange}
                  onDateChange={handleDateChange}
                />
              </div>
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                <div className="tile min-h-0" id="sec-breaks">
                  <p className="tile-label">{t("field.title")}</p>
                  <Input
                    className="mt-3"
                    id="break-title"
                    value={settingsDraft.breakTitle}
                    placeholder={t("break.defaultTitle")}
                    onChange={handleTextChange.bind(null, "breakTitle")}
                    disabled={settingsDraft.breaksEnabled === false}
                  />
                </div>
                <div className="tile min-h-0">
                  <p className="tile-label">{t("field.message")}</p>
                  <Textarea
                    className="mt-3 resize-none"
                    id="break-message"
                    rows={2}
                    value={settingsDraft.breakMessage}
                    onChange={handleTextChange.bind(null, "breakMessage")}
                    disabled={settingsDraft.breaksEnabled === false}
                    placeholder={t("field.messagePlaceholder")}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
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
              </div>

              <AdvancedCard
                settingsDraft={settingsDraft}
                onSwitchChange={handleSwitchChange}
              />
            </TabsContent>

            <TabsContent
              value="working-hours"
              className="stagger m-0 space-y-3"
            >
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

            <TabsContent
              value="customization"
              className="stagger m-0 space-y-3"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
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
              </div>

              <AudioCard
                settingsDraft={settingsDraft}
                onSoundTypeChange={handleSoundTypeChange}
                onSliderChange={handleSliderChange}
              />
            </TabsContent>

            {processEnv.SNAP === undefined && (
              <TabsContent value="system" className="stagger m-0 space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <StartupCard
                    settingsDraft={settingsDraft}
                    onSwitchChange={handleSwitchChange}
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
                        <SelectItem value="system">
                          {t("lang.system")}
                        </SelectItem>
                        <SelectItem value="en">{t("lang.en")}</SelectItem>
                        <SelectItem value="zh">{t("lang.zh")}</SelectItem>
                      </SelectContent>
                    </Select>
                  </SettingsSection>
                </div>

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
        </div>
      </Tabs>
      <WelcomeModal
        open={showWelcomeModal}
        onClose={() => setShowWelcomeModal(false)}
      />
    </div>
  );
}
