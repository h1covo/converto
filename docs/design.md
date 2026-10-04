# Converto · 实时汇率转换器 — 设计文档

## 1. 目标与范围

单页应用：输入金额 → 选源/目标币种 → 实时显示换算结果，并展示当前汇率与数据更新时间。

- 支持币种（18）：USD、CNY、EUR、JPY、GBP、HKD、AUD、CAD、CHF、SGD、KRW、NZD、SEK、NOK、DKK、THB、INR、ZAR（Frankfurter 支持的常用法币）
- 数据源：Frankfurter API（ECB 参考汇率，免费、无需 API Key）
- 前端不直连第三方：由自建 Node 中转层统一取数并缓存

## 2. 架构

```
浏览器 (React + Vite)
  │  GET /api/...   （开发经 Vite proxy，生产同源）
  ▼
Express 中转层
  │  参数校验 → 内存 TTL 缓存(现货5min/序列1h) → 合并并发请求 → 降级
  ▼
Frankfurter API (ECB)
```

- 开发：Vite dev server 把 `/api` 代理到 `localhost:3001`
- 生产：Express 同时托管 `web/dist`，单一进程、同源

## 3. API 契约

- `GET /api/rates?from&to` → 单币对现货
- `GET /api/rates/all?from` → 基准币对全部受支持币种（一次请求）
- `GET /api/rates/history?from&to&days`（days∈{7,30,90,365}）→ 单币对时间序列 `points[]`
- `GET /api/rates/history/all?from&days` → 全表序列 `dates[]` + `series{code:[]}`

同币种（`from===to`）返回工作日平线（rate=1），不请求上游。错误码：`UNSUPPORTED_CURRENCY` / `INVALID_RANGE`（400）、`UPSTREAM_UNAVAILABLE`（502）。

## 4. 关键决策

| 项 | 决策 | 理由 |
|---|---|---|
| 金额精度 | decimal.js | 跨币种小数位不同（JPY 0 位），避免浮点误差 |
| 换算时机 | 本地即时（无防抖） | 纯函数本地计算，输入即时响应；主按钮改为「刷新汇率」 |
| 全表取数 | EUR 为公共基准一次取全表 + 除法推导两两汇率 | 避免 N² 请求；矩阵/时间机器复用 |
| 缓存 | 通用 TTL 缓存（并发合并 + 失败降级） | 现货 5 分钟、序列 1 小时 |
| 竞态 | 前端 AbortController + state key 守卫 | 旧结果不覆盖新结果 |

## 5. 边界处理

空输入不报错；0 合法；负数/超 1e15/非法字符内联提示；JPY/KRW 0 位小数；网络失败保留历史汇率并标注；加载骨架屏防跳动。

## 6. 目录结构

见 README。前后端分离为 `server/` 与 `web/` 两个 workspace。

## 7. 测试

- 前端纯函数：`convert` / `trend` / `stats` / `analysis` / `currencySearch` / `state` / `storage` / `i18n`
- 后端：`ttlCache` / `rateCache` / 各路由（rates / rates-all / history / history-all）
- 运行 `npm test`；CDP 无头做布局与交互验证

## 8. 已知局限

- ECB 参考汇率非秒级实时；周末/假日沿用上一交易日
- 约 30 种法币，无加密货币
- 内存缓存单进程有效，重启清空

## 9. 汇率走势

`/api/rates/history` 归一化为 `points[{date,rate}]`（仅交易日）；TTL 1 小时；同币种生成工作日平线。前端 `lib/trend.ts` 的 `buildTrendGeometry` 纯函数映射坐标，`RateTrendChart` 手写内联 SVG（折线 + 渐变面积 + 高/低 + 悬浮提示）。

## 10. 币种扩充与可搜索选择器

币种 6 → 18；元数据含 `code/symbol/zhName/enName/pinyin/decimals/popular`；`filterCurrencies(query)` 按「代码精确 > 代码前缀 > 拼音前缀 > 英文前缀 > 中文包含 > …」打分排序；`CurrencySelect` 为自包含可搜索下拉（↑↓/Enter/Esc、点击外部关闭、焦点归还）。

## 11. 多币种 / 持久化 / 收藏 / 复制 / 历史 / 双语主题

- 共享状态 `hooks/useConverter.tsx`：`from/to/amount/days` + 收藏 + 历史；初始化优先级 URL > localStorage > 默认；变更防抖 `replaceState` 同步 URL
- `lib/url.ts` 增量改 URL（多 Provider 不互相覆盖）；`api/client.ts` 统一抛出 `RateError{code}`，`lib/errors.ts` 映射 i18n key
- 多币种 `CurrencyBoard`（列其余 17 种）；复制 `CopyButton`；历史 `HistoryList`（稳定后记录、去重、上限 20）
- 中英双语 `useI18n` + 深色模式 `useTheme`（`darkMode:'class'`）

