import { MAX_PLOT_POINTS, MAX_STEPS, NOMINAL_POWER } from "./constants.js";

/** Состояние (δw, δ̃c, ρ_ст, Z). */
export type State = [number, number, number, number];

export type SimulationParameters = {
  /** 1 — реактивность регулятора входит в кинетику, 0 — нет. */
  a: number;
  /** 1 — включена обратная связь по мощности, 0 — нет. */
  b: number;
  /** Коэффициент α_w. Эталон −1.7·10⁻² совпадает с α_w n_0 при n_0 = 1. */
  alphaW: number;
  /** Коэффициент усиления регулятора x_0. */
  x0: number;
  /** Постоянная времени регулятора τ_p, с. */
  tauP: number;
  /** Уставка n_уст в долях номинала n_0 = 1. */
  nUst: number;
  /** Время жизни мгновенных нейтронов l, с. */
  l: number;
  /** Доля запаздывающих нейтронов β. */
  beta: number;
  /** Постоянная распада предшественников λ, с⁻¹. */
  lambda: number;
  /** Шаг интегрирования, с. */
  h: number;
  /** Длина интервала, с. */
  tEnd: number;
};

export type SimulationResult = {
  t: number[];
  dw: number[];
  dc: number[];
  rho: number[];
  z: number[];
  diverged: boolean;
};

export type TransitionMetrics = {
  a: number;
  b: number;
  dw0: number;
  dwFinal: number;
  powerFinal: number;
  overshoot: number;
  settlingTime: number | null;
  period: number | null;
  theoreticalPeriod: number | null;
  regime: string;
};

const DIVERGENCE_LIMIT = 50;

export function stepCount(parameters: SimulationParameters): number {
  return Math.round(parameters.tEnd / parameters.h);
}

export function canIntegrate(parameters: SimulationParameters): boolean {
  return (
    parameters.h > 0 &&
    parameters.tEnd >= parameters.h &&
    parameters.l > 0 &&
    parameters.tauP > 0 &&
    parameters.beta > 0 &&
    parameters.lambda > 0 &&
    parameters.nUst > 0 &&
    parameters.x0 >= 0 &&
    [parameters.alphaW, parameters.a, parameters.b].every(Number.isFinite)
  );
}

export function initialDeviation(nUst: number): number {
  return (NOMINAL_POWER - nUst) / nUst;
}

/**
 * Правая часть линеаризованной системы:
 * dδw/dt = [A ρ + (B α_w n_уст − β) δw] / l + (β / l) δ̃c
 * dδ̃c/dt = λ (δw − δ̃c)
 * dρ/dt = Z
 * dZ/dt = −Z / τ_p − (x_0 / τ_p) δw
 */
function derivatives(state: State, parameters: SimulationParameters): State {
  const [dw, dc, rho, z] = state;
  const powerFeedback = parameters.b * parameters.alphaW * parameters.nUst;
  const dwDerivative =
    (parameters.a * rho + (powerFeedback - parameters.beta) * dw) / parameters.l +
    (parameters.beta / parameters.l) * dc;
  const dcDerivative = parameters.lambda * (dw - dc);
  const zDerivative = -z / parameters.tauP - (parameters.x0 / parameters.tauP) * dw;
  return [dwDerivative, dcDerivative, z, zDerivative];
}

function shifted(state: State, slope: State, factor: number): State {
  return [
    state[0] + factor * slope[0],
    state[1] + factor * slope[1],
    state[2] + factor * slope[2],
    state[3] + factor * slope[3],
  ];
}

/** Классический метод Рунге–Кутты 4-го порядка с постоянным шагом. */
function advance(state: State, parameters: SimulationParameters): State {
  const halfStep = parameters.h / 2;
  const k1 = derivatives(state, parameters);
  const k2 = derivatives(shifted(state, k1, halfStep), parameters);
  const k3 = derivatives(shifted(state, k2, halfStep), parameters);
  const k4 = derivatives(shifted(state, k3, parameters.h), parameters);

  return state.map((value, index) => {
    const increment = k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index];
    return value + (parameters.h * increment) / 6;
  }) as State;
}

function isDiverging(state: State): boolean {
  return state.some((value) => !Number.isFinite(value) || Math.abs(value) > DIVERGENCE_LIMIT);
}

export function simulate(parameters: SimulationParameters): SimulationResult {
  const steps = Math.min(stepCount(parameters), MAX_STEPS);
  const dw0 = initialDeviation(parameters.nUst);
  const t: number[] = [];
  const dw: number[] = [];
  const dc: number[] = [];
  const rho: number[] = [];
  const z: number[] = [];
  let state: State = [dw0, dw0, 0, 0];
  let diverged = false;

  for (let step = 0; step <= steps; step += 1) {
    t.push(step * parameters.h);
    dw.push(state[0]);
    dc.push(state[1]);
    rho.push(state[2]);
    z.push(state[3]);
    if (step === steps) break;
    state = advance(state, parameters);
    if (isDiverging(state)) {
      diverged = true;
      break;
    }
  }

  return { t, dw, dc, rho, z, diverged };
}

