# 桌面端

pisces 桌面端把同一个启动器装进了一个可拖动的**悬浮图标**里。点击图标，旁边会弹出一个 400×600 的启动窗口——搜索你的项目、打开终端、或用编辑器打开项目，全程不需要自己开终端。

## 安装

<DownloadButtons />

按钮始终下载**最新**版本。运行安装器，然后从开始菜单 / 应用程序启动 **Pisces**。屏幕上会出现一个圆形悬浮图标。如需旧版本，请到 [GitHub Releases](https://github.com/neptune-constellation/pisces/releases) 页面查看。

> 安装包没有进行代码签名。在 Windows 上，SmartScreen 可能会弹出「Windows 已保护你的电脑」提示——点击**更多信息 → 仍要运行**即可。在 macOS 上，Gatekeeper 可能会拦截应用——右键点击它并选择**打开**，或到**系统设置 → 隐私与安全性**里允许打开。

## 悬浮图标

- **拖动**图标到屏幕任意位置——它会一直置顶显示。
- **点击**图标打开（或关闭）旁边的启动窗口。窗口默认出现在图标左侧，当左侧空间不足时会翻转到另一侧。
- **右击**图标会弹出右键菜单，包含与上面相同的打开/关闭启动窗口操作——标签会跟着窗口当前状态显示**显示启动器**或**隐藏启动器**——以及**退出**。
- 点击窗口外部时，窗口会自动收起。

## 启动窗口

窗口分三部分：

1. **工具栏** —— 两个按钮：
   - **Terminal**（终端）打开一个新的空白终端（等同于 TUI 中未配置 `default` 时按 `Ctrl+D` 的效果）。
   - **Recent**（最近）切换到最近打开列表。
2. **搜索框** —— 输入内容即可筛选已配置的 locations、agents 和 editors，和 TUI 一致。占位符是 `Search projects & agents...`。每次重新打开启动器时，搜索框会自动清空，你总是从一个全新的搜索开始。
3. **结果列表** —— 匹配的条目。用 **↑ / ↓** 键或把鼠标移到某一行来选中（列表会自动滚动，保持选中项可见）。按 **Enter** 或点击启动，按 **Esc** 关闭窗口。

搜索使用和 TUI 相同的基于键的前缀匹配规则——详见[搜索与键盘](/zh/search)。

## 最近打开

**Recent**（最近）视图列出你最近 10 次打开（包括 agents、editors 和目录），每行下方显示打开时间。选择一条后按 **Enter** 或点击重新打开，或点击 **Back** 返回搜索视图。

## 系统托盘

托盘图标让 pisces 在后台保持运行：

- **显示启动器** / **隐藏启动器** 切换悬浮图标旁的启动窗口，标签会跟着窗口当前状态变化。
- **退出** 退出应用。

## 配置

桌面端读取和 CLI 相同的 `~/.pisces/settings.json`——locations、agents、editors、`default` 快捷方式和 `language` 设置都是共享的。完整参考见[配置](/zh/config)。首次启动时，如果还没有配置文件，桌面端会像 CLI 一样自动检测你已安装的 agents 和 editors。

界面语言在应用启动时读取，所以修改 `language` 后需要重启桌面端。悬浮图标和托盘的右键菜单每次打开时都会重新构建，因此它们会立即跟随该设置。

## 开发

从源码运行桌面端需要 [Node.js](https://nodejs.org) >= 22 和 [pnpm](https://pnpm.io)。在仓库根目录执行：

```bash
pnpm install
pnpm --filter @lysun001/pisces-desktop dev
```

`dev` 会以 watch 模式启动 electron-vite 并打开悬浮图标窗口。若要本地构建生产安装包，运行 `pnpm --filter @lysun001/pisces-desktop dist`（electron-vite build + electron-builder，产物输出到 `apps/desktop/dist/`）。
