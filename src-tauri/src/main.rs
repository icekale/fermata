#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/* Fermata's Tauri core: the Electron main process ported to Rust, phase 1.
   In: settings store, cadence scheduling with working hours, tray + menu,
   popover, settings window, single-display popup breaks. Out (phase 2):
   multi-display break windows, idle detection, postpone limits, sounds. */

use chrono::{Datelike, Local, Timelike};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::tray::{TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, LogicalSize, Manager, State, WebviewUrl, WebviewWindowBuilder};
use tauri_plugin_autostart::ManagerExt;
use tauri_plugin_notification::NotificationExt;

mod overlay;

/* ------------------------------------------------------------------ */
/* Settings — serde mirror of app/types/settings.ts, defaults included */
/* ------------------------------------------------------------------ */

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct WorkingHoursRange {
    pub from_minutes: u32,
    pub to_minutes: u32,
}

#[derive(Serialize, Deserialize, Clone, Default)]
#[serde(rename_all = "camelCase", default)]
pub struct WorkingHours {
    pub enabled: bool,
    pub ranges: Vec<WorkingHoursRange>,
}

#[derive(Serialize, Deserialize, Clone)]
#[serde(rename_all = "camelCase", default)]
pub struct Settings {
    pub language: String,
    pub auto_launch: bool,
    pub breaks_enabled: bool,
    pub tray_text_enabled: bool,
    pub tray_text_mode: String,
    pub notification_type: String,
    pub break_frequency_seconds: u32,
    pub break_length_seconds: u32,
    pub postpone_length_seconds: u32,
    pub postpone_limit: u32,
    pub working_hours_enabled: bool,
    pub working_hours_monday: WorkingHours,
    pub working_hours_tuesday: WorkingHours,
    pub working_hours_wednesday: WorkingHours,
    pub working_hours_thursday: WorkingHours,
    pub working_hours_friday: WorkingHours,
    pub working_hours_saturday: WorkingHours,
    pub working_hours_sunday: WorkingHours,
    pub idle_reset_enabled: bool,
    pub idle_reset_length_seconds: u32,
    pub idle_reset_notification: bool,
    pub sound_type: String,
    pub break_sound_volume: f64,
    pub break_title: String,
    pub break_message: String,
    pub background_color: String,
    pub text_color: String,
    pub veil_color: String,
    pub show_backdrop: bool,
    pub backdrop_opacity: f64,
    pub end_break_enabled: bool,
    pub skip_break_enabled: bool,
    pub postpone_break_enabled: bool,
    pub immediately_start_breaks: bool,
}

fn default_range() -> WorkingHoursRange {
    WorkingHoursRange { from_minutes: 540, to_minutes: 1080 }
}

fn default_day(enabled: bool) -> WorkingHours {
    WorkingHours { enabled, ranges: vec![default_range()] }
}

impl Default for Settings {
    fn default() -> Self {
        Self {
            language: "system".into(),
            auto_launch: true,
            breaks_enabled: true,
            tray_text_enabled: true,
            tray_text_mode: "TIME_TO_NEXT_BREAK".into(),
            notification_type: "POPUP".into(),
            break_frequency_seconds: 28 * 60,
            break_length_seconds: 2 * 60,
            postpone_length_seconds: 3 * 60,
            postpone_limit: 0,
            working_hours_enabled: true,
            working_hours_monday: default_day(true),
            working_hours_tuesday: default_day(true),
            working_hours_wednesday: default_day(true),
            working_hours_thursday: default_day(true),
            working_hours_friday: default_day(true),
            working_hours_saturday: default_day(false),
            working_hours_sunday: default_day(false),
            idle_reset_enabled: true,
            idle_reset_length_seconds: 5 * 60,
            idle_reset_notification: false,
            sound_type: "GONG".into(),
            break_sound_volume: 1.0,
            break_title: String::new(),
            break_message: String::new(),
            background_color: "#2a241c".into(),
            text_color: "#e8ca8d".into(),
            veil_color: "#14110c".into(),
            show_backdrop: true,
            backdrop_opacity: 0.7,
            end_break_enabled: true,
            skip_break_enabled: false,
            postpone_break_enabled: true,
            immediately_start_breaks: false,
        }
    }
}

fn day_for(s: &Settings, weekday: u32) -> &WorkingHours {
    match weekday {
        0 => &s.working_hours_sunday,
        1 => &s.working_hours_monday,
        2 => &s.working_hours_tuesday,
        3 => &s.working_hours_wednesday,
        4 => &s.working_hours_thursday,
        5 => &s.working_hours_friday,
        _ => &s.working_hours_saturday,
    }
}

fn in_working_hours(s: &Settings, now: chrono::DateTime<Local>) -> bool {
    if !s.working_hours_enabled {
        return true;
    }
    let minutes = now.hour() * 60 + now.minute();
    let day = day_for(s, now.weekday().num_days_from_sunday());
    overlay::day_accepts_breaks(
        day.enabled,
        &day.ranges
            .iter()
            .map(|r| (r.from_minutes, r.to_minutes))
            .collect::<Vec<_>>(),
        minutes,
    )
}

