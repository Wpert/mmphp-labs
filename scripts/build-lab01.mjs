import { cp, mkdir, rm } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const output = resolve(projectRoot, "dist/7_sem/lab01");
const katex = resolve(projectRoot, "node_modules/katex/dist");

await rm(output, { recursive: true, force: true });
await mkdir(resolve(output, "fonts"), { recursive: true });
await cp(resolve(projectRoot, "7_sem/lab01/index.html"), resolve(output, "index.html"));
await cp(resolve(katex, "katex.min.js"), resolve(output, "katex.min.js"));
await cp(resolve(katex, "katex.min.css"), resolve(output, "katex.min.css"));
await cp(resolve(katex, "fonts"), resolve(output, "fonts"), { recursive: true });

console.log(`Built lab01 to ${output}`);