## 12. 视觉美化与交互优化

- 方向「交易所牌价」：纸白 + 墨绿黑 + 翡翠强调；结果「牌价牌」为唯一焦点，带极淡防伪网点底纹
- 字体：**Inter Variable**（拉丁/数字/代码，`@fontsource-variable/inter`）+ **Noto Sans SC 子集**（中文，`scripts/build-cjk-subset.js` 生成，仅页面用到的字符 × 4 字重）；两者自托管，全局 `tabular-nums`
- 语义色令牌（`index.css` CSS 变量 light/dark + `tailwind.config.js` 语义色），组件用语义类，暗色只切变量
- 微交互：下拉展开/焦点归还、互换旋转、收藏弹跳、结果数值入场；`prefers-reduced-motion` 降级
- 下拉重做：符号徽标 + 代码 + 名称；移动端隐藏徽标/名称只留代码；面板 `min(20rem,100vw-2.5rem)` 宽度 + 左右对齐防溢出
- **统一组件层**（`index.css`）：`.card`/`.card-pad`/`.section-head`/`.section-title`/`.label`/`.micro`/`.pill`/`.btn`+`.btn-primary`/`.btn-ghost`/`.btn-icon`/`.chip`/`.seg`+`.seg-item`/`.stat`/`.field`；全站圆角、间距、按钮、分段控件与表格风格统一；`::selection` 用强调色；暗色只切换 CSS 变量
- **焦点修复**：全局 `:focus-visible` 会对输入框再画一圈 outline，叠加字段自身的 focus 环 → 两层绿框；改为输入框不出 outline、`.field:focus-visible` 与字段用**单一** 2px 强调环（`box-shadow`）
- **星标重做**：统一组件 `components/Star.tsx`（`StarIcon` SVG 星 + `StarButton`）；未收藏低调描边、hover 变琥珀，已收藏为实心琥珀 + 琥珀底小方块；多币种格子星标统一到右上角最右，矩阵收藏对用同一 SVG 标记
- **下拉美化**：SVG 放大镜/下拉箭头/对勾，选中项 accent 底 + 对勾；打开时定位到当前项，键盘 Home/End，列表 `scroll-smooth`，过渡更顺
- **微文字**：`.micro` 加字距/行高；`清空` 改为 hover 小按钮；强弱指数用「较弱 [渐变条] 较强」图例 + 窗口 pill；各分区标签、stats、汇率元信息统一 `.micro`

## 13. 多币种迷你走势

- 后端 `/api/rates/history/all` 一次取全表序列
- `Sparkline`（纯展示、复用 `buildTrendGeometry`）通栏迷你图（`preserveAspectRatio=none` + `non-scaling-stroke` + 渐变面）；牌价格子：上行「徽标+代码/数值」，中行名称+30 天涨跌%，底行 sparkline

## 14. 行情统计 & 交叉盘矩阵

- 行情统计 `MarketStats`：`useHistory(from,to,365)` + `computeFxStats()` → 日/周/月/年涨跌、52 周高低+日期、30 日均值偏离、年化波动率（1Y 回溯不到整年时回退首尾涨跌）
- 交叉盘矩阵 `CrossMatrix`：EUR 基准一次取全表 + 除外，任意两两 = `rate(EUR→j)/rate(EUR→i)`；底色为近 30 天相对涨跌；抽 `lab/CrossTable` 复用

## 15. 品牌 / 输入 / 收藏交互

- 品牌 **Converto**（去掉了方块标，仅字标）；`document.title` 与 `index.html` 同步
- 金额输入：`normalizeAmountInput()` 全角→半角、去千分位空白；**去防抖**即时换算；主按钮「刷新汇率」
- 收藏：转换器内「收藏 / 常用」两段（无收藏时隐藏收藏段）；胶囊**拖拽排序**（window 指针事件 + `arrayMove`，命中/最近判定）；多币种格子星标可切换、矩阵收藏对带 ★

## 16. 市场数据（标签卡）