fn today_window(s: &Settings) -> (Option<i64>, Option<i64>) {
    if !s.working_hours_enabled {
        return (None, None);
    }
    let today = day_for(s, Local::now().weekday().num_days_from_sunday());
    match today.ranges.first() {
        Some(r) if today.enabled => (Some(r.from_minutes as i64), Some(r.to_minutes as i64)),
        _ => (None, None),
    }
}

/* The next instant the working window begins, across days — the popover's
   at-rest hero counts down to it. */
fn next_window_open_at(s: &Settings) -> Option<i64> {
    if !s.working_hours_enabled {
        return None;
    }
    let now = Local::now();
    let now_minutes = (now.hour() * 60 + now.minute()) as i64;
    for offset in 0..8i64 {
        let day =
            day_for(s, (now.weekday().num_days_from_sunday() as i64 + offset) as u32 % 7);
        if !day.enabled {
            continue;
        }
        let start = day
            .ranges
            .iter()
            .map(|r| r.from_minutes as i64)
            .filter(|from| offset > 0 || *from > now_minutes)
            .min();
        let from = match start {
            Some(f) => f,
            None => continue,
        };
        return Some(
            now.timestamp_millis() + offset * 86_400_000
                + (from - now_minutes) * 60_000
                - now.timestamp_subsec_millis() as i64,
        );
    }
    None
}

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

struct AppState {
    settings: Mutex<Settings>,
    next_break_at: Mutex<Option<i64>>,
    break_end_at: Mutex<Option<i64>>,
    last_break_at: Mutex<Option<i64>>,
    having_break: Mutex<bool>,
    initialized: Mutex<bool>,
    /* Notice shown for the pending break (its windows are open). */
    notice_shown: Mutex<bool>,
    /* Smart Breaks: an over-threshold idle was already counted as a rest. */
    idle_counted: Mutex<bool>,
    /* Snoozes since the last taken break, against postponeLimit. */
    postpone_count: Mutex<u32>,
    /* Break-now started this break; fresh break windows must skip the
       notice slip and go straight to the sheet. */
    started_from_tray: Mutex<bool>,
}

#[derive(serde::Serialize)]
#[serde(rename_all = "camelCase")]
struct TrayStatus {
    enabled: bool,
    having_break: bool,
    in_working_hours: bool,
    next_break_at: Option<i64>,
    since_last_break_seconds: Option<i64>,
    frequency_seconds: u32,
    length_seconds: u32,
    today_from_minutes: Option<i64>,
    today_to_minutes: Option<i64>,
    next_window_open_at: Option<i64>,
    popup: bool,
}

/* ------------------------------------------------------------------ */
/* Persistence                                                         */
/* ------------------------------------------------------------------ */

fn config_file(app: &tauri::AppHandle, name: &str) -> std::path::PathBuf {
    let dir = app.path().app_config_dir().expect("config dir");
    std::fs::create_dir_all(&dir).ok();
    dir.join(name)
}

fn load_state(app: &tauri::AppHandle) -> AppState {
    let settings = std::fs::read(config_file(app, "settings.json"))
        .ok()
        .and_then(|b| serde_json::from_slice::<Settings>(&b).ok())
        .unwrap_or_default();
    let initialized = config_file(app, "app.json").exists();
    AppState {
        settings: Mutex::new(settings),
        next_break_at: Mutex::new(None),
        break_end_at: Mutex::new(None),
        last_break_at: Mutex::new(None),
        having_break: Mutex::new(false),
        initialized: Mutex::new(initialized),
        notice_shown: Mutex::new(false),
        idle_counted: Mutex::new(false),
        postpone_count: Mutex::new(0),
        started_from_tray: Mutex::new(false),
    }
}

fn save_settings(app: &tauri::AppHandle, s: &Settings) {
    if let Ok(json) = serde_json::to_vec_pretty(s) {
        std::fs::write(config_file(app, "settings.json"), json).ok();
    }
}

fn is_zh(s: &Settings) -> bool {
    let tag = if s.language == "system" {
        sys_locale::get_locale().unwrap_or_else(|| "en".into())
    } else {
        s.language.clone()
    };
    tag.starts_with("zh")
}

/* OS notifications — the NOTIFICATION break mode and the Smart Breaks
   "away" ping. Strings mirror app/i18n. */
struct NotifStrings {
    break_title: &'static str,
    done_title: &'static str,
    idle_title: &'static str,
    idle_body: &'static str,
}

fn notif_strings(s: &Settings) -> NotifStrings {
    if is_zh(s) {
        NotifStrings {
            break_title: "该休息了！",
            done_title: "✓ 休息完成",
            idle_title: "检测到你已经在休息",
            idle_body: "已离开",
        }
    } else {
        NotifStrings {
            break_title: "Time for a break!",
            done_title: "✓ Break complete",
            idle_title: "Break automatically detected",
            idle_body: "Away for",
        }
    }
}

fn send_notification(app: &tauri::AppHandle, _s: &Settings, title: &str, body: &str) {
    let _ = app.notification().builder().title(title).body(body).show();
}

