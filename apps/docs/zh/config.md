# 配置

所有配置都在一个文件里：

```text
~/.pisces/settings.json
```

（Windows 上为 `%USERPROFILE%\.pisces\settings.json`。）首次运行时会自动创建该文件，并且 pisces 会在文件变化时**热加载** —— 编辑保存即可，无需重启。

文件包含四个部分：`locations`、`agents`、`editors` 和 `default`。

## `locations`

每个条目代表一个你想打开的项目目录：

| 字段   | 类型                 | 必填 | 描述                                                 |
| ------ | -------------------- | ---- | ---------------------------------------------------- |
| `name` | `string`             | 是   | 显示名称（1–50 个字符，任意字符，含中日韩文字）      |
| `path` | `string`             | 是   | 目录的绝对路径                                       |
| `key`  | `string \| string[]` | 是   | 一个或多个搜索键（每个 1–20 字符，仅限 `[a-z0-9-]`） |

```json
{
  "locations": [{ "name": "code", "path": "C:\\Users\\You\\Desktop\\code", "key": ["b", "beta"] }]
}
```

## `agents`

每个条目代表一个你想启动的 AI 代理 CLI 命令：

| 字段      | 类型                 | 必填 | 描述                                                 |
| --------- | -------------------- | ---- | ---------------------------------------------------- |
| `name`    | `string`             | 是   | 显示名称（1–50 个字符，任意字符，含中日韩文字）      |
| `command` | `string`             | 是   | 要执行的 shell 命令                                  |
| `key`     | `string \| string[]` | 是   | 一个或多个搜索键（每个 1–20 字符，仅限 `[a-z0-9-]`） |
| `args`    | `string[]`           | 否   | 附加在命令后的参数（默认 `[]`）                      |

```json
{
  "agents": [{ "name": "claude", "command": "claude", "key": "cl", "args": ["--model", "sonnet"] }]
}
```

首次运行时，pisces 会自动检测以下已安装的代理 CLI 并为你添加：`claude`、`codex`、`opencode`、`kimi`、`crush`、`cline`、`kilo`、`pi`、`qoder`、`grok`、`gemini`、`omp`、`reasonix`。检测会检查每个命令是否在 PATH 上以及其已知的配置目录。如果你的代理未被检测到（或不在列表中），请参照上表自行添加条目。

## `editors`

每个条目代表一个可以打开目录的 GUI 代码编辑器或 IDE：

| 字段      | 类型                 | 必填 | 描述                                                 |
| --------- | -------------------- | ---- | ---------------------------------------------------- |
| `name`    | `string`             | 是   | 显示名称（1–50 个字符，任意字符，含中日韩文字）      |
| `command` | `string`             | 是   | PATH 上的启动命令（如 `code`）或可执行文件的绝对路径 |
| `key`     | `string \| string[]` | 是   | 一个或多个搜索键（每个 1–20 字符，仅限 `[a-z0-9-]`） |
| `args`    | `string[]`           | 否   | 附加在目录参数之前的参数（默认 `[]`）                |

```json
{
  "editors": [{ "name": "VS Code", "command": "code", "key": "vscode" }]
}
```

选中编辑器条目时，目录会在**编辑器自己的窗口**中打开 —— 不打开终端。编辑器条目和位置（location）的组合方式与代理完全相同：输入 `位置键 + 编辑器键` 在编辑器中打开该位置；只输入编辑器键则在当前目录打开编辑器。详见[搜索与键盘](./search)。

`command` 字段是编辑器的**启动命令**：可以是 PATH 上的命令（如 `code`、`pycharm`、`idea`），也可以是可执行文件的绝对路径（如 `C:\Users\You\AppData\Local\Programs\Microsoft VS Code\bin\code.cmd`）。手动添加编辑器时，通常填 PATH 上的命令即可；只有当编辑器不在 PATH 上时，才需要填绝对路径。

首次运行时，pisces 会检测以下已安装的编辑器并自动填入这一节：VS Code（`code`）、PyCharm（`pycharm`）、IntelliJ IDEA（`idea`）、Qoder（`qoder`）、Cursor（`cursor`）、Trae（`trae`）。检测到时，`command` 会被设置为解析出的启动器路径；未被检测到（或不在列表中）的编辑器，可参照上表手动添加。

## `default`

`Ctrl+D`（macOS 上也可用 `Cmd+D`）的可选快捷方式：无需输入，立即在固定路径打开终端并运行固定命令。

| 字段      | 类型     | 必填 | 描述                             |
| --------- | -------- | ---- | -------------------------------- |
| `path`    | `string` | 否   | 要打开的绝对路径（不设置则禁用） |
| `command` | `string` | 否   | 打开后执行的 shell 命令          |

```json
{
  "default": {
    "path": "C:\\Users\\You\\Desktop\\code",
    "command": "claude"
  }
}
```

如果 `default` 为空或缺失，按下 `Ctrl+D` 会打开一个空白终端窗口（就像手动启动 PowerShell）。初始生成的 settings.json 不包含 `default` —— 需要该快捷方式时请自行添加。

## 禁用代理或编辑器

默认显示两组条目。将 `agentsDisabled` 或 `editorsDisabled` 设为 `true` 即可在面板中隐藏对应条目 —— 例如你只想用代理启动项目、从不打开编辑器时：

```json
{
  "agentsDisabled": false,
  "editorsDisabled": true
}
```

这两个字段可选，默认 `false`（启用）。初始生成的 settings.json 不会包含它们 —— 只有当你想要隐藏某一组时，再自行添加。

## 键（key）

键是你在面板里输入的内容 —— 它是**搜索触发器，不是显示名称**。

- 仅限小写字母、数字和连字符（`[a-z0-9-]`），每个 1–20 个字符。
- 位置或代理可以声明**多个键**；任意一个键匹配，该条目即匹配。
- 匹配基于前缀且不区分大小写 —— 详见[搜索与键盘](./search)。
