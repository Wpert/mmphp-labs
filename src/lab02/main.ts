import { MAX_STEPS } from "./constants.js";
import { drawChart, type ChartSeries } from "./chart.js";
import {
  canIntegrate,
  downsample,
  initialDeviation,
  simulate,
  stepCount,
  theoreticalPeriod,
  transitionMetrics,
  type SimulationParameters,
  type SimulationResult,
  type TransitionMetrics,
} from "./simulate.js";

declare const katex: {
  render(
    source: string,
    element: HTMLElement,
    options: { displayMode: boolean; throwOnError: boolean },
  ): void;
};

const POWER_COLOR = "#2563eb";
const RHO_COLOR = "#d35445";
const RATE_COLOR = "#25805b";
const PRECURSOR_COLOR = "#7c3aed";
const SAVED_COLORS = ["#8a6a2f", "#64748b", "#0f766e", "#9d174d", "#b45309", "#0369a1", "#6d28d9", "#3f6212"];

const linearIds = ["alphaW", "nUst", "beta", "lambda", "tEnd"] as const;
const logIds = ["x0", "tauP", "l", "h"] as const;
type LinearId = (typeof linearIds)[number];
type LogId = (typeof logIds)[number];

type SavedRun = {
  label: string;
  color: string;
  result: SimulationResult;
};

type ReferenceParameters = {
  alphaW: number;
  x0: number;
  tauP: number;
  nUst: number;
  l: number;
  beta: number;
  lambda: number;
  h: number;
  tEnd: number;
  a: number;
  b: number;
};

const REFERENCE: ReferenceParameters = {
  alphaW: -0.017,
  x0: 0.2,
  tauP: 0.075,
  nUst: 0.8,
  l: 0.001,
  beta: 0.0065,
  lambda: 0.0765,
  h: 0.0001,
  tEnd: 8,
  a: 1,
  b: 1,
};

const saved: SavedRun[] = [];

function element<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Не найден элемент #${id}`);
  return node as T;
}

function renderFormulas(): void {
  const formulas = document.querySelectorAll<HTMLElement>(".math-display, .formula-inline, .math-label");
  for (const formula of formulas) {
    const source = (formula.textContent ?? "").trim().replace(/^\\\(|\\\)$/g, "");
    katex.render(source, formula, {
      displayMode: formula.classList.contains("math-display"),
      throwOnError: false,
    });
  }
}

function formatInput(value: number): string {
  if (value === 0) return "0";
  const magnitude = Math.abs(value);
  if (magnitude >= 0.0001 && magnitude < 10000) return String(Number(value.toPrecision(6)));
  return value.toExponential(4);
}

function readNumber(id: string): number {
  return Number(element<HTMLInputElement>(id).value);
}

function readParameters(): SimulationParameters {
  return {
    a: element<HTMLInputElement>("keyA").checked ? 1 : 0,
    b: element<HTMLInputElement>("keyB").checked ? 1 : 0,
    alphaW: readNumber("alphaW"),
    x0: readNumber("x0"),
    tauP: readNumber("tauP"),
    nUst: readNumber("nUst"),
    l: readNumber("l"),
    beta: readNumber("beta"),
    lambda: readNumber("lambda"),
    h: readNumber("h"),
    tEnd: readNumber("tEnd"),
  };
}

function setLinear(id: LinearId, value: number): void {
  element<HTMLInputElement>(id).value = formatInput(value);
  element<HTMLInputElement>(`${id}Range`).value = String(value);
}

function setLog(id: LogId, value: number): void {
  element<HTMLInputElement>(id).value = formatInput(value);
  element<HTMLInputElement>(`${id}Range`).value = String(Math.log10(value));
}

function setKeys(a: number, b: number): void {
  element<HTMLInputElement>("keyA").checked = a === 1;
  element<HTMLInputElement>("keyB").checked = b === 1;
}

function applyReference(patch: Partial<ReferenceParameters>): void {
  const next = { ...REFERENCE, ...patch };
  setLinear("alphaW", next.alphaW);
  setLinear("nUst", next.nUst);
  setLinear("beta", next.beta);
  setLinear("lambda", next.lambda);
  setLinear("tEnd", next.tEnd);
  setLog("x0", next.x0);
  setLog("tauP", next.tauP);
  setLog("l", next.l);
  setLog("h", next.h);
  setKeys(next.a, next.b);
}