fn fmt_hms(secs: u64) -> String {
    format!("{}:{:02}:{:02}", secs / 3600, (secs % 3600) / 60, secs % 60)
}

/* AppKit window and tray operations belong to the main thread. Calling them
   from a command or heartbeat thread is exactly what "Fermata 意外退出"
   was. Every mutation goes through here; fire-and-forget by design. */
fn on_main(app: &tauri::AppHandle, job: impl FnOnce() + Send + 'static) {
    let _ = app.run_on_main_thread(job);
}

/* System idle seconds. The CGEventSource call is the same thing
   powerMonitor.getSystemIdleTime wraps, straight over the FFI so no extra
   crate rides along. Windows uses GetLastInputInfo; Linux lands later. */
#[cfg(target_os = "macos")]
fn system_idle_secs() -> u64 {
    #[link(name = "CoreGraphics", kind = "framework")]
    extern "C" {
        /* CGEventType is a 32-bit enum; kCGAnyInputEventType = ~0u32. */
        fn CGEventSourceSecondsSinceLastEventType(state: i32, event_type: u32) -> f64;
    }
    /* kCGEventSourceStateHIDSystemState = 1, kCGAnyInputEventType = ~0u32 */
    unsafe { CGEventSourceSecondsSinceLastEventType(1, u32::MAX).max(0.0) as u64 }
}

#[cfg(target_os = "windows")]
fn system_idle_secs() -> u64 {
    #[repr(C)]
    struct LastInputInfo {
        cb_size: u32,
        dw_time: u32,
    }
    #[link(name = "user32")]
    extern "system" {
        fn GetLastInputInfo(info: *mut LastInputInfo) -> i32;
    }
    #[link(name = "kernel32")]
    extern "system" {
        fn GetTickCount() -> u32;
    }
    unsafe {
        let mut info = LastInputInfo { cb_size: 8, dw_time: 0 };
        if GetLastInputInfo(&mut info) == 0 {
            return 0;
        }
        (GetTickCount().wrapping_sub(info.dw_time) / 1000) as u64
    }
}

#[cfg(not(any(target_os = "macos", target_os = "windows")))]
fn system_idle_secs() -> u64 {
    /* Linux: phase 4 (X11 screensaver extension). Smart Breaks stays off
       there until then — the timer itself is unaffected. */
    0
}

/* One line per event into the config dir, so an incident report has
   something to stand on. */
fn log_line(app: &tauri::AppHandle, msg: &str) {
    let mut file = std::fs::OpenOptions::new()
        .create(true)
        .append(true)
        .open(config_file(app, "fermata.log"))
        .ok();
    if let Some(file) = file.as_mut() {
        use std::io::Write;
        let _ = writeln!(
            file,
            "[{}] {}",
            Local::now().format("%m-%d %H:%M:%S"),
            msg
        );
    }
}

/* ------------------------------------------------------------------ */
/* Break flow                                                          */
/* ------------------------------------------------------------------ */

const NOTICE_LEAD_MS: i64 = 120_000;

fn break_windows(app: &tauri::AppHandle) -> Vec<tauri::WebviewWindow> {
    let mut wins: Vec<tauri::WebviewWindow> = app
        .webview_windows()
        .into_iter()
        .filter(|(label, _)| label.starts_with("break"))
        .map(|(_, win)| win)
        .collect();
    wins.sort_by_key(|w| w.label().to_string());
    wins
}

/* Break windows are PERSISTENT: created on first use, hidden at the end of
   every break, shown again for the next one. They are never closed and
   never destroyed. They also never enter a native fullscreen Space —
   hide() on that Space is swallowed by macOS and leaves a black takeover. */
fn layout_notice_window(win: &tauri::WebviewWindow, monitor: &tauri::Monitor) {
    let pos = monitor.position();
    let size = monitor.size();
    let rect = overlay::notice_rect(pos.x as f64, pos.y as f64, size.width as f64);
    let _ = win.set_fullscreen(overlay::USE_NATIVE_FULLSCREEN);
    let _ = win.set_decorations(false);
    let _ = win.set_size(LogicalSize::new(rect.width, rect.height));
    let _ = win.set_position(tauri::PhysicalPosition::new(rect.x as i32, rect.y as i32));
}

fn layout_break_window(
    win: &tauri::WebviewWindow,
    monitor: &tauri::Monitor,
    show_backdrop: bool,
) {
    let pos = monitor.position();
    let size = monitor.size();
    let _ = win.set_fullscreen(overlay::USE_NATIVE_FULLSCREEN);
    let _ = win.set_decorations(false);
    if show_backdrop {
        let _ = win.set_position(tauri::PhysicalPosition::new(pos.x, pos.y));
        let _ = win.set_size(tauri::PhysicalSize::new(size.width, size.height));
        return;
    }
    let rect = overlay::break_rect(
        false,
        pos.x as f64,
        pos.y as f64,
        size.width as f64,
        size.height as f64,
    );
    let _ = win.set_size(LogicalSize::new(rect.width, rect.height));
    let _ = win.set_position(tauri::PhysicalPosition::new(rect.x as i32, rect.y as i32));
}

