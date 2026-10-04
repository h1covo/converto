# Converto — 对话上下文摘要（压缩版）

> 由「Real-time currency converter implementation plan」会话（45 轮、518 消息、~162M 缓存读）压缩而成。
> 用途：新会话接手时读这一份即可，无需回放原对话。

## 一句话
全栈「实时汇率转换器」**Converto**：React+TS+Vite 前端 + Node+Express 中转层，数据源 Frankfurter(ECB)，含现货换算、走势、多币种同屏、交叉盘矩阵、行情统计、市场数据实验室、收藏、历史、中英/暗色。

## 当前状态（已完成并验证）
- `npm test` **111/111**（server 33 + web 78）；`typecheck`、`build` 全绿；运行时错误 0。
- 项目根：`C:\Users\h1c\Documents\Default Project\currency-converter`（npm workspaces：`server/` + `web/`）。
- 最后一步：字体换成 **Inter Variable + Noto Sans SC 子集**（283 字 × 4 字重 ≈ 296KB，运行时字体资源 1.05MB→428KB）；子集脚本 `scripts/build-cjk-subset.js`。

## 技术栈与关键决策
- 前端 React+TS+Vite，Tailwind CSS；后端 Express；**前端不直连第三方**，走 `/api` 中转。
- 开发用 Vite proxy → Express(3001)；生产 Express 托管 `web/dist`，同源无 CORS。
- 精度用 **decimal.js**；换算为纯函数 `web/src/lib/convert.ts`，金额变化不发请求。
- 缓存：内存 TTL（现货 5min、历史 1h）+ 同 key 并发合并 + 上游失败降级 `stale`。
- 数据源局限（UI/README 已标注）：ECB 参考汇率，非秒级实时，周末沿用上一交易日，约 30 种法币。

## 后端 API 契约
| 路由 | 说明 |
|---|---|
| `GET /api/rates?from&to` | 现货单对；`{base,quote,rate,date,fetchedAt,cached,stale}`（rate 为字符串） |
| `GET /api/rates/history?from&to&days=7\|30\|90\|365` | 单对走势；`points:[{date,rate}]`，同币种生成工作日平线 |
| `GET /api/rates/all?from=` | 一次取全表（跨币种同屏 / 矩阵用） |
| `GET /api/rates/history/all?from=&days=30` | 全表序列；`series:{code:string[]}` + `dates` 字段（矩阵/实验室用） |
- 参数校验：非法币种/非法 days → 400；上游失败且无缓存 → 502。
- 通用缓存抽象：`server/src/services/ttlCache.ts` 的 `createTtlCache<V>`（现货/历史共用）。

## 目录与模块地图
- `web/src/lib/`：`convert.ts`(换算纯函数) `currencies.ts`(18 币种元数据) `currencySearch.ts` `trend.ts` `stats.ts` `analysis.ts` `i18n.ts` `state.ts` `storage.ts` `url.ts` `errors.ts`
- `web/src/api/`：`client.ts`(统一错误码) `rates.ts` `history.ts`
- `web/src/hooks/`：`useConverter`(共享状态) `useRate` `useHistory` `useAllRates` `useAllHistory` `useI18n` `useTheme`
- `web/src/components/`：`ConverterCard` `AmountInput` `CurrencySelect`(可搜索下拉) `SwapButton` `QuickPairs`(收藏+拖拽) `RateInfo` `CopyButton` `Star` `CurrencyBoard`(多币种) `CrossMatrix` `MarketStats` `HistoryList` `RateTrendChart` `Sparkline` `ThemeToggle` `LangToggle` `MarketLab`
- `web/src/components/lab/`：`StrengthMeter` `CorrelationMatrix` `VolatilityCalendar` `TimeMachine` `Simulator` `CrossTable`(矩阵/时间机器共用)
- `server/src/`：`currencies.ts`(18 白名单) `config.ts` `types.ts` `services/frankfurter.ts` `services/rateCache.ts` `services/ttlCache.ts` `routes/{rates,history,ratesAll,historyAll}.ts`

## 前端功能清单
- 换算（即时跟随输入，无防抖）、一键互换、金额输入归一化（全角数字/千分位/负号 → 合法）、边界内联提示、JPY 0 位小数。
- 走势图（7/30/90/365，手写 SVG，最高/最低/涨跌/悬浮提示）。
- 多币种同屏：桌面 4 列格子，每格 30 天涨跌% + 底部通栏 sparkline + 星标收藏。
- 交叉盘矩阵：18×18，EUR 公共基准用除法推导两两汇率，底色=近 30 天相对涨跌。
- 行情统计：日/周/月/年涨跌、52 周高低(+日期)、年化波动率、相对 30 日均值偏离。
- **市场数据**（原「市场实验室」）标签：强弱指数 / 相关性 / 波动率日历 / **历史交叉盘**（原时间机器） / 模拟交易。
- 收藏币对（转换器内「收藏 / 常用」两段，可拖拽排序，多币种+矩阵星标）、换算历史（最近 20 条回填）。
- 分享链接 + 状态持久化（URL > localStorage > 默认，键含 lang/theme）。
- 中英双语 + 浅/深色（`useTheme`，已去掉「跟随系统」）。

## 设计系统（frontend-design / aesthetic-review）
- 方向「交易所牌价」；`web/src/index.css` 统一组件层：`.card/.card-pad/.section-head/.section-title/.label/.micro/.pill/.btn(-primary/-ghost/-icon)/.chip/.seg/.stat/.field`。
- 语义色 CSS 变量，浅/深只切变量（不再满屏 `dark:`）；「牌价牌」超大等宽数字为唯一大胆元素。
- 字体：`Inter Variable`（拉丁/数字）+ `Noto Sans SC` 子集（中文），全局 `tabular-nums`。
- 布局（桌面双栏工作台）：转换器 | 走势/行情统计；多币种（4 列）通栏；交叉盘矩阵通栏；最近换算。移动端单列：转换器→走势→统计→收藏→多币种→矩阵→历史。

## 已修的真实 bug
- 中文输入法全角数字 / 粘贴 `1,000.50` 被判非法 → `normalizeAmountInput()`。
- 金额框/下拉「两层绿框」→ 全局 `:focus-visible` outline 叠加字段 focus 环，现为单一强调环。
- 多币种星标加边框后把代码与数值挤到重叠 → 复制按钮改悬停出现、不占位。
- 拖拽排序对换行布局不准 → 改「命中/最近」判定。

## 关键约定 / 坑（务必遵守）
- Windows PowerShell 禁 `npm.ps1`，一律用 **`npm.cmd`**；启动开发：`npm.cmd run dev`（前端 5173 / 后端 3001）。
- **不要用 PowerShell 做文件字符串替换**（PS5.1 按 GBK 读写 UTF-8 会把中文文档搞乱码丢行，已踩过）→ 用编辑/写入工具。
- 无头验证用 Edge CDP（`--dump-dom` 在 Edge153+ 返回空）；截图/探测脚本在 `%TEMP%\opencode\cc-*.js`。
- 新增中文文案后需重跑 `scripts/build-cjk-subset.js`，否则新字回退系统字体。

## 待办 / 可继续方向
- 未做（曾建议）：PWA 离线+安装、键盘快捷键、涨跌榜、到价提醒、多币种走势叠加、数据源可切换、加密货币(CoinGecko)、E2E(Playwright)、限流+`/api/health`、Docker/CI。
- 已有小建议：矩阵点星即收藏/取消（现仅标记）、矩阵悬停高亮整行/列、时间机器播放速度档、模拟交易多笔买卖点。