function formatSigned(value: number, digits: number): string {
  if (!Number.isFinite(value)) return "—";
  if (Math.abs(value) >= 1000 || (value !== 0 && Math.abs(value) < 1e-3)) return value.toExponential(3);
  return value.toFixed(digits);
}

function formatOptional(value: number | null, digits: number): string {
  return value === null ? "—" : formatSigned(value, digits);
}

function renderMetrics(metrics: TransitionMetrics): void {
  const blownUp = metrics.regime === "расходится";
  const values = [
    String(metrics.a),
    String(metrics.b),
    formatSigned(metrics.dw0, 3),
    blownUp ? "—" : formatSigned(metrics.dwFinal, 4),
    blownUp ? "—" : formatSigned(metrics.powerFinal, 4),
    metrics.overshoot > 10 ? "> 1000 %" : `${(metrics.overshoot * 100).toFixed(1)} %`,
    formatOptional(metrics.settlingTime, 3),
    formatOptional(metrics.period, 3),
    metrics.regime,
  ];
  const row = document.createElement("tr");
  for (const value of values) {
    const cell = document.createElement("td");
    cell.textContent = value;
    row.append(cell);
  }
  element("metrics").replaceChildren(row);

  const theory = metrics.theoreticalPeriod;
  element("periodNote").textContent =
    theory === null
      ? "Оценка периода не определена: коэффициент усиления равен нулю."
      : `Оценка периода регулятора 2π√(τ_p / x_0) = ${theory.toFixed(3)} с.`;
}

function series(result: SimulationResult, key: "dw" | "dc" | "rho" | "z", color: string, dashed = false): ChartSeries {
  return { x: result.t, y: result[key], color, dashed, width: dashed ? 1.5 : 2.2 };
}

/** Обрезает разгон, чтобы на графике было видно начало неустойчивости, а не одну огромную точку. */
function forPlot(result: SimulationResult): SimulationResult {
  let end = result.t.length;
  for (let index = 0; index < result.dw.length; index += 1) {
    if (Math.abs(result.dw[index]) > 4 || Math.abs(result.rho[index]) > 0.2) {
      end = Math.max(index + 1, 2);
      break;
    }
  }
  const sliced =
    end === result.t.length
      ? result
      : {
          t: result.t.slice(0, end),
          dw: result.dw.slice(0, end),
          dc: result.dc.slice(0, end),
          rho: result.rho.slice(0, end),
          z: result.z.slice(0, end),
          diverged: result.diverged,
        };
  return downsample(sliced);
}

function draw(current: SimulationResult): void {
  const plot = forPlot(current);
  const savedLines = saved.map((run) => run.result);
  const power: ChartSeries[] = [
    ...saved.map((run) => series(run.result, "dw", run.color, true)),
    series(plot, "dw", POWER_COLOR),
  ];
  const rho: ChartSeries[] = [
    ...savedLines.map((run, index) => series(run, "rho", saved[index].color, true)),
    series(plot, "rho", RHO_COLOR),
  ];
  const rate: ChartSeries[] = [
    ...savedLines.map((run, index) => series(run, "z", saved[index].color, true)),
    series(plot, "z", RATE_COLOR),
  ];
  const precursors: ChartSeries[] = [
    ...savedLines.map((run, index) => series(run, "dc", saved[index].color, true)),
    series(plot, "dc", PRECURSOR_COLOR),
  ];

  drawChart(element("power"), power, "δw");
  drawChart(element("rho"), rho, "ρст");
  drawChart(element("rate"), rate, "Z");
  drawChart(element("precursors"), precursors, "δc");
  renderLegend();
}

function renderLegend(): void {
  const legend = element("legend");
  legend.replaceChildren();
  if (saved.length === 0) return;

  const current = document.createElement("span");
  current.append(swatch(POWER_COLOR), document.createTextNode("текущий расчёт"));
  legend.append(current);
  saved.forEach((run) => {
    const item = document.createElement("span");
    item.append(swatch(run.color), document.createTextNode(run.label));
    legend.append(item);
  });
}

function swatch(color: string): HTMLElement {
  const mark = document.createElement("i");
  mark.className = "swatch";
  mark.style.background = color;
  return mark;
}

function runLabel(parameters: SimulationParameters): string {
  return `A=${parameters.a}, B=${parameters.b}, αw=${formatInput(parameters.alphaW)}, x0=${formatInput(parameters.x0)}, τ=${formatInput(parameters.tauP)}`;
}

let scheduledRun = 0;

function scheduleRun(): void {
  window.clearTimeout(scheduledRun);
  scheduledRun = window.setTimeout(() => run(), 40);
}

