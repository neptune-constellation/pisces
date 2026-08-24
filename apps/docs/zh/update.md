# 自我更新

pisces 可以从 npm 自我更新 —— 不用记住 `npm install` 的完整命令。

## 使用方法

以下三种写法效果相同：

```bash
pis self-update
pis --update
pis -u
```

命令会检查 npm 上 `@lysun001/pisces` 的最新版本：

- **已是最新** —— 输出 `Already on the latest version (vX.Y.Z).` 并退出。
- **有新版本** —— 为你执行 `npm install -g @lysun001/pisces@latest`，然后提示你重新运行 `pis`。

## 需要重启程序还是重启终端？

**重新运行 `pis` 即可** —— 不需要重启终端。更新替换的是磁盘上的程序文件；下次启动程序时新代码即生效。

## 其他 CLI 选项

| 选项              | 描述           |
| ----------------- | -------------- |
| `-v`、`--version` | 输出当前版本号 |
| `-h`、`--help`    | 输出帮助信息   |