fn park_break_windows_on_main(handle: &tauri::AppHandle) -> bool {
    let monitors = handle.available_monitors().unwrap_or_default();
    let wins = break_windows(handle);
    let mut was_fullscreen = false;
    for (i, win) in wins.into_iter().enumerate() {
        if win.is_fullscreen().unwrap_or(false) {
            was_fullscreen = true;
        }
        let _ = win.hide();
        if let Some(monitor) = monitors.get(i) {
            layout_notice_window(&win, monitor);
        } else {
            let _ = win.set_fullscreen(overlay::USE_NATIVE_FULLSCREEN);
            let _ = win.set_decorations(false);
        }
    }
    was_fullscreen
}

fn close_break_windows(app: &tauri::AppHandle) {
    let handle = app.clone();
    on_main(app, move || {
        let was_fullscreen = park_break_windows_on_main(&handle);
        log_line(
            &handle,
            &format!("break windows parked fullscreen_was={was_fullscreen}"),
        );
        for delay_ms in overlay::rehide_delays_ms(was_fullscreen) {
            let delay_ms = *delay_ms;
            let h2 = handle.clone();
            let h3 = handle.clone();
            std::thread::spawn(move || {
                std::thread::sleep(std::time::Duration::from_millis(delay_ms));
                let _ = h2.run_on_main_thread(move || {
                    for win in break_windows(&h3) {
                        let _ = win.hide();
                    }
                    log_line(&h3, &format!("break windows re-hidden (+{delay_ms}ms)"));
                });
            });
        }
    });
}

/* The notice slip: one small window per display, top-centre. When full is
   true (Break now), the windows come straight up at their monitor's size —
   there is no notice phase to sit through. */
fn ensure_break_windows(app: &tauri::AppHandle, full: bool) {
    let monitors = match app.available_monitors() {
        Ok(m) => m,
        Err(_) => return,
    };
    for (i, monitor) in monitors.iter().enumerate() {
        let label = format!("break-{i}");
        if app.get_webview_window(&label).is_some() {
            continue;
        }
        let pos = monitor.position();
        let size = monitor.size();
        let (w, h, x, y) = if full {
            (size.width as f64, size.height as f64, pos.x as f64, pos.y as f64)
        } else {
            let rect = overlay::notice_rect(pos.x as f64, pos.y as f64, size.width as f64);
            (rect.width, rect.height, rect.x, rect.y)
        };
        let win = WebviewWindowBuilder::new(
            app,
            label.clone(),
            WebviewUrl::App(format!("index.html?page=break&windowId={i}").into()),
        )
        .inner_size(w, h)
        .position(x, y)
        /* Always born hidden: the caller reveals (notice) or the reveal
           thread does (break). A hidden webview also loads its page and
           runs init ahead of time, so the break page appears instantly. */
        .visible(false)
        .decorations(false)
        .resizable(false)
        .always_on_top(true)
        .skip_taskbar(true);
        match win.build() {
            Ok(_) => log_line(
                app,
                &format!("window {label} created {w}x{h} at ({x},{y}) full={full}"),
            ),
            Err(err) => log_line(app, &format!("break window {label}: {err}")),
        }
    }
}

fn start_break(app: &tauri::AppHandle) {
    let (end_at, show_backdrop) = {
        let state = app.state::<AppState>();
        if *state.having_break.lock().unwrap() {
            return; /* The renderer's countdown and the heartbeat can race. */
        }
        let settings = state.settings.lock().unwrap();
        let length = settings.break_length_seconds as i64;
        let show_backdrop = settings.show_backdrop;
        drop(settings);
        let end_at = Local::now().timestamp_millis() + length * 1000;
        *state.break_end_at.lock().unwrap() = Some(end_at);
        *state.having_break.lock().unwrap() = true;
        *state.next_break_at.lock().unwrap() = None;
        *state.notice_shown.lock().unwrap() = false;
        *state.postpone_count.lock().unwrap() = 0;
        (end_at, show_backdrop)
    };
    log_line(app, "break start");

    /* Geometry is applied while hidden. No native fullscreen Space — a
       borderless always-on-top window covering the display is enough, and
       hide() then actually hides. Reveal only if the break is still on, so
       a cancel during the flip cannot be undone by this delayed show. */
    let handle = app.clone();
    on_main(app, move || {
        ensure_break_windows(&handle, false);
        let monitors = handle.available_monitors().unwrap_or_default();
        let mut count = 0usize;
        for (i, monitor) in monitors.iter().enumerate() {
            let label = format!("break-{i}");
            if let Some(win) = handle.get_webview_window(&label) {
                let _ = win.hide();
                layout_break_window(&win, monitor, show_backdrop);
                count += 1;
            }
        }
        let _ = handle.emit("BREAK_START", end_at);
        std::thread::spawn(move || {
            std::thread::sleep(std::time::Duration::from_millis(100));
            let h2 = handle.clone();
            let h3 = handle.clone();
            let _ = h2.run_on_main_thread(move || {
                let having = *h3.state::<AppState>().having_break.lock().unwrap();
                if !overlay::should_reveal_started_break(having) {
                    log_line(&h3, "skip reveal: break already ended");
                    return;
                }
                for i in 0..count {
                    if let Some(win) = h3.get_webview_window(&format!("break-{i}")) {
                        let _ = win.set_decorations(false);
                        let _ = win.show();
                    }
                }
                update_tray_title(&h3);
            });
        });
    });
}

