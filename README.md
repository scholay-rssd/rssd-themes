# RSSD Themes

RSSD 的公开页面主题、独立首页和浏览器导出模板。在组合工作区中位于 `web/themes/`。

**玩法、资源、写作流程与十站 Demo，统一见 [RSSD 主仓](https://github.com/scholay-rssd/rssd)。**

## 主题与输出

学术呈现位于 `academic/public/`；作品集与个人站保留各自的首页源码和构建配置，个人首页保留独立 pnpm 锁文件。[导出模板目录](export/README.md) 维护各站点、栏目的分页图片与公众号输出。

在 RSSD 根工作区构建首页：

```sh
npm run theme:build -- <siteId>
```

## 独立构建

使用 Node.js 24+，在本仓库运行 `npm run build`。构建会读取 `compatibility.json` 中固定的公开核心版本，在 `.local/` 组装依赖并叠加当前主题；产物也保存在 `.local/`，无需私有仓库或账号。

部署使用通过验证的静态产物；构建本身不执行部署。代码和素材的权利分别见 [NOTICE](NOTICE.md)。
