# 学术海 · 个人主页

Scholay 产品经理「学术海」的个人主页与项目档案。使用 Next.js 静态导出，`pnpm dev` 本地预览，`pnpm build` 生成 `out/`。

## 内容

- 中文、英语、日语、法语、西班牙语的独立静态页面与语言切换；中文位于 `/`，其余使用 `/en/`、`/ja/`、`/fr/`、`/es/` 前缀。
- `/projects/` 汇总五个维护项目，各自具有站内详情页：Scholay Today、犀术输入法 RIMES、Scholay Skills、Scholay Wiki、Scholay 在线研究平台。
- RIMES 详情页汇集产品模块、各平台入口、原生 iOS 模拟器截图与文档；`/projects/rimes/input-schemes/` 提供输入方案搜索、分类、状态筛选与每页 24 条的分页。
- 当前方案目录收录 **299 个方案包**，其中 **219 个通过 Mac 主机验证**、**152 个提供本站 ZIP 下载**。导入与许可边界、排除项及更新方法见 [输入方案维护说明](docs/input-schemes.md)。
- 十个公开平台入口，以及个人定位与标语；顶部按钮连接 Today、Scholay、PM 和 GitHub。
- 首页 `/#keyboard` 展示本机 Blender 分体键盘模型，支持点击键帽、下压回弹、旋转、俯视、按键演示和聚焦后的实体键盘联动。3D 资源滚动到附近后才加载，无 WebGL 时保留预览图。
- 响应式布局、Open Graph、canonical、hreflang、sitemap、robots.txt，以及 Microsoft Clarity。
- `content/posts` 与 Pages CMS 配置暂保留；仅 `published: true` 的文章参与生成。现有演示稿未发布，文章路由待真实内容启用时恢复。

视觉布局与内容节奏参考 [Takuya Matsuyama 的主页](https://www.craftz.dog/) 和 [Craftzdog 开源项目](https://github.com/craftzdog/craftzdog-homepage)，页面组件与样式在本站实现。首屏使用本机 Scholay 3D 犀牛的渲染图与 2D 犀牛素材；工作台使用 D01 分体键盘的 GLB 模型，RIMES 项目页另用项目图标与原生模拟器截图。素材来源、帽子模型的 CC BY 3.0 署名与第三方声明见 [THIRD_PARTY_NOTICES.md](THIRD_PARTY_NOTICES.md)。

## 分体键盘模型

`scripts/export-split-keyboard.py` 从本机 `D01_R8_color.blend` 导出外观模型、85 个独立按键及预览图，不保存源工程。重新导出可使用：

```sh
/Applications/Blender.app/Contents/MacOS/Blender --background --python scripts/export-split-keyboard.py -- --source /absolute/path/to/D01_R8_color.blend
```

产物为 `public/models/split-keyboard.glb`、`split-keyboard.keys.json` 和 `public/visuals/split-keyboard-poster.webp`。键帽、文字与 F/J 定位凸条组合在同一个按键节点内；按键映射使用标准 `KeyboardEvent.code`。Three.js 仅在模型进入附近视口后加载，离开视口后停止渲染，页面关闭或卸载时释放资源。

## 本地更新与构建

```sh
pnpm install --frozen-lockfile
pnpm dev
```

检查并生成静态站：

```sh
pnpm lint
pnpm build
```

输入方案元数据位于 `src/lib/input-schemes.json`，通过 `scripts/sync-input-schemes.mjs` 从本机 RIMES 项目导入。ZIP 不进入 Git；新设备或构建机需要按 [维护说明](docs/input-schemes.md) 复制并校验下载资源。

## 发布

本站已迁入 today 私有仓库，作为 `personal` Theme 的首页实现。保留独立的 pnpm 依赖和静态导出；在仓库根目录执行：

```sh
npm run theme:install:personal
npm run theme:build -- personal
bash scripts/deploy-site.sh personal scholay-today-cloud 4183
```

构建的公开文件与统一文章、栏目和日历合成一个发布版本。生产目录为 `/opt/scholay-sites/personal/web/current`，由既有发布队列切换，不能单独覆盖首页目录。私有 Markdown 示例稿、构建源码和依赖不进入公开文件。

ZIP 与 `SHA256SUMS` 继续保留在 `/opt/today-scholay/input-schemes-20261007`，由 Nginx 的 `/downloads/rimes/` 路由读取，普通页面部署不会复制或改写这批资源。更新方案 JSON 时，仍需按 [输入方案维护说明](docs/input-schemes.md) 核对文件及校验值；文档中的旧首页部署方式仅作历史参考。

原始源码来源与导入文件校验见上层 `import-manifest.json`；署名和素材许可保留。
