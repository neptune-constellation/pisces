# 常见问题

## 我的配置存在哪里？

`~/.pisces/settings.json`（Windows 上为 `%USERPROFILE%\.pisces\settings.json`）。首次运行时会自动创建目录和文件。详见[配置](./config)。

## 编辑 settings.json 后需要重启 pis 吗？

不需要。配置文件被监听并**热加载** —— 保存文件后面板会在 pisces 运行时自动更新。

## 键（key）可以用哪些字符？

仅限小写字母、数字和连字符（`[a-z0-9-]`），每个 1–20 个字符。键是搜索触发器，不是显示名称 —— `name` 字段可以包含任意字符，包括中日韩文字。

## 位置或代理可以有多个键吗？

可以。传入数组即可：`"key": ["b", "beta"]`。任意一个键匹配，该条目即匹配。

## 我按了 Ctrl+D 却出现警告 —— 为什么？

你的 settings.json 中 `default` 部分为空或缺失。添加它即可启用该快捷键：

```json
"default": { "path": "/path/to/project", "command": "claude" }
```

macOS 上 `Cmd+D` 同样有效。详见[配置 → default](./config#default)。

## 为什么子目录浏览不和代理组合？

一个位置可能包含很多子目录，把每个子目录都和所有已配置的代理组合，会产生选项的笛卡尔积 —— 面板会变得无法使用。所以子目录模式只打开纯终端；请手动启动你的代理。详见[子目录浏览](./subdirs)。

## 启动条目时打开的是哪个终端？

在目标目录打开一个**新的终端窗口**：Windows 上是 PowerShell，macOS 上是 Terminal.app，Linux 上自动检测终端模拟器。详见[安装 → 平台支持](./install#平台支持)。

## 如何更新 pisces？

```bash
pis self-update
```

详见[自我更新](./update)。

## 如何卸载？

```bash
npm uninstall -g @lysun001/pisces
```

手动删除 `~/.pisces/` 以清除你的配置。
