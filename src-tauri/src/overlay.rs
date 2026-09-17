/* Geometry and schedule helpers that must stay free of native fullscreen.
   A macOS fullscreen Space is what turned cancel/timeout into a black
   takeover: hide() issued on that Space is swallowed when the space exits. */

pub const NOTICE_WIDTH: f64 = 540.0;
pub const NOTICE_HEIGHT: f64 = 100.0;
pub const CARD_WIDTH: f64 = 540.0;
pub const CARD_HEIGHT: f64 = 420.0;
pub const NOTICE_TOP_OFFSET: f64 = 50.0;

/* Never enter a native fullscreen Space. Cover the display with a
   borderless always-on-top window instead. */
pub const USE_NATIVE_FULLSCREEN: bool = false;

pub const FULLSCREEN_REHIDE_MS: &[u64] = &[400, 1_800];

#[derive(Debug, Clone, PartialEq)]
pub struct OverlayRect {
    pub x: f64,
    pub y: f64,
    pub width: f64,
    pub height: f64,
}

pub fn notice_rect(monitor_x: f64, monitor_y: f64, monitor_w: f64) -> OverlayRect {
    OverlayRect {
        x: monitor_x + (monitor_w - NOTICE_WIDTH) / 2.0,
        y: monitor_y + NOTICE_TOP_OFFSET,
        width: NOTICE_WIDTH,
        height: NOTICE_HEIGHT,
    }
}

pub fn break_rect(
    show_backdrop: bool,
    monitor_x: f64,
    monitor_y: f64,
    monitor_w: f64,
    monitor_h: f64,
) -> OverlayRect {
    if show_backdrop {
        OverlayRect {
            x: monitor_x,
            y: monitor_y,
            width: monitor_w,
            height: monitor_h,
        }
    } else {
        OverlayRect {
            x: monitor_x + (monitor_w - CARD_WIDTH) / 2.0,
            y: monitor_y + (monitor_h - CARD_HEIGHT) / 2.0,
            width: CARD_WIDTH,
            height: CARD_HEIGHT,
        }
    }
}

pub fn rehide_delays_ms(was_fullscreen: bool) -> &'static [u64] {
    if was_fullscreen {
        FULLSCREEN_REHIDE_MS
    } else {
        &[]
    }
}

/* A disabled weekday still carries its default 09:00–18:00 range in
   settings. The range is not a schedule until the day is on. */
pub fn day_accepts_breaks(enabled: bool, ranges: &[(u32, u32)], minutes: u32) -> bool {
    enabled && ranges.iter().any(|&(from, to)| minutes >= from && minutes <= to)
}

pub fn should_reveal_started_break(having_break: bool) -> bool {
    having_break
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn never_uses_a_native_fullscreen_space() {
        assert!(!USE_NATIVE_FULLSCREEN);
    }

    #[test]
    fn veil_covers_the_monitor() {
        assert_eq!(
            break_rect(true, 0.0, 0.0, 3440.0, 1440.0),
            OverlayRect {
                x: 0.0,
                y: 0.0,
                width: 3440.0,
                height: 1440.0,
            }
        );
    }

    #[test]
    fn card_sits_in_the_monitor_centre() {
        let rect = break_rect(false, 0.0, 0.0, 3440.0, 1440.0);
        assert_eq!(rect.width, CARD_WIDTH);
        assert_eq!(rect.height, CARD_HEIGHT);
        assert_eq!(rect.x, (3440.0 - CARD_WIDTH) / 2.0);
        assert_eq!(rect.y, (1440.0 - CARD_HEIGHT) / 2.0);
    }

    #[test]
    fn notice_is_a_slip_at_the_top() {
        let rect = notice_rect(100.0, 20.0, 2000.0);
        assert_eq!(rect.width, NOTICE_WIDTH);
        assert_eq!(rect.height, NOTICE_HEIGHT);
        assert_eq!(rect.x, 100.0 + (2000.0 - NOTICE_WIDTH) / 2.0);
        assert_eq!(rect.y, 70.0);
    }

    #[test]
    fn leftover_fullscreen_gets_a_rehide_after_the_space_exits() {
        assert_eq!(rehide_delays_ms(true), FULLSCREEN_REHIDE_MS);
        assert!(rehide_delays_ms(false).is_empty());
    }

    #[test]
    fn disabled_sunday_does_not_fire_from_its_default_range() {
        assert!(!day_accepts_breaks(false, &[(540, 1080)], 12 * 60));
    }

    #[test]
    fn enabled_monday_fires_inside_its_range() {
        assert!(day_accepts_breaks(true, &[(540, 1080)], 12 * 60));
        assert!(!day_accepts_breaks(true, &[(540, 1080)], 20 * 60));
    }

    #[test]
    fn a_cancelled_break_must_not_be_shown_by_the_delayed_reveal() {
        assert!(!should_reveal_started_break(false));
        assert!(should_reveal_started_break(true));
    }
}
