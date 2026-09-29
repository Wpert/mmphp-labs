/** Время жизни мгновенных нейтронов l, с. */
export const PROMPT_NEUTRON_LIFETIME = 1e-3;

/** Доля запаздывающих нейтронов β. */
export const DELAYED_NEUTRON_FRACTION = 0.0065;

/** Номинальная температура топлива T0, °C. */
export const FUEL_TEMPERATURE_NOMINAL = 800;

/** Температура теплоносителя Tво, °C. */
export const COOLANT_TEMPERATURE = 300;

/**
 * W0 / (mT cT T0), с⁻¹.
 * После подстановки параметров методички ≈ 0.147.
 */
export const POWER_HEAT_RATE = 0.147;

/**
 * W0 / (mT cT (T0 − Tво)), с⁻¹.
 * После подстановки параметров методички ≈ 0.236.
 */
export const COOLANT_HEAT_RATE = 0.236;

/** Стандартный температурный коэффициент реактивности αT0, °C⁻¹. */
export const STANDARD_REACTIVITY_COEFFICIENT = -2.5e-5;

/**
 * Модуль αT0 T0 в нормированном уравнении мощности.
 * В расчёте зафиксирован как 0.02: αT0 T0 = −0.02.
 */
export const NORMALIZED_TEMPERATURE_FEEDBACK = 0.02;
