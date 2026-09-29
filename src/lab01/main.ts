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
  result: SimulationResult;
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

function formatMetric(value: number, index: number): string {
  if (index >= 5) return value.toExponential(3);
  return value.toFixed(index > 1 ? 4 : 2);
}

function renderMetrics(metrics: TransitionMetrics): void {
  const values = [
    metrics.r,
    metrics.s,
    metrics.nExtreme,
    metrics.nFinal,
    metrics.fuelTemperatureFinal,
    metrics.deltaRho,
    metrics.deltaRhoOverBeta,
  ];
  const row = document.createElement("tr");

  values.forEach((value, index) => {
    const cell = document.createElement("td");
    cell.textContent = formatMetric(value, index);
    row.append(cell);
  });

  element("metrics").replaceChildren(row);
}

function run(): SavedRun | undefined {
  const parameters = readParameters();
  if (!canIntegrate(parameters)) return;

  const status = element("status");
  status.textContent = "Расчёт выполняется...";

  const result = simulate(parameters);
  const metrics = transitionMetrics(parameters, result);
  drawChart(element<HTMLCanvasElement>("power"), result.t, result.n, POWER_COLOR, "N");
  drawChart(
    element<HTMLCanvasElement>("temp"),
    result.t,
    result.temp.map((temperature) => temperature * FUEL_TEMPERATURE_NOMINAL),
    TEMPERATURE_COLOR,
    "TТ, °C",
  );
  drawChart(element<HTMLCanvasElement>("precursors"), result.t, result.c, PRECURSOR_COLOR, "C");
  renderMetrics(metrics);
  status.textContent = `Расчёт: ${result.t.length} точек, t=${parameters.tEnd} с`;

  return { result };
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
    const current = run();
    if (!current) return;
    saved.push(current);
    element("status").textContent = `Сохранено вариантов: ${saved.length}`;
  });

  element("clear").addEventListener("click", () => {
    saved.length = 0;
    run();
  });

  element("export").addEventListener("click", () => {
    if (saved.length === 0) {
      const current = run();
      if (!current) return;
      saved.push(current);
    }

    const lines = ["run,t,N,C,T"];
    saved.forEach((entry, index) => {
      entry.result.t.forEach((time, point) => {
        lines.push(
          `${index + 1},${time},${entry.result.n[point]},${entry.result.c[point]},${entry.result.temp[point]}`,
        );
      });
    });

    const link = document.createElement("a");
    link.href = URL.createObjectURL(new Blob([`${lines.join("\n")}\n`], { type: "text/csv" }));
    link.download = "lab01_temperature_feedback.csv";
    link.click();
  });
}

renderFormulas();
bindParameters();
bindPresets();
bindSavedRuns();
window.addEventListener("resize", () => run());
run();
