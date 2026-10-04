/**
 * 静态部署模式：直连 Frankfurter 公共 API（CORS 允许），不经过自建中转层。
 * 由 `vite build --mode static`（读取 `.env.static` 的 VITE_STATIC=1）开启；
 * 开发与默认构建仍走 `/api` 代理。
 */
export const STATIC_MODE = import.meta.env.VITE_STATIC === "1";
