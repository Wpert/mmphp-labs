import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";

function localImports(source) {
  return [...source.matchAll(/from\s+["']\.\/([^"']+)["']/g)].map((match) => match[1]);
}

function stripModules(source) {
  return source
    .replace(/import\s+[\s\S]*?\sfrom\s+["'][^"']+["'];?/g, "")
    .replace(/export\s+(?=function|const|class|let|var|async)/g, "");
}

/** Склеивает результат tsc в один обычный скрипт, который открывается через file://. */
export async function bundleLab(directory) {
  const sources = new Map();

  for (const name of await readdir(directory)) {
    if (name.endsWith(".js")) sources.set(name, await readFile(join(directory, name), "utf8"));
  }

  const ordered = [];
  const visiting = new Set();
  const visited = new Set();

  function visit(name) {
    if (visited.has(name)) return;
    if (!sources.has(name)) throw new Error(`Не найден модуль ${name}`);
    if (visiting.has(name)) throw new Error(`Цикл импортов: ${name}`);
    visiting.add(name);
    for (const dependency of localImports(sources.get(name))) visit(dependency);
    visiting.delete(name);
    visited.add(name);
    ordered.push(name);
  }

  for (const name of sources.keys()) visit(name);

  return ordered.map((name) => stripModules(sources.get(name))).join("\n");
}
