import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createApp } from "./app.js";
import { config } from "./config.js";

const here = path.dirname(fileURLToPath(import.meta.url));
// server/src（tsx）与 server/dist（构建后）到 web/dist 的相对层级相同
const webDist = path.resolve(here, "../../web/dist");
const staticDir = fs.existsSync(path.join(webDist, "index.html")) ? webDist : undefined;

const app = createApp({ staticDir });

app.listen(config.port, () => {
  const mode = staticDir ? "（含静态站点）" : "（仅 API）";
  console.log(`[server] listening on http://localhost:${config.port} ${mode}`);
});
