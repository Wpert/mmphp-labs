import { FUEL_TEMPERATURE_NOMINAL } from "./constants.js";
import { drawChart } from "./chart.js";
import {
  canIntegrate,
  simulate,
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
const TEMPERATURE_COLOR = "#d35445";
const PRECURSOR_COLOR = "#25805b";
const parameterIds = ["r", "s", "lambda", "h", "tEnd"] as const;

type ParameterId = (typeof parameterIds)[number];
type SavedRun = {
  parameters: SimulationParameters;
  metrics: TransitionMetrics;
  result: SimulationResult;
};

const saved: SavedRun[] = [];
let current: SavedRun | undefined;

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

function readParameters(): SimulationParameters {
  return {
    r: readParameter("r"),
    s: readParameter("s"),
    lambda: readParameter("lambda"),
    h: readParameter("h"),
    tEnd: readParameter("tEnd"),
  };
}

function readParameter(id: ParameterId): number {
  return Number(element<HTMLInputElement>(id).value);
}

function setParameter(id: ParameterId, value: number): void {
  element<HTMLInputElement>(id).value = String(value);
  element<HTMLInputElement>(`${id}Range`).value = String(value);
}

function formatMetric(value: number, digits: number, exponential = false): string {
  if (!Number.isFinite(value)) return "—";
  if (exponential) return value.toExponential(3);
  return value.toFixed(digits);
}

function metricCells(entry: SavedRun): string[] {
  const { parameters, metrics } = entry;
  return [
    formatMetric(parameters.r, 2),
    formatMetric(parameters.s, 2),
    formatMetric(parameters.lambda, 4),
    formatMetric(metrics.nExtreme, 4),
    formatMetric(metrics.nFinal, 4),
    formatMetric(metrics.fuelTemperatureFinal, 2),
    formatMetric(metrics.deltaRho, 3, true),
    formatMetric(metrics.deltaRhoOverBeta, 3, true),
  ];
}

function tableEntries(): SavedRun[] {
  if (saved.length > 0) return saved;
  return current ? [current] : [];
}

function renderMetrics(): void {
  const body = element("metrics");
  body.replaceChildren();
  for (const entry of tableEntries()) {
    const row = document.createElement("tr");
    for (const value of metricCells(entry)) {
      const cell = document.createElement("td");
      cell.textContent = value;
      row.append(cell);
    }
    body.append(row);
  }
  element("tableNote").textContent =
    saved.length > 0
      ? `Сохранено вариантов: ${saved.length}.`
      : "Пока нет сохранённых вариантов, в таблице текущий расчёт.";
}

function downloadCsv(filename: string, lines: string[]): void {
  const link = document.createElement("a");
  link.href = URL.createObjectURL(new Blob([`\uFEFF${lines.join("\n")}\n`], { type: "text/csv;charset=utf-8" }));
  link.download = filename;
  link.click();
}

function run(): SavedRun | undefined {
  const parameters = readParameters();
  if (!canIntegrate(parameters)) return;

  const status = element("status");
  status.textContent = "Расчёт выполняется...";

  const result = simulate(parameters);
  const metrics = transitionMetrics(parameters, result);
  current = { parameters, metrics, result };
  drawChart(element<HTMLCanvasElement>("power"), result.t, result.n, POWER_COLOR, "N");
  drawChart(
    element<HTMLCanvasElement>("temp"),
    result.t,
    result.temp.map((temperature) => temperature * FUEL_TEMPERATURE_NOMINAL),
    TEMPERATURE_COLOR,
    "TТ, °C",
  );
  drawChart(element<HTMLCanvasElement>("precursors"), result.t, result.c, PRECURSOR_COLOR, "C");
  renderMetrics();
  status.textContent = `Расчёт: ${result.t.length} точек, t=${parameters.tEnd} с`;

  return current;
}

function bindParameters(): void {
  for (const id of parameterIds) {
    const numberInput = element<HTMLInputElement>(id);
    const rangeInput = element<HTMLInputElement>(`${id}Range`);

    rangeInput.addEventListener("input", () => {
      numberInput.value = rangeInput.value;
      run();
    });
    numberInput.addEventListener("input", () => {
      if (numberInput.value !== "") rangeInput.value = numberInput.value;
    });
    numberInput.addEventListener("change", () => run());
  }
}

function bindPresets(): void {
  for (const button of document.querySelectorAll<HTMLButtonElement>("[data-preset]")) {
    button.addEventListener("click", () => {
      const preset = button.dataset.preset;
      setParameter("r", preset === "negative" ? -0.3 : 0.3);
      setParameter("s", preset === "open" ? 0 : 1);
      run();
    });
  }
}

function bindSavedRuns(): void {
  element("save").addEventListener("click", () => {
    const entry = run();
    if (!entry) return;
    saved.push(entry);
    renderMetrics();
    element("status").textContent = `В таблицу добавлен вариант ${saved.length}`;
  });

  element("clear").addEventListener("click", () => {
    saved.length = 0;
    run();
  });

  element("export").addEventListener("click", () => {
    const runs = saved.length > 0 ? saved : current ? [current] : [];
    if (runs.length === 0) return;
    const lines = ["run,t,N,C,T"];
    runs.forEach((entry, index) => {
      entry.result.t.forEach((time, point) => {
        lines.push(
          `${index + 1},${time},${entry.result.n[point]},${entry.result.c[point]},${entry.result.temp[point]}`,
        );
      });
    });
    downloadCsv("lab01_temperature_feedback.csv", lines);
  });

  element("exportTable").addEventListener("click", () => {
    const rows = tableEntries();
    if (rows.length === 0) return;
    const lines = ["r,S,lambda,N_extreme,N_final,T_fuel_final,delta_rho,delta_rho_over_beta"];
    for (const entry of rows) lines.push(metricCells(entry).join(","));
    downloadCsv("lab01_metrics.csv", lines);
  });
}

renderFormulas();
bindParameters();
bindPresets();
bindSavedRuns();
window.addEventListener("resize", () => run());
run();
