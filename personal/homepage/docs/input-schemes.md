# RIMES 输入方案目录维护

本站目录由 RIMES 的 [`Catalog/input-schemes/index.json`](https://github.com/scholay/rimes/blob/main/Catalog/input-schemes/index.json) 派生，入口是 `/projects/rimes/input-schemes/`，另有英语、日语、法语和西班牙语版本。搜索、分类、验证与下载筛选在浏览器中执行，每页显示 24 个包。

## 当前快照与验证含义

2026-10-07 的本站快照包含：

| 指标 | 数量 | 含义 |
| --- | ---: | --- |
| 收录方案包 | 299 | 包含可下载、仅链接上游及待适配的包 |
| Mac 主机验证 | 219 | RIMES 导入器接受包，Mac 主机上的对应引擎完成部署与加载验证 |
| 实际 ZIP 下载 | 152 | 本站已有文件，大小与 SHA-256 均与源目录记录一致 |

这三个数字应从 JSON 和实际资源计算，后续同步后可能变化。源目录中的 `publishable` 当前为 156 个；本站另外排除四个已知缺少许可附件的包，故实际下载数为 152。

方案列表中的“静态检查通过”来自方案文件的 `importable` 标记，只说明配置与依赖的静态检查通过。包仍可能在导入、部署或引擎加载时失败，应结合包级别的验证状态判断。

“Mac 主机验证”不代表所有方案已经在 iPhone 上实际键入，也不代表所有操作系统都提供导入支持。当前只有 **iOS 主 App** 提供第三方 ZIP 方案包导入；macOS、Android、Windows 和 Linux 尚无本站目录对应的应用内导入入口。手机上的部署速度、内存占用、Lua 行为和输入体验需要单独验证。页面中的部署用时与峰值内存为 Mac 主机测量值。

适用 iOS 版本中，在主 App 的设置打开“Rime 方案包与导入”，选择 ZIP、检查方案，完成部署与试输后再启用。具体契约与限制以 [RIMES 方案目录说明](https://github.com/scholay/rimes/blob/main/Catalog/input-schemes/README.md) 为准。

## 托管与许可排除项

同步脚本只托管同时满足以下条件且通过字节校验的 ZIP：源记录标为 `publishable`，包级别状态为 `verified`，再分发类别为 `open`，设备资源等级不是 `high`，并且不在本站排除列表中。其他记录保留在目录，提供上游链接。

以下四个固定版本的 ZIP 含有 `jyut6ping3.maps.dict.yaml`，但缺少该组成数据对应的 ODbL 许可附件。主上游仓库的许可证字段不能代替包内全部组成数据的许可说明，因此本轮不提供它们的本站下载：

| 包 ID | 名称 |
| --- | --- |
| `cantonese` | 粵語拼音 |
| `tupa` | 切韻拼音 |
| `combo-jyutping` | 宮保粵拼 |
| `jyutgaan` | 粵語簡拼 |

排除列表位于 `scripts/sync-input-schemes.mjs` 的 `excludedDownloads`。RIMES 补齐附件并重新构建后，应重新审核实际 ZIP 及校验值，再更新该列表。本站不改写 RIMES 源文件或方案包内容。

每个已托管包保留其来源许可证、署名、固定上游版本及修改清单。本站代码的许可证不替代方案、词库及其组成数据的许可证；整体来源说明见 [THIRD_PARTY_NOTICES.md](../THIRD_PARTY_NOTICES.md)。

## 同步元数据与 ZIP

默认来源项目为 `<RIMES_SOURCE>`。脚本读取：

- `Catalog/input-schemes/index.json`：包元数据与验证状态。
- `build/input-schemes/packages/`：本机已构建的 ZIP；该目录不在 RIMES Git 中。

全量同步当前 152 个可下载 ZIP：

```sh
node scripts/sync-input-schemes.mjs --copy-downloads --max-download-bytes 1000000000
```

当前下载资源总计 **850,449,469 字节**。脚本默认复制上限为 600,000,000 字节，因此全量同步需显式提高上限；新增资源后应按实际汇总重新设定。

另一台机器或不同路径的 RIMES checkout 可覆盖来源：

```sh
node scripts/sync-input-schemes.mjs --source /absolute/path/to/rimes --copy-downloads --max-download-bytes 1000000000
```

仅刷新元数据并识别本站已有 ZIP：

```sh
node scripts/sync-input-schemes.mjs --source /absolute/path/to/rimes
```

不传 `--copy-downloads` 时，只有本站目录中已经存在、大小与 SHA-256 完全匹配的文件才会获得 `downloadUrl`。它不会根据文件名或源目录的 `publishable` 标记生成不存在的下载。

| 参数 | 默认值 / 用途 |
| --- | --- |
| `--source` | 默认本机 RIMES 路径；覆盖读取来源 |
| `--output` | `src/lib/input-schemes.json`；元数据输出文件 |
| `--download-dir` | `public/downloads/rimes`；本站 ZIP 与校验清单目录 |
| `--download-base` | `/downloads/rimes`；生成下载链接的 URL 前缀 |
| `--copy-downloads` | 复制允许托管的 ZIP，先校验源文件，再校验复制结果 |
| `--max-download-bytes` | 全量复制的总字节上限 |

脚本使用公开字段白名单生成 JSON，不导出本机诊断路径、探针文本、内部备注或日志。输出中的 `updatedAt` 取源索引文件的修改时间，表示此份目录快照的文件时间。

## Git 与校验清单

`public/downloads/rimes/.gitignore` 排除 `*.zip`；元数据 JSON、该忽略文件与 `SHA256SUMS` 可纳入 Git。ZIP 必须作为独立部署资源保存，新 checkout 不会自动获得下载文件。

脚本验证每个 ZIP 的大小与 SHA-256，并为实际可下载的文件生成 `public/downloads/rimes/SHA256SUMS`。在 macOS 上可再次核对目录：

```sh
cd public/downloads/rimes
shasum -a 256 -c SHA256SUMS
```

Linux 使用 `sha256sum -c SHA256SUMS`。校验清单对应实际 ZIP 字节，若从 RIMES 重建包导致内容变化，必须同步 JSON、ZIP 和清单，不能覆盖资源后继续保留旧校验值。

## 部署资源目录

页面由 today 仓库的 personal Theme 构建，Nginx 根目录是 `/opt/scholay-sites/personal/web/current`。下载资源独立放在：

```text
/opt/today-scholay/input-schemes-20261007/
├── SHA256SUMS
└── rimes-scheme-*.zip
```

Nginx 用 `/downloads/rimes/` 的 alias 直接读取该目录。普通 Theme 构建和部署不复制 ZIP，也不在页面版本里创建下载软链接。多语言页面共享原来的下载 URL。

初次上传或更换资源快照时，将 ZIP 和 `SHA256SUMS` 一起上传到新的版本目录，并在服务器中执行 `sha256sum -c SHA256SUMS`。核对文件数量、大小与 JSON 下载链接后，再更新 Nginx alias，并用 `nginx -t` 验证后 reload。页面和资源元数据要一起核对，旧资源目录保留供回退。

代码发布在 today 仓库根目录执行 `bash scripts/deploy-site.sh personal <SSH目标> 4183`。发布后从正式域名回读首页、五项目详情页、五语言目录，并检查至少一个 ZIP 的 HTTP 下载和 `SHA256SUMS`。只有确认发布队列成功和新版本已生效，才算完成。