- `components/MarketLab.tsx`：强弱指数 / 相关性 / 波动率日历 / 历史交叉盘 / 模拟交易；子组件在 `components/lab/`
- 纯函数 `lib/analysis.ts`：`computeStrength`（相对其它币平均强弱）、`dailyReturns`/`pearson`/`computeCorrelationMatrix`、`computeWeeklyVolatility`、`simulateConversion`
- 数据：强弱/相关性/历史交叉盘用 `useAllHistory("EUR",365)`；波动率/模拟用 `useHistory(from,to,365)`
- **历史交叉盘**：`CrossTable` 按索引重建历史矩阵，底色为当日对前一日涨跌
- 后端 `/api/rates/history/all` 补 `dates` 字段（历史交叉盘日期标签）
- 测试：`analysis.test.ts`；CDP 逐标签验证 5 个视图渲染、运行时错误 0

## 17. 视觉方向 B：交易所牌价强化（frontend-design / aesthetic-review）

- **唯一强元素——「牌价牌」升级**：结果板为**浅色实体面板**（`.board`，`--board-bg/--board-ink/--board-muted/--board-accent`；浅色薄荷灰 `242 247 245` / 深色更亮 `238 244 241`，两主题都是浅板 + 深墨数字），emerald 仅用于币种后缀/细边环/角部光晕（`.board-texture`）；加载/错误态用板上深墨样式（`copy-on-board`）。整页其余元素一律安静；暗色下浅板成为唯一亮焦点。
- **层级分化**：新增**扁平参考面板** `.panel`（`bg-panel` 次级平面 + `ring-line`、无阴影、`rounded-xl`、`panel-pad` 更密）——多币种、交叉盘、市场数据、最近换算、行情统计均改用它；与浮起的 `.card`（`rounded-2xl` + `shadow-soft`）拉开层级。`.panel .section-head` 统一压一条发丝分隔线，形成台账感。
- **次级平面令牌**：`--panel`（浅 `238 242 239` 微凹 / 深 `15 25 22`），配套 Tailwind `panel` 色。
- **统计格**：`.stat` 改 `bg-surface` + `ring-line` 白瓷片；矩阵/相关性表格容器加 `bg-surface`（灰底上叠一张白表）。
- **节奏**：主区 `gap-5`，参考区 `gap-4`。
- **顺带修的真实 bug**：市场数据 5 个标签的 `.seg` 为 `inline-flex`，在 390 视口撑破页面（页面横向溢出 72px）→ 加 `max-w-full` 令其自身横向滚动；现 390/320 页面 `scrollWidth===clientWidth`。
- **验证（render→look→adjust，v1→v3）**：桌面浅/深 1366 全页、移动 390 全页、市场数据 相关性/历史交叉盘 标签、牌价牌 100% 裁切；`npm test` **111/111**、`typecheck`、`build` 通过；运行时错误 0；`--board` 暗色由 `6 16 13` 提到 `9 24 19` 以增强与近黑页面的分离。

## 18. 主题切换过渡 + h1× 水印

- **丝滑换肤（View Transitions）**：`useTheme.ts` 的 `setTheme` 用 `document.startViewTransition(() => flushSync(applyTheme + setState))` 做**整页 GPU 交叉溶解**（`::view-transition-old/new(root)` 240ms），不再逐元素 transition（旧方案 `html.theme-transition *` 因对全树设 `box-shadow/fill/stroke` 过渡而卡顿，已弃用）；不支持的浏览器直接切换，`prefers-reduced-motion` 跳过动画。
- **同步换色**：切换瞬间给 `<html>` 挂 `.theme-switching`，`html.theme-switching *` 设 `transition:none !important`——否则金额输入/币种下拉等自带 `transition` 的元素会先于整页跳变（新快照截到过渡中间态）。CDP 实测切换时 `#amount`/`.field` 的 `transitionDuration` 为 `0s`、`vtCalls:1`。
- **降低纯黑**：暗色令牌整体上提，避免「一块特别黑」——`--paper 10 17 15→13 20 18`、`--surface 18 29 26→22 33 30`、`--surface-2 24 38 34→30 43 39`、`--panel 15 25 22→18 28 25`、`--line 37 53 48→44 61 56`。
- **h1× 水印**（`.wm` / `.wm__x` / `.wm--ring` / `.wm--badge` / `.wm--footer`，全部 `aria-hidden`）：Inter 900、`×` 用 emerald。右下角固定角标为 38px 细圆环、muted 42% 不透明度、`pointer-events:none` 不挡点击、`z-index:20`（≤480px 缩为 32px）；页脚为无圆环纯字标。
- **验证**：CDP 实测切换瞬间 `theme-transition` 生效（`transitionDuration: 0.3s`）且 500ms 后移除、`.dark` 已切换；浅/深角标与页脚截图确认；`npm test` 111/111、`typecheck`、`build` 通过。