fn end_break(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let was_having = {
        let mut having = state.having_break.lock().unwrap();
        if !*having {
            false
        } else {
            *having = false;
            true
        }
    };
    if !was_having {
        /* Esc (or a second cancel) after a failed hide must still park the
           windows. It must not reschedule a break that already ended. */
        drop(state);
        log_line(app, "break end (force hide)");
        close_break_windows(app);
        return;
    }
    *state.break_end_at.lock().unwrap() = None;
    *state.last_break_at.lock().unwrap() = Some(Local::now().timestamp_millis());
    *state.postpone_count.lock().unwrap() = 0;
    let freq = state.settings.lock().unwrap().break_frequency_seconds as i64;
    *state.next_break_at.lock().unwrap() = Some(Local::now().timestamp_millis() + freq * 1000);
    log_line(app, "break end");
    let _ = app.emit("BREAK_END", ());
    let n = notif_strings(&state.settings.lock().unwrap().clone());
    send_notification(
        app,
        &state.settings.lock().unwrap().clone(),
        n.done_title,
        "",
    );
    drop(state);
    close_break_windows(app);
    update_tray_title(app);
}

/* The schedule heartbeat: open the notice slip at T-2min, fire at T, end at
   the break's end, and let Smart Breaks credit over-threshold idling. */
fn tick(app: &tauri::AppHandle) {
    let due;
    let s = {
        let state = app.state::<AppState>();
        let guard = state.settings.lock().unwrap();
        guard.clone()
    };
    {
        let state = app.state::<AppState>();
        let now = Local::now().timestamp_millis();
        let having_break = *state.having_break.lock().unwrap();

        if having_break {
            let end = *state.break_end_at.lock().unwrap();
            if end.is_some_and(|e| now >= e) {
                drop(state);
                end_break(app);
            }
            return;
        }
        if !s.breaks_enabled || !in_working_hours(&s, Local::now()) {
            *state.next_break_at.lock().unwrap() = None;
            let was_shown = *state.notice_shown.lock().unwrap();
            *state.notice_shown.lock().unwrap() = false;
            drop(state);
            if was_shown {
                close_break_windows(app);
            }
            return;
        }

        /* Smart Breaks: idle past the threshold counts as the rest taken. */
        if s.idle_reset_enabled {
            let idle_secs = system_idle_secs();
            let threshold = s.idle_reset_length_seconds as u64;
            let mut counted = state.idle_counted.lock().unwrap();
            if idle_secs >= threshold && !*counted {
                *counted = true;
                *state.last_break_at.lock().unwrap() = Some(now);
                let mut next = state.next_break_at.lock().unwrap();
                *next = Some(now + s.break_frequency_seconds as i64 * 1000);
                drop(next);
                *state.notice_shown.lock().unwrap() = false;
                drop(counted);
                if s.idle_reset_notification {
                    let n = notif_strings(&s);
                    send_notification(
                        app,
                        &s,
                        n.idle_title,
                        &format!("{} {}", n.idle_body, fmt_hms(threshold)),
                    );
                }
                close_break_windows(app);
                return;
            }
            if idle_secs < threshold {
                *counted = false;
            }
        }

        let notification_mode = s.notification_type == "NOTIFICATION";
        let mut next = state.next_break_at.lock().unwrap();
        match *next {
            Some(fire_at) => {
                /* Simple-notification mode never opens windows. */
                *state.notice_shown.lock().unwrap() =
                    !notification_mode && now >= fire_at - NOTICE_LEAD_MS;
                due = now >= fire_at;
            }
            None => {
                *next = Some(now + s.break_frequency_seconds as i64 * 1000);
                return;
            }
        }
    }
    if due {
        if s.notification_type == "NOTIFICATION" {
            let n = notif_strings(&s);
            send_notification(app, &s, n.break_title, "");
            let state = app.state::<AppState>();
            *state.next_break_at.lock().unwrap() =
                Some(Local::now().timestamp_millis() + s.break_frequency_seconds as i64 * 1000);
            log_line(app, "notified (notification mode)");
        } else {
            start_break(app);
        }
    } else {
        let state = app.state::<AppState>();
        let shown = *state.notice_shown.lock().unwrap();
        *state.started_from_tray.lock().unwrap() = false;
        drop(state);
        if shown {
            /* The windows are pre-created and hidden; restore the slip
               size in case the last break left them covering a display. */
            let handle2 = app.clone();
            on_main(app, move || {
                ensure_break_windows(&handle2, false);
                let monitors = handle2.available_monitors().unwrap_or_default();
                for (i, win) in break_windows(&handle2).into_iter().enumerate() {
                    if let Some(monitor) = monitors.get(i) {
                        layout_notice_window(&win, monitor);
                    }
                    let _ = win.show();
                }
            });
        }
    }
}

