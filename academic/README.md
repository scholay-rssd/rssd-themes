# academic Theme

此处是学术站呈现端的唯一源码入口。`public/` 保留原首页、浏览器脚本、CSS、字体及品牌资源；部署后仍位于网站根路径，URL 不变。

`render.mjs` 实现统一 Theme 渲染接口。`content.mjs` 只读适配原已发布数据与命名栏目；`build-seo.mjs` 和 `archive-pages.mjs` 保留原页面与 sitemap 逻辑。原命令位于根 `scripts/`，作为兼容转发。

在仓库根目录运行 `npm test`、`npm run check`、`npm run web:preview` 或 `npm run web:release`。生产内容由服务器 SQLite 管理，不从根目录手工 JSON 覆盖线上数据。详见 `docs/five-site-themes.md`。

## Navigation and article categories

The four primary destinations are 今日学术 (`/#/year`, also the default root view), 昔日学术 (`/#/history`), 学术新闻 (`/archive/`) and 留言板. `/news/` remains a compatible alias of the news index; existing article URLs never move.

Academic news exposes all public article categories. The stable `calendar` section is labelled 今日学术 and `history` is labelled 昔日学术. Legacy `intelligence` routes include the calendar records; historical records previously assigned to `observations` are projected into `history` without changing their SQLite revisions. Other categories retain their explicit membership.

Both calendars read the same published `year` and `history` records used to generate the atomic article pages. Their small content-addressed JSON collections carry each eligible record's existing article URL. Articles link back to the calendar at their event date; publishing an ordinary article in a calendar category does not fabricate an event date. Unverified legacy calendar entries retain their existing eligibility and hash detail links.
