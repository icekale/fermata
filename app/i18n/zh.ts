/* ---------------------------------------------------------------------------
   Simplified Chinese.

   Typed as Record<MessageKey, string>, so a key added to English and forgotten
   here is a compile error rather than an English string surfacing in a Chinese
   window.

   Punctuation is full-width throughout, including the exclamation in the break
   notification — a half-width mark next to Chinese characters is one of the
   tells that a translation was pasted in rather than written.
   ------------------------------------------------------------------------ */
import type { MessageKey } from "./en";

export const zh: Record<MessageKey, string> = {
  /* --- 导航 ------------------------------------------------------------- */
  "nav.general": "节奏",
  "nav.hours": "日程",
  "nav.customization": "外观",
  "nav.system": "系统",
  "nav.save": "保存",
  "nav.revert": "还原",
  "nav.saved": "已保存",
  "trayPanel.next": "下次休息",
  "trayPanel.outside": "非工作时段",
  "trayPanel.inside": "工作中",
  "trayPanel.since": "距上次",
  "trayPanel.sinceShort": "距上次",
  "trayPanel.start": "立即休息",
  "trayPanel.pause": "暂停",
  "trayPanel.resume": "继续",
  "trayPanel.settings": "设置",
  "trayPanel.onBreak": "休息中",
  "trayPanel.at": "下次 {time}",
  "trayPanel.last": "上次 {time}",
  "trayPanel.fullscreen": "全屏遮罩",
  "trayPanel.notify": "简单通知",
  "trayPanel.freqShort": "间隔",
  "trayPanel.lenShort": "时长",
  "trayPanel.modeSheet": "全屏",
  "trayPanel.modeNotify": "通知",
  "trayPanel.noHours": "今天无安排",
  "trayPanel.resumesAt": "{time} 恢复",
  "trayPanel.noMoreToday": "今天不再提醒",
  "status.running": "运行中",
  "status.paused": "已暂停",
  "health.label": "休息节奏",
  "health.ok": "很好",
  "health.off": "已暂停",
  "health.break": "每次休息 {length}",

  /* --- 区块 ------------------------------------------------------------- */
  "sec.breaks.title": "休息",
  "sec.breaks.helper": "多久休息一次、休息多久，以及休息时显示什么。",
  "sec.smart.title": "智能休息",
  "sec.smart.helper": "自动识别你已经在休息，并重置计时。",
  "sec.snooze.title": "稍后提醒",
  "sec.snooze.helper": "忙的时候可以把这次休息往后推。",
  "sec.skip.title": "跳过",
  "sec.skip.helper": "允许完全跳过这次休息，而不重新排期。",
  "sec.skip.switch": "允许跳过",
  "sec.advanced.title": "高级",
  "sec.advanced.startImmediately": "到点立即开始休息",
  "sec.advanced.endEarly": "允许提前结束休息",
  "sec.hours.title": "工作时间",
  "sec.hours.helper":
    "只在设定的工作时段内提醒。拖拽色块可以整体移动，点击可以输入精确时间。",
  "sec.screen.title": "休息界面",
  "sec.screen.helper": "休息开始时铺满屏幕的那张纸。",
  "sec.veil.title": "遮罩",
  "sec.veil.helper": "在休息界面之后压一层遮罩，让桌面不再抢注意力。",
  "sec.veil.strength": "浓度",
  "sec.audio.title": "声音",
  "sec.audio.helper": "休息开始和结束各响一次，不必盯着屏幕。",
  "sec.audio.sound": "提示音",
  "sec.audio.volume": "音量",
  "sec.audio.silent": "静音",
  "sec.audio.full": "最大",
  "sec.startup.title": "登录时启动",
  "sec.startup.helper": "登录电脑后自动启动 Fermata。",
  "sec.tray.title": "菜单栏文字",
  "sec.tray.helper": "在菜单栏图标旁显示时间信息。",
  "sec.tray.next": "距离下次休息",
  "sec.tray.since": "距离上次休息",
  "sec.language.title": "语言",
  "sec.language.helper": "这个窗口、菜单栏菜单和系统通知所用的语言。",

  /* --- 字段 ------------------------------------------------------------- */
  "field.frequency": "间隔",
  "field.length": "时长",
  "field.limit": "次数上限",
  "field.type": "方式",
  "field.title": "标题",
  "field.message": "文案",
  "field.messageHint": "一行一句",
  "break.defaultTitle": "该休息一下了",
  "break.defaultMessage":
    "看看远处，放松眼睛。\n站起来走走。\n深呼吸，松一松肩。",
  "field.messagePlaceholder": "输入休息时想看到的话……",
  "field.idleMinimum": "最短闲置时间",
  "field.notifyOnIdle": "自动识别到休息时通知我",
  "field.popup": "弹窗休息",
  "field.notification": "简单通知",
  "field.noLimit": "不限次数",
  "field.customSheet": "自定义",
  "field.custom": "自定义",
  "field.sheet": "纸色",
  "field.ink": "墨色",

  /* --- 周账簿 ----------------------------------------------------------- */
  "ledger.now": "现在",
  "ledger.drag": "拖拽色块可整体移动",
  "ledger.click": "点击可输入精确时间",
  "ledger.shiftLabel": "{day} 的时段：{from} 到 {to}",
  "ledger.dayToggle": "{day}的休息",
  "ledger.shift": "时段",
  "ledger.shiftFrom": "从",
  "ledger.shiftUntil": "到",
  "ledger.addShift": "添加时段",
  "ledger.remove": "删除",
  "ledger.copyTo": "复制到",
  "ledger.copyCount.one": "复制到 {count} 天",
  "ledger.copyCount.other": "复制到 {count} 天",

  /* --- 星期 ------------------------------------------------------------- */
  "day.mon": "周一",
  "day.tue": "周二",
  "day.wed": "周三",
  "day.thu": "周四",
  "day.fri": "周五",
  "day.sat": "周六",
  "day.sun": "周日",
  "day.monday": "星期一",
  "day.tuesday": "星期二",
  "day.wednesday": "星期三",
  "day.thursday": "星期四",
  "day.friday": "星期五",
  "day.saturday": "星期六",
  "day.sunday": "星期日",

  /* --- 提示音 ----------------------------------------------------------- */
  "sound.none": "无",
  "sound.gong": "锣",
  "sound.blip": "哔",
  "sound.bloop": "嘟",
  "sound.ping": "叮",
  "sound.scifi": "科幻",
  "sound.preview": "试听",

  /* --- 休息界面配色 ----------------------------------------------------- */
  "palette.paper": "纸",
  "palette.ink": "墨",
  "palette.midnight": "子夜",
  "palette.moss": "苔",
  "palette.clay": "陶土",
  "palette.plum": "梅",
  "palette.contrastLow":
    "对比度 {ratio}:1。低于 4.5:1 时，在较亮的显示器上倒计时会看不清——换更深的墨色或更浅的纸色。",
  "palette.contrastOk": "对比度 {ratio}:1。遮罩色 {veil}。",

  /* --- 提醒条 ----------------------------------------------------------- */
  "notice.eyebrow.grace": "休息",
  "notice.eyebrow.countdown": "即将开始",
  "notice.grace": "准备好了就开始休息……",
  "notice.progress": "距休息开始",
  "notice.start": "开始",
  "notice.snooze": "稍后",
  "notice.skip": "跳过",

  /* --- 休息界面 --------------------------------------------------------- */
  "break.eyebrow": "休息",
  "break.ends": "{time} 结束",
  "break.cancel": "取消休息",
  "break.end": "结束休息",
  "break.progress": "休息进度",

  /* --- 距上次休息 ------------------------------------------------------- */
  "since.hours": "距上次休息 {hours} 小时 {minutes} 分",
  "since.hoursShort": "距上次休息 {hours} 小时",
  "since.minutes": "距上次休息 {minutes} 分钟",
  "since.seconds": "距上次休息不到 1 分钟",

  /* --- 首次运行 --------------------------------------------------------- */
  "welcome.eyebrow": "欢迎",
  "welcome.title": "Fermata 会在后台运行",
  "welcome.body": "它就在菜单栏里——暂停、休息、打开设置，都在那里。",
  "welcome.body.tray": "它就在系统托盘里——暂停、休息、打开设置，都在那里。",
  "welcome.cta": "明白了",

  /* --- 时间字段里的单位 -------------------------------------------------- */
  "unit.h": "时",
  "unit.m": "分",
  "unit.s": "秒",

  /* --- 提示 ------------------------------------------------------------- */
  "toast.saved": "设置已保存",

  /* --- 菜单栏与系统通知（主进程） --------------------------------------- */
  "tray.nextBreak.one": "还有 1 分钟休息",
  "tray.nextBreak.other": "还有 {minutes} 分钟休息",
  "tray.nextBreak.less": "不到 1 分钟就休息",
  "tray.disabledFor": "已停用 {time}",
  "tray.outsideHours": "不在工作时段",
  "tray.idle": "已闲置",
  "tray.enable": "启用",
  "tray.disable": "停用……",
  "tray.indefinitely": "一直停用",
  "tray.minutes30": "30 分钟",
  "tray.hour1": "1 小时",
  "tray.hour2": "2 小时",
  "tray.hour4": "4 小时",
  "tray.restOfDay": "今天剩余时间",
  "tray.startNow": "立即开始休息",
  "tray.settings": "设置……",
  "tray.about": "关于……",
  "tray.quit": "退出",
  "tray.aboutTitle": "关于",
  "tray.aboutBody":
    "一个屏住呼吸、然后继续的休息计时器。\n\n基于 Tom James Watson 的 BreakTimer：\nhttps://github.com/tom-james-watson/breaktimer-app\n\n以 GPL-3.0-or-later 协议分发。",
  "notif.breakTitle": "该休息了！",
  "notif.idleTitle": "检测到你已经在休息",
  "notif.idleBody": "离开 {time}",
  "notif.updateTitle": "有可用更新",
  "notif.updateBody": "Fermata 有新版本，点击下载。",

  /* --- 语言名称 --------------------------------------------------------- */
  "lang.system": "跟随系统",
  "lang.en": "English",
  "lang.zh": "简体中文",
};
