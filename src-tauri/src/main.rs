#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

/* Fermata's Tauri core: the Electron main process ported to Rust, phase 1.
   In: settings store, cadence scheduling with working hours, tray + menu,
   popover, settings window, single-display popup breaks. Out (phase 2):
   multi-display break windows, idle detection, postpone limits, sounds. */

use chrono::{Datelike, Local, Timelike};
use serde::{Deserialize, Serialize};
use std::sync::Mutex;
use tauri::menu::{Menu, MenuItem};
use tauri::tray::{MouseButton, MouseButtonState, TrayIcon, TrayIconBuilder, TrayIconEvent};
use tauri::{Emitter, LogicalSize, Manager, State, WebviewUrl, WebviewWindowBuilder};

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
    day_for(s, now.weekday().num_days_from_sunday())
        .ranges
        .iter()
        .any(|r| minutes >= r.from_minutes && minutes <= r.to_minutes)
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
    }
}

fn save_settings(app: &tauri::AppHandle, s: &Settings) {
    if let Ok(json) = serde_json::to_vec_pretty(s) {
        std::fs::write(config_file(app, "settings.json"), json).ok();
    }
}

/* ------------------------------------------------------------------ */
/* i18n for the tray menu — the two string sets, minimal               */
/* ------------------------------------------------------------------ */

struct MenuStrings {
    start: &'static str,
    pause: &'static str,
    resume: &'static str,
    settings: &'static str,
    quit: &'static str,
}

const EN: MenuStrings = MenuStrings {
    start: "Start break now",
    pause: "Pause",
    resume: "Resume",
    settings: "Settings...",
    quit: "Quit",
};

const ZH: MenuStrings = MenuStrings {
    start: "立即开始休息",
    pause: "暂停",
    resume: "继续",
    settings: "设置……",
    quit: "退出",
};

fn is_zh(s: &Settings) -> bool {
    let tag = if s.language == "system" {
        sys_locale::get_locale().unwrap_or_else(|| "en".into())
    } else {
        s.language.clone()
    };
    tag.starts_with("zh")
}

/* ------------------------------------------------------------------ */
/* Break flow                                                          */
/* ------------------------------------------------------------------ */

fn start_break(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    let length = state.settings.lock().unwrap().break_length_seconds as i64;
    let end_at = Local::now().timestamp_millis() + length * 1000;
    *state.break_end_at.lock().unwrap() = Some(end_at);
    *state.having_break.lock().unwrap() = true;
    *state.next_break_at.lock().unwrap() = None;
    let _ = app.emit("BREAK_START", end_at);
    if let Some(win) = app.get_webview_window("break") {
        let _ = win.set_fullscreen(true);
        let _ = win.show();
    }
    update_tray_title(app);
}

fn end_break(app: &tauri::AppHandle) {
    let state = app.state::<AppState>();
    *state.having_break.lock().unwrap() = false;
    *state.break_end_at.lock().unwrap() = None;
    *state.last_break_at.lock().unwrap() = Some(Local::now().timestamp_millis());
    let freq = state.settings.lock().unwrap().break_frequency_seconds as i64;
    *state.next_break_at.lock().unwrap() = Some(Local::now().timestamp_millis() + freq * 1000);
    let _ = app.emit("BREAK_END", ());
    if let Some(win) = app.get_webview_window("break") {
        let _ = win.hide();
        let _ = win.set_fullscreen(false);
    }
    update_tray_title(app);
}

