# 安装

pisces 以 `@lysun001/pisces` 为名发布在 npm 上。

## 环境要求

- **Node.js 22 或更高版本**
- Windows、macOS 或 Linux 上的终端（见[平台支持](#平台支持)）

## 安装

```bash
npm install -g @lysun001/pisces
```

然后运行：

```bash
pis
```

搜索面板会立即打开。首次运行的完整流程见[快速开始](./quickstart)。

## 保持最新

随时运行内置更新器：

```bash
pis self-update
```

详见[自我更新](./update)。

## 平台支持

启动条目时，pisces 会在目标目录打开一个**新的终端窗口**：

| 平台    | 终端                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| Windows | PowerShell（通过 `Start-Process` 打开新窗口）                                                              |
| macOS   | Terminal.app（通过 `osascript`）                                                                           |
| Linux   | 自动检测：gnome-terminal → x-terminal-emulator → xterm → konsole → xfce4-terminal → terminator → alacritty |

## 卸载

```bash
npm uninstall -g @lysun001/pisces
```

`~/.pisces/` 中的配置会原样保留；如需删除请手动清理该目录。
