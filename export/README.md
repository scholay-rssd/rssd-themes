# Browser export templates

`registry.mjs` explicitly registers 60 site/section combinations and 120 output
identities. Every combination has its own `siteId:sectionId:pages` and
`siteId:sectionId:wechat` identity. Page exports retain the site's paper, ink and
type family; WeChat uses a white reading surface with the same section accent.
These templates are independent of the desktop templates.

| Site | Workspace | Registered sections | Output identities |
| --- | --- | ---: | ---: |
| 今日学术 (`scholay-today`) | `academic` | 8 | 16 |
| 研究方法 (`metho`) | `metho` | 4 | 8 |
| 学术之门 (`enter`) | `enter` | 4 | 8 |
| 犀术智法 (`legis`) | `legis` | 4 | 8 |
| 犀术国学 (`xsiching`) | `xsiching` | 4 | 8 |
| 智能学堂 (`study`) | `study` | 4 | 8 |
| 犀术 IME (`lingxi`) | `lingxi` | 8 | 16 |
| 小猪盖被 (`piggytuck`) | `design` | 8 | 16 |
| 学术海 (`personal`) | `personal` | 8 | 16 |
| 小猪萌宠 (`pets`) | `pets` | 8 | 16 |

The four additional sections at each of the following sites retain historical
content. They have authored registry entries rather than seeded fallback
styles. The original 44 section definitions remain unchanged.

| Site | Section | Accent | Layout | Direction |
| --- | --- | --- | --- | --- |
| 小猪盖被 | 历史文章 (`archive`) | `#875d62` | `essay` | Muted rose, an open design notebook |
| 小猪盖被 | 设计日历 (`calendar`) | `#9b6039` | `ledger` | Warm apricot, a dated studio ledger |
| 小猪盖被 | 设计历史 (`history`) | `#80634f` | `archive` | Umber, a restrained design archive |
| 小猪盖被 | 设计资源 (`open-source`) | `#49796f` | `technical` | Teal, a practical maker reference |
| 犀术 IME | 历史文章 (`archive`) | `#5a6a7d` | `essay` | Slate, quiet input notes |
| 犀术 IME | 输入日历 (`calendar`) | `#486e7c` | `ledger` | Cool blue, a release and activity log |
| 犀术 IME | 输入历史 (`history`) | `#6f6783` | `archive` | Muted violet, an input history archive |
| 犀术 IME | 工具与资源 (`open-source`) | `#487565` | `technical` | Sage, a technical reference |
| 学术海 | 历史文章 (`archive`) | `#65685f` | `essay` | Olive grey, a personal journal |
| 学术海 | 个人日历 (`calendar`) | `#7a704e` | `ledger` | Soft brass, a clear personal schedule |
| 学术海 | 项目足迹 (`history`) | `#5d717a` | `archive` | Steel blue, a record of product work |
| 学术海 | 工具箱 (`open-source`) | `#55795c` | `guide` | Green, a readable toolbox guide |
| 小猪萌宠 | 历史文章 (`archive`) | `#8b614b` | `essay` | Warm brown, everyday animal stories |
| 小猪萌宠 | 萌宠日历 (`calendar`) | `#86663a` | `ledger` | Honey, a calm care and activity log |
| 小猪萌宠 | 动物故事 (`history`) | `#79664e` | `archive` | Sand, a story archive on warm paper |
| 小猪萌宠 | 宠物资源 (`open-source`) | `#52735d` | `guide` | Forest green, a practical resource guide |

The seeded fallback supports previews of unregistered sections only. It is not
counted as catalog coverage. Register both output identities before enabling a
new section's published content, then extend the public core's
`tests/rssd-browser-export.test.mjs` coverage list.