/** Период 2π√(τ_p / x_0), оценка частоты раскачки регулятора. */
export function theoreticalPeriod(parameters: SimulationParameters): number | null {
  if (parameters.x0 <= 0 || parameters.tauP <= 0) return null;
  return 2 * Math.PI * Math.sqrt(parameters.tauP / parameters.x0);
}

function oppositeExtremum(dw: number[], dw0: number): number {
  let opposite = 0;
  for (const value of dw) {
    if (dw0 > 0 && value < opposite) opposite = value;
    if (dw0 < 0 && value > opposite) opposite = value;
  }
  return opposite;
}

/** Время, после которого |δw| остаётся внутри 5 % начального отклонения. */
function settlingTime(t: number[], dw: number[], dw0: number): number | null {
  const band = 0.05 * Math.abs(dw0);
  if (band === 0) return 0;

  let lastOutside = -1;
  for (let index = 0; index < dw.length; index += 1) {
    if (Math.abs(dw[index]) >= band) lastOutside = index;
  }
  if (lastOutside === -1) return 0;
  if (lastOutside === dw.length - 1) return null;
  return t[lastOutside + 1];
}

function oscillationPeriod(t: number[], dw: number[], dw0: number): number | null {
  const threshold = 0.02 * Math.abs(dw0);
  const crossings: number[] = [];
  let excursion = 0;

  for (let index = 1; index < dw.length; index += 1) {
    excursion = Math.max(excursion, Math.abs(dw[index - 1]));
    const left = dw[index - 1];
    const right = dw[index];
    const crossed = (left > 0 && right <= 0) || (left < 0 && right >= 0);
    if (!crossed) continue;
    if (excursion >= threshold) {
      const fraction = left / (left - right);
      crossings.push(t[index - 1] + fraction * (t[index] - t[index - 1]));
    }
    excursion = 0;
  }

  if (crossings.length < 3) return null;
  const periods: number[] = [];
  const limit = Math.min(crossings.length, 8);
  for (let index = 2; index < limit; index += 1) {
    periods.push(crossings[index] - crossings[index - 2]);
  }
  const mean = periods.reduce((sum, period) => sum + period, 0) / periods.length;
  return Number.isFinite(mean) && mean > 0 ? mean : null;
}

function peak(values: number[], from: number, to: number): number {
  let maximum = 0;
  for (let index = from; index < to; index += 1) {
    maximum = Math.max(maximum, Math.abs(values[index]));
  }
  return maximum;
}

function regime(result: SimulationResult, dw0: number, settled: number | null): string {
  if (result.diverged || Math.abs(result.dw[result.dw.length - 1]) > 10) return "расходится";
  if (settled !== null) return "устойчив";

  const count = result.dw.length;
  const early = peak(result.dw, 0, Math.max(1, Math.floor(count * 0.25)));
  const late = peak(result.dw, Math.floor(count * 0.75), count);
  const finalValue = result.dw[count - 1];
  const initial = Math.max(Math.abs(dw0), 1e-9);
  if (Math.abs(finalValue - dw0) < 0.02 * initial && late < initial * 1.05) return "без изменений";
  if (late < early * 0.8 && Math.abs(finalValue) < initial) return "затухает";
  return "неустойчив";
}

export function transitionMetrics(
  parameters: SimulationParameters,
  result: SimulationResult,
): TransitionMetrics {
  const last = result.dw.length - 1;
  const dw0 = result.dw[0];
  const dwFinal = result.dw[last];
  const settled = result.diverged ? null : settlingTime(result.t, result.dw, dw0);
  const overshoot = Math.abs(dw0) > 0 ? Math.abs(oppositeExtremum(result.dw, dw0)) / Math.abs(dw0) : 0;

  return {
    a: parameters.a,
    b: parameters.b,
    dw0,
    dwFinal,
    powerFinal: 1 + dwFinal,
    overshoot,
    settlingTime: settled,
    period: result.diverged ? null : oscillationPeriod(result.t, result.dw, dw0),
    theoreticalPeriod: theoreticalPeriod(parameters),
    regime: regime(result, dw0, settled),
  };
}

export function downsample(result: SimulationResult, maxPoints = MAX_PLOT_POINTS): SimulationResult {
  if (result.t.length <= maxPoints) return result;
  const stride = Math.ceil(result.t.length / maxPoints);
  const t: number[] = [];
  const dw: number[] = [];
  const dc: number[] = [];
  const rho: number[] = [];
  const z: number[] = [];

  for (let index = 0; index < result.t.length; index += stride) {
    t.push(result.t[index]);
    dw.push(result.dw[index]);
    dc.push(result.dc[index]);
    rho.push(result.rho[index]);
    z.push(result.z[index]);
  }

  const last = result.t.length - 1;
  if (t[t.length - 1] !== result.t[last]) {
    t.push(result.t[last]);
    dw.push(result.dw[last]);
    dc.push(result.dc[last]);
    rho.push(result.rho[last]);
    z.push(result.z[last]);
  }

  return { t, dw, dc, rho, z, diverged: result.diverged };
}
