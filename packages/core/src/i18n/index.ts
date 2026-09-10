import type { Language } from '../config/schema.js';

export type { Language };

/**
 * The complete set of user-facing strings shared by the CLI TUI and the desktop
 * launcher, keyed by language. Keeping both apps on one dictionary guarantees
 * the translations never drift apart.
 *
 * Keyboard key names (`enter`, `esc`, `ctrl`, `↑↓`) are intentionally absent —
 * they are rendered literally in the views and are not translated.
 */
export interface Messages {
  /** Placeholder shown in the empty search box. */
  searchPlaceholder: string;
  /** Full second-line search hint (used for width measurement). */
  searchHint: string;
  /** "navigate" segment of the hint, including surrounding spacing. */
  navigate: string;
  /** "launch" segment of the hint, including surrounding spacing. */
  launch: string;
  /** "quit" segment of the hint, including the leading space. */
  quit: string;
  /** "reopen" segment of the history hint, including surrounding spacing. */
  reopen: string;
  /** "back" segment of the history hint, including the leading space. */
  back: string;
  /** Standalone "Back" button label (no leading space). */
  backLabel: string;
  /** Empty-results message in the palette. */
  noMatchingEntries: string;
  /** Empty-history message in the recent-opens popup. */
  noRecentOpens: string;
  /** Title of the recent-opens popup. */
  recentlyOpened: string;
  /** "quit" label in the bottom shortcut bar. */
  hintQuit: string;
  /** "default" label in the bottom shortcut bar. */
  hintDefault: string;
  /** "recent" label in the bottom shortcut bar. */
  hintRecent: string;
  /** Banner subtitle after the version number. */
  launchAnything: string;
  /** Label recorded for the Ctrl+D default launch in history. */
  defaultLabel: string;
  /** Toolbar "Terminal" button label. */
  terminal: string;
  /** Toolbar "Recent" button label. */
  recent: string;
  /** Tray/floating-icon menu "Show launcher" label. */
  showLauncher: string;
  /** Tray/floating-icon menu "Hide launcher" label. */
  hideLauncher: string;
  /** Tray menu "Quit" label. */
  quitApp: string;
}

/**
 * The translation dictionaries, one per supported language.
 */
export const messages: Record<Language, Messages> = {
  en: {
    searchPlaceholder: 'Search projects & agents…',
    searchHint: '↑↓ navigate  ·  enter launch  ·  esc quit',
    navigate: ' navigate  ·  ',
    launch: ' launch  ·  ',
    quit: ' quit',
    reopen: ' reopen  ·  ',
    back: ' back',
    backLabel: 'Back',
    noMatchingEntries: 'No matching entries',
    noRecentOpens: 'No recent opens yet',
    recentlyOpened: 'Recently opened',
    hintQuit: 'quit',
    hintDefault: 'default',
    hintRecent: 'recent',
    launchAnything: 'launch anything',
    defaultLabel: 'default',
    terminal: 'Terminal',
    recent: 'Recent',
    showLauncher: 'Show launcher',
    hideLauncher: 'Hide launcher',
    quitApp: 'Quit',
  },
  'zh-CN': {
    searchPlaceholder: '搜索项目和智能体…',
    searchHint: '↑↓ 导航  ·  enter 打开  ·  esc 退出',
    navigate: ' 导航  ·  ',
    launch: ' 打开  ·  ',
    quit: ' 退出',
    reopen: ' 重新打开  ·  ',
    back: ' 返回',
    backLabel: '返回',
    noMatchingEntries: '没有匹配的条目',
    noRecentOpens: '暂无最近打开',
    recentlyOpened: '最近打开',
    hintQuit: '退出',
    hintDefault: '默认',
    hintRecent: '最近',
    launchAnything: '快速启动',
    defaultLabel: '默认',
    terminal: '终端',
    recent: '最近',
    showLauncher: '显示启动器',
    hideLauncher: '隐藏启动器',
    quitApp: '退出',
  },
};

/**
 * Returns the translation dictionary for the given language.
 *
 * @param language - The UI language code.
 * @returns The translation dictionary.
 */
export function getMessages(language: Language): Messages {
  return messages[language];
}
