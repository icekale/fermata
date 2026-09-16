/* ---------------------------------------------------------------------------
   English messages.

   Flat dotted keys, one file per locale, no library. The app ships ~120
   strings across two processes; i18next would be a dependency, a provider, a
   plugin chain and a namespace convention to carry the same 120 strings, and
   the main process (tray menu, OS notifications) would need its own instance of
   all of it anyway. `translate()` below is 20 lines and both processes call it.
   ------------------------------------------------------------------------ */

export const en = {
  /* --- navigation ------------------------------------------------------- */
  "nav.general": "Breaks",
  "nav.hours": "Hours",
  "nav.customization": "Look",
  "nav.system": "System",
  "nav.save": "Save",
  "nav.revert": "Revert",
  "nav.saved": "All changes saved",
  "trayPanel.next": "Next break",
  "trayPanel.outside": "Outside hours",
  "trayPanel.inside": "On hours",
  "trayPanel.since": "Since last",
  "trayPanel.sinceShort": "Since",
  "trayPanel.start": "Break now",
  "trayPanel.pause": "Pause",
  "trayPanel.resume": "Resume",
  "trayPanel.settings": "Settings",
  "trayPanel.onBreak": "On a break",
  "trayPanel.at": "at {time}",
  "trayPanel.last": "at {time}",
  "trayPanel.fullscreen": "Full screen",
  "trayPanel.notify": "Notification",
  "trayPanel.freqShort": "Freq",
  "trayPanel.lenShort": "Len",
  "trayPanel.modeSheet": "Popup",
  "trayPanel.modeNotify": "Notify",
  "trayPanel.noHours": "No hours today",
  "trayPanel.resumesAt": "Resumes at {time}",
  "trayPanel.noMoreToday": "No more breaks today",
  "status.running": "Running",
  "status.paused": "Paused",
  "health.label": "Cadence",
  "health.ok": "On track",
  "health.off": "Paused",
  "health.break": "a {length} break",

  /* --- sections --------------------------------------------------------- */
  "sec.breaks.title": "Breaks",
  "sec.breaks.helper":
    "How often a break arrives, how long it lasts, and what it says when it does.",
  "sec.smart.title": "Smart Breaks",
  "sec.smart.helper":
    "Automatically detect natural breaks and reset the break timer.",
  "sec.snooze.title": "Snooze",
  "sec.snooze.helper": "Snoozing allows you to postpone breaks when busy.",
  "sec.skip.title": "Skip",
  "sec.skip.helper":
    "Allow skipping breaks entirely without rescheduling them.",
  "sec.skip.switch": "Skip",
  "sec.advanced.title": "Advanced",
  "sec.advanced.startImmediately": "Immediately start breaks",
  "sec.advanced.endEarly": "Allow ending a break early",
  "sec.hours.title": "Working Hours",
  "sec.hours.helper":
    "Only show breaks during your configured work schedule. Drag a band to move it, or click one to set exact times.",
  "sec.screen.title": "Break Screen",
  "sec.screen.helper": "The sheet that fills the screen when a break starts.",
  "sec.veil.title": "Veil",
  "sec.veil.helper":
    "Drop a veil over the whole screen behind a break so the rest of the desktop stops competing for attention.",
  "sec.veil.strength": "Strength",
  "sec.audio.title": "Audio",
  "sec.audio.helper":
    "A tone at each end of the break, so you do not have to be looking at the screen.",
  "sec.audio.sound": "Break sound",
  "sec.audio.volume": "Volume",
  "sec.audio.silent": "Silent",
  "sec.audio.full": "Full",
  "sec.startup.title": "Start at login",
  "sec.startup.helper":
    "Automatically start Fermata when you log into your computer.",
  "sec.tray.title": "Menu Bar Text",
  "sec.tray.helper": "Show timing information next to the menu bar icon.",
  "sec.tray.next": "Time to next break",
  "sec.tray.since": "Time since last break",
  "sec.language.title": "Language",
  "sec.language.helper":
    "The language of this window, the menu bar menu, and notifications.",

  /* --- fields ----------------------------------------------------------- */
  "field.frequency": "Frequency",
  "field.length": "Length",
  "field.limit": "Limit",
  "field.type": "Type",
  "field.title": "Title",
  "field.message": "Message",
  "field.messageHint": "One line per thought",
  "break.defaultTitle": "Time for a break.",
  "break.defaultMessage":
    "Rest your eyes.\nStretch your legs.\nBreathe. Relax.",
  "field.messagePlaceholder": "Enter your break message...",
  "field.idleMinimum": "Minimum idle time",
  "field.notifyOnIdle": "Tell me when a break is detected automatically",
  "field.popup": "Popup break",
  "field.notification": "Simple notification",
  "field.noLimit": "No limit",
  "field.customSheet": "Custom sheet",
  "field.custom": "Custom",
  "field.sheet": "Sheet",
  "field.ink": "Text ink",

  /* --- the week ledger -------------------------------------------------- */
  "ledger.now": "now",
  "ledger.drag": "Drag a shift to move it",
  "ledger.click": "Click to set exact times",
  "ledger.shiftLabel": "{day} shift, {from} to {to}",
  "ledger.dayToggle": "{day} breaks",
  "ledger.shift": "Shift",
  "ledger.shiftFrom": "From",
  "ledger.shiftUntil": "Until",
  "ledger.addShift": "Add shift",
  "ledger.remove": "Remove",
  "ledger.copyTo": "Copy this shift to",
  "ledger.copyCount.one": "Copy to {count} day",
  "ledger.copyCount.other": "Copy to {count} days",

  /* --- days ------------------------------------------------------------- */
  "day.mon": "Mon",
  "day.tue": "Tue",
  "day.wed": "Wed",
  "day.thu": "Thu",
  "day.fri": "Fri",
  "day.sat": "Sat",
  "day.sun": "Sun",
  "day.monday": "Monday",
  "day.tuesday": "Tuesday",
  "day.wednesday": "Wednesday",
  "day.thursday": "Thursday",
  "day.friday": "Friday",
  "day.saturday": "Saturday",
  "day.sunday": "Sunday",

  /* --- sounds ----------------------------------------------------------- */
  "sound.none": "None",
  "sound.gong": "Gong",
  "sound.blip": "Blip",
  "sound.bloop": "Bloop",
  "sound.ping": "Ping",
  "sound.scifi": "Sci-fi",
  "sound.preview": "Preview this sound",

  /* --- break screen palettes -------------------------------------------- */
  "palette.paper": "Paper",
  "palette.ink": "Ink",
  "palette.midnight": "Midnight",
  "palette.moss": "Moss",
  "palette.clay": "Clay",
  "palette.plum": "Plum",
  "palette.contrastLow":
    "Contrast is {ratio}:1. Below 4.5:1 the countdown gets hard to read on a bright monitor — pick a darker ink or a lighter sheet.",
  "palette.contrastOk": "Contrast is {ratio}:1. Veil set to {veil}.",

  /* --- the notice ------------------------------------------------------- */
  "notice.eyebrow.grace": "Break",
  "notice.eyebrow.countdown": "Break starting in",
  "notice.grace": "Start your break when ready…",
  "notice.progress": "Time until the break starts",
  "notice.start": "Start",
  "notice.snooze": "Snooze",
  "notice.skip": "Skip",

  /* --- the break sheet -------------------------------------------------- */
  "break.eyebrow": "Break",
  "break.ends": "Ends {time}",
  "break.cancel": "Cancel Break",
  "break.end": "End Break",
  "break.done": "✓ Break complete",
  "break.progress": "Break progress",

  /* --- time since ------------------------------------------------------- */
  "since.hours": "{hours}h {minutes}m since last break",
  "since.hoursShort": "{hours}h since last break",
  "since.minutes": "{minutes}m since last break",
  "since.seconds": "Less than 1m since last break",

  /* --- first run -------------------------------------------------------- */
  "welcome.eyebrow": "Welcome",
  "welcome.title": "Fermata runs in the background",
  "welcome.body":
    "It lives in your menu bar — pause, take a break, or open Settings from there.",
  "welcome.body.tray":
    "It lives in your system tray — pause, take a break, or open Settings from there.",
  "welcome.cta": "Get started",

  /* --- unit letters in the time fields ---------------------------------- */
  "unit.h": "h",
  "unit.m": "m",
  "unit.s": "s",

  /* --- toasts ----------------------------------------------------------- */
  "toast.saved": "Settings saved",

  /* --- tray menu and notifications (main process) ----------------------- */
  "tray.nextBreak.one": "Next break in 1 minute",
  "tray.nextBreak.other": "Next break in {minutes} minutes",
  "tray.nextBreak.less": "Next break in less than a minute",
  "tray.disabledFor": "Disabled for {time}",
  "tray.outsideHours": "Outside of working hours",
  "tray.idle": "Idle",
  "tray.enable": "Enable",
  "tray.disable": "Disable...",
  "tray.indefinitely": "Indefinitely",
  "tray.minutes30": "30 minutes",
  "tray.hour1": "1 hour",
  "tray.hour2": "2 hours",
  "tray.hour4": "4 hours",
  "tray.restOfDay": "Rest of day",
  "tray.startNow": "Start break now",
  "tray.settings": "Settings...",
  "tray.about": "About...",
  "tray.quit": "Quit",
  "tray.aboutTitle": "About",
  "tray.aboutBody":
    "A break timer that holds the note, then lets you continue.\n\nBased on BreakTimer by Tom James Watson:\nhttps://github.com/tom-james-watson/breaktimer-app\n\nDistributed under the GPL-3.0-or-later license.",
  "notif.breakTitle": "Time for a break!",
  "notif.idleTitle": "Break automatically detected",
  "notif.idleBody": "Away for {time}",
  "notif.updateTitle": "Update Available",
  "notif.updateBody":
    "A new version of Fermata is available. Click to download.",

  /* --- language names --------------------------------------------------- */
  "lang.system": "Same as system",
  "lang.en": "English",
  "lang.zh": "简体中文",
} as const;

export type MessageKey = keyof typeof en;
