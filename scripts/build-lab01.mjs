import { access, cp, mkdir, rm, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { bundleLab } from "./bundle-lab.mjs";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(projectRoot, "dist/7_sem/lab01");
const katex = resolve(projectRoot, "node_modules/katex/dist");
const scripts = resolve(projectRoot, "dist/lab01");

try {
  await access(scripts);
} catch {
  console.error("Не найден dist/lab01. Сначала выполните npm run build.");
  process.exit(1);
}

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "js"), { recursive: true });
await mkdir(resolve(output, "fonts"), { recursive: true });
await cp(resolve(projectRoot, "7_sem/lab01/index.html"), resolve(output, "index.html"));
await cp(resolve(projectRoot, "styles.css"), resolve(output, "styles.css"));
await writeFile(resolve(output, "js/main.js"), await bundleLab(scripts));
await cp(resolve(katex, "katex.min.js"), resolve(output, "katex.min.js"));
await cp(resolve(katex, "katex.min.css"), resolve(output, "katex.min.css"));
await cp(resolve(katex, "fonts"), resolve(output, "fonts"), { recursive: true });

console.log(`Built lab01 to ${output}`);
