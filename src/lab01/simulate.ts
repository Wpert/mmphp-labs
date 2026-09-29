import {
  COOLANT_HEAT_RATE,
  COOLANT_TEMPERATURE,
  DELAYED_NEUTRON_FRACTION,
  FUEL_TEMPERATURE_NOMINAL,
  NORMALIZED_TEMPERATURE_FEEDBACK,
  POWER_HEAT_RATE,
  PROMPT_NEUTRON_LIFETIME,
  STANDARD_REACTIVITY_COEFFICIENT,
} from "./constants.js";

/** Состояние (N, C̄, T), где T = Tт / T0. */
export type State = [number, number, number];

export type SimulationParameters = {
  /** Скачок реактивности в долях β. */
  r: number;
  /** Доля стандартного температурного коэффициента. */
  s: number;
  /** Постоянная распада предшественников, с⁻¹. */
  lambda: number;
  /** Шаг интегрирования, с. */
  h: number;
  /** Длина интервала, с. */
  tEnd: number;
};

export type SimulationResult = {
  t: number[];
  n: number[];
  c: number[];
  temp: number[];
};

export type TransitionMetrics = {
  r: number;
  s: number;
  nExtreme: number;
  nFinal: number;
  fuelTemperatureFinal: number;
  deltaRho: number;
  deltaRhoOverBeta: number;
};

const INITIAL_STATE: State = [1, 1, 1];

export function canIntegrate(parameters: SimulationParameters): boolean {
  return parameters.h > 0 && parameters.tEnd > 0 && parameters.lambda > 0;
}

/**
 * Правая часть нормированной системы:
 * dN/dt = [β(r − 1) − S·0.02(T − 1)] / l · N + (β / l) C̄
 * dC̄/dt = λ(N − C̄)
 * dT/dt = 0.147 N − 0.236(T − Tво / T0)
 */
function derivatives(state: State, parameters: SimulationParameters): State {
  const [power, precursors, temperature] = state;
  const insertedReactivity = DELAYED_NEUTRON_FRACTION * (parameters.r - 1);
  const temperatureReactivity =
    -parameters.s * NORMALIZED_TEMPERATURE_FEEDBACK * (temperature - 1);

  const powerDerivative =
    ((insertedReactivity + temperatureReactivity) / PROMPT_NEUTRON_LIFETIME) * power +
    (DELAYED_NEUTRON_FRACTION / PROMPT_NEUTRON_LIFETIME) * precursors;
  const precursorDerivative = parameters.lambda * (power - precursors);
  const temperatureDerivative =
    POWER_HEAT_RATE * power -
    COOLANT_HEAT_RATE * (temperature - COOLANT_TEMPERATURE / FUEL_TEMPERATURE_NOMINAL);

  return [powerDerivative, precursorDerivative, temperatureDerivative];
}

function shifted(state: State, slope: State, factor: number): State {
  return [
    state[0] + factor * slope[0],
    state[1] + factor * slope[1],
    state[2] + factor * slope[2],
  ];
}

/** Классический метод Рунге–Кутты 4-го порядка с постоянным шагом. */
function advance(state: State, parameters: SimulationParameters): State {
  const k1 = derivatives(state, parameters);
  const k2 = derivatives(shifted(state, k1, parameters.h / 2), parameters);
  const k3 = derivatives(shifted(state, k2, parameters.h / 2), parameters);
  const k4 = derivatives(shifted(state, k3, parameters.h), parameters);

  return state.map((value, index) => {
    const increment = k1[index] + 2 * k2[index] + 2 * k3[index] + k4[index];
    return value + (parameters.h * increment) / 6;
  }) as State;
}

export function simulate(parameters: SimulationParameters): SimulationResult {
  const steps = Math.round(parameters.tEnd / parameters.h);
  const t: number[] = [];
  const n: number[] = [];
  const c: number[] = [];
  const temp: number[] = [];
  let state: State = [...INITIAL_STATE];

  for (let step = 0; step <= steps; step += 1) {
    t.push(step * parameters.h);
    n.push(state[0]);
    c.push(state[1]);
    temp.push(state[2]);
    if (step < steps) state = advance(state, parameters);
  }

  return { t, n, c, temp };
}

/** Экстремум мощности после t = 0, конечные значения и реактивность температурного эффекта. */
export function transitionMetrics(
  parameters: SimulationParameters,
  result: SimulationResult,
): TransitionMetrics {
  const afterStart = result.n.slice(1);
  const extremeValue = parameters.r > 0 ? Math.max(...afterStart) : Math.min(...afterStart);
  const extremeIndex = 1 + afterStart.indexOf(extremeValue);
  const last = result.n.length - 1;
  const fuelTemperatureFinal = result.temp[last] * FUEL_TEMPERATURE_NOMINAL;
  const deltaRho =
    parameters.s *
    STANDARD_REACTIVITY_COEFFICIENT *
    (FUEL_TEMPERATURE_NOMINAL - fuelTemperatureFinal);

  return {
    r: parameters.r,
    s: parameters.s,
    nExtreme: result.n[extremeIndex],
    nFinal: result.n[last],
    fuelTemperatureFinal,
    deltaRho,
    deltaRhoOverBeta: deltaRho / DELAYED_NEUTRON_FRACTION,
  };
}