function run(): SimulationResult | undefined {
  const parameters = readParameters();
  const status = element("status");
  if (!canIntegrate(parameters)) {
    status.textContent = "Проверьте параметры: шаг, интервал, l, τ_p, β, λ и n_уст должны быть положительными.";
    return;
  }

  const steps = stepCount(parameters);
  if (steps > MAX_STEPS) {
    status.textContent = `Слишком много шагов (${steps}). Увеличьте h или сократите интервал. Предел — ${MAX_STEPS}.`;
    return;
  }

  const result = simulate(parameters);
  const metrics = transitionMetrics(parameters, result);
  draw(result);
  renderMetrics(metrics);
  const dw0 = initialDeviation(parameters.nUst);
  const theory = theoreticalPeriod(parameters);
  status.textContent = result.diverged
    ? `Расчёт расходится. δw(0) = ${formatSigned(dw0, 3)}. Уменьшите x_0 или шаг h.`
    : `δw(0) = ${formatSigned(dw0, 3)}, точек ${result.t.length}, t = ${parameters.tEnd} с${theory ? `, Tтеор = ${theory.toFixed(3)} с` : ""}`;
  return result;
}

function bindLinear(): void {
  for (const id of linearIds) {
    const numberInput = element<HTMLInputElement>(id);
    const rangeInput = element<HTMLInputElement>(`${id}Range`);
    rangeInput.addEventListener("input", () => {
      numberInput.value = rangeInput.value;
      scheduleRun();
    });
    numberInput.addEventListener("input", () => {
      if (numberInput.value !== "") rangeInput.value = numberInput.value;
    });
    numberInput.addEventListener("change", () => run());
  }
}

function bindLog(): void {
  for (const id of logIds) {
    const numberInput = element<HTMLInputElement>(id);
    const rangeInput = element<HTMLInputElement>(`${id}Range`);
    rangeInput.addEventListener("input", () => {
      numberInput.value = formatInput(10 ** Number(rangeInput.value));
      scheduleRun();
    });
    numberInput.addEventListener("input", () => {
      const value = Number(numberInput.value);
      if (value > 0) rangeInput.value = String(Math.log10(value));
    });
    numberInput.addEventListener("change", () => run());
  }
}

function bindKeys(): void {
  element("keyA").addEventListener("change", () => run());
  element("keyB").addEventListener("change", () => run());
}

function bindPresets(): void {
  const presets: Record<string, Partial<ReferenceParameters>> = {
    stable: {},
    oscillatory: { x0: 0.55, tEnd: 10 },
    unstable: { x0: 0.7, tEnd: 12 },
    power: { a: 0, b: 1 },
    regulator: { a: 1, b: 0 },
    open: { a: 0, b: 0 },
  };

  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset ?? "";
      if (preset === "power" || preset === "regulator" || preset === "open") {
        const keys = presets[preset];
        setKeys(keys.a ?? 0, keys.b ?? 0);
      } else {
        applyReference(presets[preset] ?? {});
      }
      run();
    });
  }
}

function bindSavedRuns(): void {
  element("save").addEventListener("click", () => {
    const current = run();
    if (!current) return;
    const parameters = readParameters();
    saved.push({
      label: runLabel(parameters),
      color: SAVED_COLORS[saved.length % SAVED_COLORS.length],
      result: forPlot(current),
    });
    draw(current);
    element("status").textContent = `Сохранено вариантов: ${saved.length}. Пунктир — сохранённые кривые.`;
  });

  element("clear").addEventListener("click", () => {
    saved.length = 0;
    run();
  });

  element("export").addEventListener("click", () => {
    const current = run();
    if (!current) return;
    const runs = saved.length > 0 ? saved : [{ label: "текущий", color: POWER_COLOR, result: forPlot(current) }];
    const lines = ["run,label,t,dw,dc,rho,z"];
    runs.forEach((entry, index) => {
      entry.result.t.forEach((time, point) => {
        lines.push(
          `${index + 1},"${entry.label}",${time},${entry.result.dw[point]},${entry.result.dc[point]},${entry.result.rho[point]},${entry.result.z[point]}`,
        );
      });
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`${lines.join("\n")}\n`], { type: "text/csv" }));
    link.download = "lab02_power_regulation.csv";
    link.click();
  });
}

renderFormulas();
bindLinear();
bindLog();
bindKeys();
bindPresets();
bindSavedRuns();
window.addEventListener("resize", () => run());
run();