/* The schedule heartbeat: schedule when idle, fire when due, end when due. */
fn tick(app: &tauri::AppHandle) {
    {
        let state = app.state::<AppState>();
        let s = state.settings.lock().unwrap().clone();
        let now = Local::now().timestamp_millis();
        let having_break = *state.having_break.lock().unwrap();

        if having_break {
            let end = *state.break_end_at.lock().unwrap();
            if end.is_some_and(|e| now >= e) {
                drop(state);
                end_break(app);
                return;
            }
            return;
        }
        if !s.breaks_enabled || !in_working_hours(&s, Local::now()) {
            *state.next_break_at.lock().unwrap() = None;
            return;
        }
        let mut next = state.next_break_at.lock().unwrap();
        match *next {
            Some(at) if now >= at => {
                *next = None;
            }
            None => {
                *next = Some(now + s.break_frequency_seconds as i64 * 1000);
                return;
            }
            _ => return,
        }
    }
    start_break(app);
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
        let state = app.state::<AppState>();
        if let Some(tray_state) = app.try_state::<Mutex<Option<TrayIcon>>>() {
            let title = tray_title(&state);
            if let Some(tray) = tray_state.lock().unwrap().as_ref() {
                let _ = tray.set_title(title);
            }
        }
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

fn build_break(app: &tauri::AppHandle) -> tauri::Result<()> {
    WebviewWindowBuilder::new(
        app,
        "break",
        WebviewUrl::App("index.html?page=break&windowId=0".into()),
    )
    .inner_size(1200.0, 800.0)
    .visible(false)
    .decorations(false)
    .resizable(false)
    .skip_taskbar(true)
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
    save_settings(&app, &settings);
    *state.settings.lock().unwrap() = settings.clone();
    if !settings.breaks_enabled {
        *state.next_break_at.lock().unwrap() = None;
    }
    rebuild_tray_menu(&app);
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
    state.settings.lock().unwrap().postpone_break_enabled
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
fn was_started_from_tray() -> bool {
    false
}

#[tauri::command]
fn start_break_now(app: tauri::AppHandle) {
    start_break(&app);
}

#[tauri::command]
fn break_start(app: tauri::AppHandle) {
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
    *state.next_break_at.lock().unwrap() =
        Some(Local::now().timestamp_millis() + postpone * 1000);
    let _ = app.emit("BREAK_END", ());
    if let Some(win) = app.get_webview_window("break") {
        let _ = win.hide();
        let _ = win.set_fullscreen(false);
    }
    update_tray_title(&app);
}

#[tauri::command]
fn set_breaks_enabled(app: tauri::AppHandle, state: State<'_, AppState>, enabled: bool) {
    state.settings.lock().unwrap().breaks_enabled = enabled;
    if !enabled {
        *state.next_break_at.lock().unwrap() = None;
    }
    save_settings(&app, &state.settings.lock().unwrap());
    rebuild_tray_menu(&app);
    update_tray_title(&app);
}

#[tauri::command]
fn open_settings_window(app: tauri::AppHandle) -> tauri::Result<()> {
    open_settings(&app)
}

#[tauri::command]
fn hide_tray_popover(app: tauri::AppHandle) {
    if let Some(win) = app.get_webview_window("popover") {
        let _ = win.hide();
    }
}

#[tauri::command]
fn resize_tray_popover(app: tauri::AppHandle, height: f64) {
    if let Some(win) = app.get_webview_window("popover") {
        let _ = win.set_size(LogicalSize::new(340.0, height));
    }
}

#[tauri::command]
fn break_window_resize(app: tauri::AppHandle, window: tauri::Window) {
    if let Some(monitor) = window.current_monitor().ok().flatten() {
        let pos = monitor.position();
        let size = monitor.size();
        let _ = window.set_position(tauri::PhysicalPosition::new(pos.x, pos.y));
        let _ = window.set_size(tauri::PhysicalSize::new(size.width, size.height));
    }
    let _ = window.set_fullscreen(true);
}

#[tauri::command]
fn complete_break_tracking(_ms: f64) {}

#[tauri::command]
fn close_current_window(window: tauri::Window) {
    let _ = window.hide();
}

/* ------------------------------------------------------------------ */
/* Tray                                                                */
/* ------------------------------------------------------------------ */

fn rebuild_tray_menu(app: &tauri::AppHandle) {
    let Some(tray_state) = app.try_state::<Mutex<Option<TrayIcon>>>() else {
        return;
    };
    let guard = tray_state.lock().unwrap();
    let Some(tray) = guard.as_ref() else { return };
    let state = app.state::<AppState>();
    let s = state.settings.lock().unwrap().clone();
    let m = if is_zh(&s) { ZH } else { EN };
    let enabled = s.breaks_enabled;
    drop(state);

    let Ok(start) = MenuItem::with_id(app, "start", m.start, enabled, None::<&str>) else {
        return;
    };
    let Ok(toggle) = MenuItem::with_id(
        app,
        "toggle",
        if enabled { m.pause } else { m.resume },
        true,
        None::<&str>,
    ) else {
        return;
    };
    let Ok(settings) = MenuItem::with_id(app, "settings", m.settings, true, None::<&str>) else {
        return;
    };
    let Ok(quit) = MenuItem::with_id(app, "quit", m.quit, true, None::<&str>) else {
        return;
    };
    let Ok(menu) = Menu::new(app) else { return };
    let _ = menu.append(&start);
    let _ = menu.append(&toggle);
    let _ = menu.append(&settings);
    let _ = menu.append(&quit);
    let _ = tray.set_menu(Some(menu));
}

fn on_tray_menu(app: &tauri::AppHandle, id: &str) {
    match id {
        "start" => start_break(app),
        "toggle" => {
            let state = app.state::<AppState>();
            let enabled = state.settings.lock().unwrap().breaks_enabled;
            drop(state);
            set_breaks_enabled(app.clone(), app.state(), !enabled);
        }
        "settings" => {
            let _ = open_settings(app);
        }
        "quit" => app.exit(0),
        _ => {}
    }
}

/* ------------------------------------------------------------------ */
/* App                                                                 */
/* ------------------------------------------------------------------ */

fn main() {
    tauri::Builder::default()
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

            build_popover(&handle)?;
            build_break(&handle)?;
            if first_run {
                open_settings(&handle)?;
            }

            /* Tray: icon, localized menu, left-click popover. */
            let s = {
                let state = handle.state::<AppState>();
                let guard = state.settings.lock().unwrap();
                guard.clone()
            };
            let m = if is_zh(&s) { ZH } else { EN };
            let start = MenuItem::with_id(&handle, "start", m.start, breaks_enabled, None::<&str>)?;
            let toggle = MenuItem::with_id(&handle, "toggle", m.pause, true, None::<&str>)?;
            let settings = MenuItem::with_id(&handle, "settings", m.settings, true, None::<&str>)?;
            let quit = MenuItem::with_id(&handle, "quit", m.quit, true, None::<&str>)?;
            let menu = Menu::new(&handle)?;
            menu.append(&start)?;
            menu.append(&toggle)?;
            menu.append(&settings)?;
            menu.append(&quit)?;

            let mut tray = TrayIconBuilder::with_id("main")
                .icon(
                    tauri::image::Image::from_bytes(include_bytes!(
                        "../../resources/icon.png"
                    ))
                    .expect("tray icon"),
                )
                .menu(&menu)
                .show_menu_on_left_click(false)
                .on_menu_event(|app, event| on_tray_menu(app, event.id().as_ref()))
                .on_tray_icon_event(|tray, event| {
                    if let TrayIconEvent::Click {
                        button: MouseButton::Left,
                        button_state: MouseButtonState::Up,
                        ..
                    } = event
                    {
                        show_popover(tray.app_handle());
                    }
                })
                .build(&handle)?;
            tray.set_visible(true)?;
            handle.manage(Mutex::new(Some(tray)));

            if immediately && breaks_enabled {
                start_break(&handle);
            }

            /* The heartbeat. */
            let heartbeat = handle.clone();
            std::thread::spawn(move || loop {
                std::thread::sleep(std::time::Duration::from_millis(1000));
                tick(&heartbeat);
            });

            Ok(())
        })
        .on_window_event(|window, event| {
            /* Closing a window hides it: the app lives in the tray. */
            if let tauri::WindowEvent::CloseRequested { api, .. } = event {
                let _ = window.hide();
                api.prevent_close();
            }
        })
        .build(tauri::generate_context!())
        .expect("error while building tauri application")
        .run(|_app, event| {
            if let tauri::RunEvent::ExitRequested { api, .. } = event {
                /* Tray-only app: closing every window is not a quit. */
                api.prevent_exit();
            }
        });
}