fn tray_title(state: &State<AppState>) -> Option<String> {
    let s = state.settings.lock().unwrap();
    if !s.tray_text_enabled {
        return None;
    }
    let now = Local::now().timestamp_millis();
    let fmt = |secs: i64| {
        let m = secs / 60;
        if m > 0 {
            format!("{m}m")
        } else {
            format!("{}s", secs % 60)
        }
    };
    if *state.having_break.lock().unwrap() {
        let end = *state.break_end_at.lock().unwrap();
        return end.map(|e| fmt((e - now) / 1000));
    }
    if !s.breaks_enabled {
        return None;
    }
    match s.tray_text_mode.as_str() {
        "TIME_SINCE_LAST_BREAK" => {
            state
                .last_break_at
                .lock()
                .unwrap()
                .map(|t| fmt((now - t) / 1000))
        }
        _ => state.next_break_at.lock().unwrap().map(|t| fmt((t - now) / 1000)),
    }
}

fn update_tray_title(app: &tauri::AppHandle) {
    #[cfg(target_os = "macos")]
    {
        let handle = app.clone();
        on_main(app, move || {
            let state = handle.state::<AppState>();
            if let Some(tray_state) = handle.try_state::<Mutex<Option<TrayIcon>>>() {
                let title = tray_title(&state);
                if let Some(tray) = tray_state.lock().unwrap().as_ref() {
                    let _ = tray.set_title(title);
                }
            }
        });
    }
}

/* ------------------------------------------------------------------ */
/* Windows                                                             */
/* ------------------------------------------------------------------ */

fn show_popover(app: &tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("popover") {
        let _ = win.show();
        let _ = win.set_focus();
    }
}

fn open_settings(app: &tauri::AppHandle) -> tauri::Result<()> {
    if let Some(win) = app.get_webview_window("settings") {
        let _ = win.show();
        return Ok(());
    }
    let mut builder = WebviewWindowBuilder::new(
        app,
        "settings",
        WebviewUrl::App("index.html?page=settings".into()),
    )
    .title("Fermata")
    .inner_size(1040.0, 800.0)
    .min_inner_size(920.0, 680.0);
    #[cfg(target_os = "macos")]
    {
        builder = builder.title_bar_style(tauri::TitleBarStyle::Overlay);
    }
    builder.build().map(|_| ())
}

fn build_popover(app: &tauri::AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(
        app,
        "popover",
        WebviewUrl::App("index.html?page=tray".into()),
    )
    .inner_size(340.0, 380.0)
    .visible(false)
    .decorations(false)
    .resizable(false)
    .transparent(true)
    .always_on_top(true)
    .skip_taskbar(true)
    .shadow(false)
    .build()
    .map(|_| ())
}

/* ------------------------------------------------------------------ */
/* Commands                                                            */
/* ------------------------------------------------------------------ */

#[tauri::command]
fn get_settings(state: State<'_, AppState>) -> Settings {
    state.settings.lock().unwrap().clone()
}

#[tauri::command]
fn set_settings(app: tauri::AppHandle, state: State<'_, AppState>, settings: Settings) {
    let old_auto_launch = state.settings.lock().unwrap().auto_launch;
    save_settings(&app, &settings);
    *state.settings.lock().unwrap() = settings.clone();
    if old_auto_launch != settings.auto_launch {
        let auto = app.autolaunch();
        let _ = if settings.auto_launch {
            auto.enable()
        } else {
            auto.disable()
        };
    }
    if !settings.breaks_enabled {
        *state.next_break_at.lock().unwrap() = None;
    }
    update_tray_title(&app);
}

#[tauri::command]
fn get_app_initialized(state: State<'_, AppState>) -> bool {
    *state.initialized.lock().unwrap()
}

#[tauri::command]
fn set_app_initialized(app: tauri::AppHandle, state: State<'_, AppState>) {
    *state.initialized.lock().unwrap() = true;
    std::fs::write(config_file(&app, "app.json"), "{}").ok();
}

#[tauri::command]
fn get_tray_status(state: State<'_, AppState>) -> TrayStatus {
    let s = state.settings.lock().unwrap().clone();
    let now = Local::now();
    let (from, to) = today_window(&s);
    TrayStatus {
        enabled: s.breaks_enabled,
        having_break: *state.having_break.lock().unwrap(),
        in_working_hours: in_working_hours(&s, now),
        next_break_at: *state.next_break_at.lock().unwrap(),
        since_last_break_seconds: state
            .last_break_at
            .lock()
            .unwrap()
            .map(|t| (now.timestamp_millis() - t) / 1000),
        frequency_seconds: s.break_frequency_seconds,
        length_seconds: s.break_length_seconds,
        today_from_minutes: from,
        today_to_minutes: to,
        next_window_open_at: next_window_open_at(&s),
        popup: s.notification_type == "POPUP",
    }
}

