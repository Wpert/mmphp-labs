import { access, cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(projectRoot, "dist/7_sem/lab02");
const katex = resolve(projectRoot, "node_modules/katex/dist");
const scripts = resolve(projectRoot, "dist/lab02");

try {
  await access(scripts);
} catch {
  console.error("Не найден dist/lab02. Сначала выполните npm run build.");
  process.exit(1);
}

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "fonts"), { recursive: true });
await cp(resolve(projectRoot, "7_sem/lab02/index.html"), resolve(output, "index.html"));
await cp(resolve(projectRoot, "styles.css"), resolve(output, "styles.css"));
await cp(scripts, resolve(output, "js"), { recursive: true });
await cp(resolve(katex, "katex.min.js"), resolve(output, "katex.min.js"));
await cp(resolve(katex, "katex.min.css"), resolve(output, "katex.min.css"));
await cp(resolve(katex, "fonts"), resolve(output, "fonts"), { recursive: true });

console.log(`Built lab02 to ${output}`);
