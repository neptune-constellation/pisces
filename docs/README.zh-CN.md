# pisces

[English](../README.md)

一个终端 TUI 启动器，用于 AI 编程代理 —— 从一个地方快速打开项目和代理。

[![npm version](https://img.shields.io/npm/v/@lysun001/pisces)](https://www.npmjs.com/package/@lysun001/pisces)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](../LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D20-brightgreen)](https://nodejs.org)

## 安装

```bash
npm install -g @lysun001/pisces
```

需要 Node.js 22 或更高版本。

## 快速开始

1. 创建配置目录：

```bash
mkdir %USERPROFILE%\.pisces   # Windows
mkdir ~/.pisces               # macOS / Linux
```

2. 在 `~/.pisces/settings.json` 中配置项目目录和 AI 代理：

```json
{
  "locations": [
    {
      "name": "docs",
      "path": "C:\\Users\\You\\Desktop\\docs",
      "key": "a"
    },
    {
      "name": "code",
      "path": "C:\\Users\\You\\Desktop\\code",
      "key": ["b", "beta"]
    }
  ],
  "agents": [
    {
      "name": "crush",
      "command": "crush",
      "key": "cs"
    },
    {
      "name": "opencode",
      "command": "opencode",
      "key": ["oc", "open"]
    },
    {
      "name": "claude",
      "command": "claude",
      "key": "cl",
      "args": ["--model", "sonnet"]
    }
  ],
  "default": {
    "path": "C:\\Users\\You\\Desktop\\code",
    "command": "claude"
  }
}
```

3. 运行 pisces：

```bash
pis
```

4. 运行 `pis` —— 搜索面板会立即打开。输入以过滤，按 `Enter` 启动。

## 配置

### settings.json

配置文件位于 `~/.pisces/settings.json`，包含三个部分：

#### `locations`

每个条目代表一个项目目录：

| 字段   | 类型                 | 描述                                                   |
| ------ | -------------------- | ------------------------------------------------------ |
| `name` | `string`             | 显示名称（1-50 个字符，任意字符）                      |
| `path` | `string`             | 目录的绝对路径                                         |
| `key`  | `string \| string[]` | 快速过滤的快捷键（每个 1-20 个字符，仅限 `[a-z0-9-]`） |

#### `agents`

每个条目代表一个 AI 代理 CLI 命令：

| 字段      | 类型                 | 描述                                                   |
| --------- | -------------------- | ------------------------------------------------------ |
| `name`    | `string`             | 显示名称（1-50 个字符，任意字符）                      |
| `command` | `string`             | 要执行的 shell 命令                                    |
| `key`     | `string \| string[]` | 快速过滤的快捷键（每个 1-20 个字符，仅限 `[a-z0-9-]`） |
| `args`    | `string[]`           | 默认参数（可选，默认为 `[]`）                          |

#### `default`

可选的快捷启动配置，按 `Ctrl+D` 可在指定路径快速打开终端并运行命令：

| 字段      | 类型     | 描述                                 |
| --------- | -------- | ------------------------------------ |
| `path`    | `string` | 要打开的绝对路径（可选，留空则禁用） |
| `command` | `string` | 打开后执行的 shell 命令（可选）      |

## 使用方法

### 键盘快捷键

| 操作        | 按键                   |
| ----------- | ---------------------- |
| 向上导航    | `↑` 或 `Ctrl+K`        |
| 向下导航    | `↓` 或 `Ctrl+J`        |
| 选择 / 启动 | `Enter`                |
| 默认启动    | `Ctrl+D`（或 `Cmd+D`） |
| 退出        | `Esc` 或 `Ctrl+C`      |

### 搜索行为

面板使用基于键的前缀匹配：输入被解释为 `locationKey + agentKey`。位置或代理可以有多个键；当任何键满足规则时，条目就会匹配。

- 输入位置键（例如 `b`）查看该目录及其所有代理组合
- 输入位置键后跟代理键前缀（例如 `bo`）以缩小到匹配的代理
- 输入完整的位置 + 代理键（例如 `boc`）以定位特定组合
- 仅输入代理键（例如 `oc`）在当前目录启动代理
- 搜索不区分大小写
- 结果按类别排序：目录优先，然后是目录+代理组合，最后是仅代理条目

### 面板条目

面板显示三种类型的条目：

- **📁 目录** —— 在配置的目录打开新终端
- **📁 + ⚡ 组合** —— 在目录打开新终端并预启动代理（仅在过滤时显示）
- **⚡ 代理** —— 在当前工作目录打开代理

### 子目录浏览

在位置键后输入 `/` 或 `\` 即可浏览该位置下的子目录：

| 输入    | 结果                               |
| ------- | ---------------------------------- |
| `b/`    | 显示 key 为 `b` 的位置下所有子目录 |
| `b/pro` | 显示名称以 `pro` 开头的子目录      |
| `b\src` | 同上 —— `\` 同样可以作为分隔符使用 |

隐藏目录（以 `.` 开头的名称）不会出现在结果中。

> **注意：** 子目录模式只会打开一个新终端到所选目录 —— 不会与代理进行组合。由于父目录可能包含大量子目录，若将其与所有已配置的代理进行组合，会产生选项的笛卡尔积，导致列表过于庞大。请在选择子目录后，在新打开的终端中手动启动你需要的代理。

## 平台支持

| 平台    | 终端                                                                                                       |
| ------- | ---------------------------------------------------------------------------------------------------------- |
| Windows | PowerShell（通过 `Start-Process` 打开新窗口）                                                              |
| macOS   | Terminal.app（通过 `osascript`）                                                                           |
| Linux   | 自动检测：gnome-terminal → x-terminal-emulator → xterm → konsole → xfce4-terminal → terminator → alacritty |

## 开发

```bash
# 克隆仓库
git clone https://github.com/neptune-constellation/pisces.git
cd pisces

# 安装依赖
pnpm install

# 以开发模式运行
pnpm dev

# 运行测试
pnpm test

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 构建
pnpm build
```

## 许可证

MIT © lysun001