#[tauri::command]
fn get_break_length(state: State<'_, AppState>) -> u32 {
    state.settings.lock().unwrap().break_length_seconds
}

#[tauri::command]
fn get_allow_postpone(state: State<'_, AppState>) -> bool {
    let s = state.settings.lock().unwrap();
    let count = *state.postpone_count.lock().unwrap();
    s.postpone_break_enabled && (s.postpone_limit == 0 || count < s.postpone_limit)
}

#[tauri::command]
fn get_time_since_last_break(state: State<'_, AppState>) -> Option<i64> {
    state
        .last_break_at
        .lock()
        .unwrap()
        .map(|t| (Local::now().timestamp_millis() - t) / 1000)
}

#[tauri::command]
fn was_started_from_tray(state: State<'_, AppState>) -> bool {
    *state.started_from_tray.lock().unwrap()
}

#[tauri::command]
fn start_break_now(app: tauri::AppHandle) {
    /* Fresh windows must skip the notice: the user asked for the break. */
    let state = app.state::<AppState>();
    *state.started_from_tray.lock().unwrap() = true;
    drop(state);
    start_break(&app);
}

#[tauri::command]
fn break_start(app: tauri::AppHandle) {
    /* Arrived via the notice slip's own countdown: the slip is the entry. */
    let state = app.state::<AppState>();
    *state.started_from_tray.lock().unwrap() = false;
    drop(state);
    start_break(&app);
}

#[tauri::command]
fn break_end(app: tauri::AppHandle) {
    end_break(&app);
}

#[tauri::command]
fn break_postpone(app: tauri::AppHandle, state: State<'_, AppState>, _action: String) {
    let postpone = state.settings.lock().unwrap().postpone_length_seconds as i64;
    *state.having_break.lock().unwrap() = false;
    *state.break_end_at.lock().unwrap() = None;
    *state.notice_shown.lock().unwrap() = false;
    *state.postpone_count.lock().unwrap() += 1;
    *state.next_break_at.lock().unwrap() =
        Some(Local::now().timestamp_millis() + postpone * 1000);
    let _ = app.emit("BREAK_END", ());
    close_break_windows(&app);
    update_tray_title(&app);
}

#[tauri::command]
fn set_breaks_enabled(app: tauri::AppHandle, state: State<'_, AppState>, enabled: bool) {
    state.settings.lock().unwrap().breaks_enabled = enabled;
    if !enabled {
        *state.next_break_at.lock().unwrap() = None;
    }
    save_settings(&app, &state.settings.lock().unwrap());
    update_tray_title(&app);
}

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> tauri::Result<()> {
    open_settings(&app)
}

#[tauri::command]
fn hide_tray_popover(app: tauri::AppHandle) {
    let handle = app.clone();
    on_main(&app, move || {
        if let Some(win) = handle.get_webview_window("popover") {
            let _ = win.hide();
        }
    })
}

#[tauri::command]
fn resize_tray_popover(app: tauri::AppHandle, height: f64) {
    let handle = app.clone();
    on_main(&app, move || {
        if let Some(win) = handle.get_webview_window("popover") {
            let _ = win.set_size(LogicalSize::new(340.0, height));
        }
    })
}

#[tauri::command]
fn break_window_resize(app: tauri::AppHandle, window: tauri::Window) {
    let label = window.label().to_string();
    let handle = app.clone();
    let _ = window.run_on_main_thread(move || {
        let show_backdrop = handle
            .state::<AppState>()
            .settings
            .lock()
            .unwrap()
            .show_backdrop;
        if let Some(win) = handle.get_webview_window(&label) {
            if let Some(monitor) = win.current_monitor().ok().flatten() {
                layout_break_window(&win, &monitor, show_backdrop);
            }
        }
    });
}

#[tauri::command]
fn complete_break_tracking(_ms: f64) {}

#[tauri::command]
fn log_from_renderer(app: tauri::AppHandle, msg: String) {
    log_line(&app, &format!("renderer: {msg}"));
}

#[tauri::command]
fn close_current_window(window: tauri::Window) {
    /* Every surface hides — the app lives in the tray, and break windows
       live for the whole process. A break window must go through park so
       a leftover fullscreen Space is actually left. */
    if window.label().starts_with("break") {
        close_break_windows(&window.app_handle());
        return;
    }
    let _ = window.hide();
}

#[tauri::command]
fn quit_app(app: tauri::AppHandle) {
    log_line(&app, "quit from tray popover");
    app.exit(0);
}

/* ------------------------------------------------------------------ */
/* Tray                                                                */
/* ------------------------------------------------------------------ */

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

