# 快速开始

## 首次运行

第一次运行 `pis` 时，会出现引导提示：

```text
Allow scanning for already-installed agents to initialize your config?
› Yes, configure all detected agents
  Select which agents to configure
  No, I'll configure manually
```

- **Yes** —— pisces 扫描已知的代理 CLI（如 `claude`、`opencode`、`crush`），并自动写入配置。
- **Select** —— 扫描后用空格/回车勾选你想要的子集。
- **No** —— 从空配置开始，全部手动配置。

无论选哪个，配置文件都会创建在 `~/.pisces/settings.json`，你可以随时编辑 —— pisces 会在保存后**热加载**，无需重启。

## 配置你的目标

在 `~/.pisces/settings.json` 中添加项目目录（`locations`）和代理命令（`agents`）：

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

每个字段的说明见[配置](./config)。

## 开始使用

运行 `pis`，然后输入：

| 输入    | 效果                             |
| ------- | -------------------------------- |
| `b`     | 显示 `code` 目录及其所有代理组合 |
| `boc`   | 在 `code` 目录启动 `opencode`    |
| `oc`    | 在当前工作目录启动 `opencode`    |
| `b/`    | 浏览 `code` 的子目录             |
| `Enter` | 在新终端窗口中启动选中的条目     |

整个心智模型就是：**位置键 + 代理键**，按前缀匹配。完整行为见[搜索与键盘](./search)。