fn main() {
    tauri::Builder::default()
        .plugin(tauri_plugin_notification::init())
        .plugin(tauri_plugin_autostart::init(
            tauri_plugin_autostart::MacosLauncher::LaunchAgent,
            None,
        ))
        .invoke_handler(tauri::generate_handler![
            get_settings,
            set_settings,
            get_app_initialized,
            set_app_initialized,
            get_tray_status,
            get_break_length,
            get_allow_postpone,
            get_time_since_last_break,
            was_started_from_tray,
            start_break_now,
            break_start,
            break_end,
            break_postpone,
            set_breaks_enabled,
            open_settings_window,
            hide_tray_popover,
            resize_tray_popover,
            break_window_resize,
            complete_break_tracking,
            close_current_window,
            quit_app,
            log_from_renderer,
        ])
        .setup(|app| {
            let handle = app.handle().clone();
            let state = load_state(&handle);
            let first_run = !*state.initialized.lock().unwrap();
            let (breaks_enabled, immediately) = {
                let s = state.settings.lock().unwrap();
                (s.breaks_enabled, s.immediately_start_breaks)
            };
            app.manage(state);
            log_line(&handle, "app started");

            /* Keep the OS login item in step with the stored setting. */
            {
                let state = handle.state::<AppState>();
                let auto = state.settings.lock().unwrap().auto_launch;
                let autolaunch = handle.autolaunch();
                let _ = if auto {
                    autolaunch.enable()
                } else {
                    autolaunch.disable()
                };
            }

            build_popover(&handle)?;
            /* Pre-create the break windows hidden: their pages load and run
               init now, so a break — scheduled or Break-now — shows the
               sheet instantly instead of a bare brown window. */
            ensure_break_windows(&handle, false);
            if first_run {
                open_settings(&handle)?;
            }

            /* Tray: icon only. No menu is attached to the icon — a menu
               attached to a tray icon makes macOS swallow left-click events
               entirely, so left click opens the popover and right click is
               reserved (the popover carries every action it had). */
            let tray = TrayIconBuilder::with_id("main")
                .icon(
                    tauri::image::Image::from_bytes(include_bytes!(
                        "../../resources/tray/tray-iconTemplate@2x.png"
                    ))
                    .expect("tray icon"),
                )
                /* A menu-bar icon is a silhouette, not a logo: macOS tints
                   template images to match the menubar and its own state. */
                .icon_as_template(true)
                .on_tray_icon_event(|tray, event| {
                    let handle0 = tray.app_handle();
                    if let TrayIconEvent::Click { rect, .. } = &event {
                        log_line(handle0, "tray click");
                        if let Some(popover) = handle0.get_webview_window("popover")
                        {
                            if popover.is_visible().unwrap_or(false) {
                                log_line(handle0, "popover already visible");
                                return;
                            }
                            let scale = popover.scale_factor().unwrap_or(2.0);
                            /* rect.position / rect.size arrive as Position/Size
                               enums; the tray rect is physical pixels. */
                            let (rx, ry, rw, rh) = match (rect.position, rect.size) {
                                (
                                    tauri::Position::Physical(p),
                                    tauri::Size::Physical(s),
                                ) => (
                                    p.x as f64,
                                    p.y as f64,
                                    s.width as f64,
                                    s.height as f64,
                                ),
                                (
                                    tauri::Position::Logical(p),
                                    tauri::Size::Logical(s),
                                ) => (p.x, p.y, s.width, s.height),
                                _ => (0.0, 0.0, 0.0, 0.0),
                            };
                            let width = 340.0 * scale;
                            let cx = rx + rw / 2.0;
                            let x = cx - width / 2.0;
                            let y = ry + rh + 6.0;
                            let _ = popover.set_position(tauri::PhysicalPosition::new(
                                x as i32,
                                y as i32,
                            ));
                        }
                        show_popover(handle0);
                    }
                })
                .build(&handle)?;
            tray.set_visible(true)?;
            handle.manage(Mutex::new(Some(tray)));
            if immediately && breaks_enabled {
                start_break(&handle);
            }

            /* The heartbeat. A panic here must not silently kill the
               schedule — catch, log, and keep ticking. */
            let heartbeat = handle.clone();
            std::thread::spawn(move || loop {
                std::thread::sleep(std::time::Duration::from_millis(1000));
                let app = heartbeat.clone();
                let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(
                    move || tick(&app),
                ));
                if result.is_err() {
                    log_line(&heartbeat, "heartbeat tick panicked");
                }
            });

            Ok(())
        })
        .on_window_event(|window, event| match event {
            /* Closing a window hides it: the app lives in the tray — except
               break windows, which the schedule recreates per break and so
               are allowed to actually die. */
            tauri::WindowEvent::CloseRequested { api, .. } => {
                /* No surface may die: the app lives in the tray and break
                   windows live for the whole process. */
                api.prevent_close();
                if window.label().starts_with("break") {
                    close_break_windows(window.app_handle());
                } else {
                    let _ = window.hide();
                }
            }
            /* The popover dismisses like every menu-bar popover: a click
               anywhere else takes focus away, and that is the exit. */
            tauri::WindowEvent::Focused(false) => {
                if window.label() == "popover" {
                    let _ = window.hide();
                }
            }
            _ => {}
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|app, event| match event {
            /* Tray-only app: closing every window is not a quit. */
            tauri::RunEvent::ExitRequested { api, .. } => {
                log_line(app, "exit requested");
                api.prevent_exit();
            }
            tauri::RunEvent::Exit => log_line(app, "app exit"),
            _ => {}
        });
}
