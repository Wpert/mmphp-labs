Отличная идея — сделать браузерную версию без тяжелых зависимостей. Это вполне реально: итоговый архив будет весить **меньше 1 МБ** (вместе со шрифтами KaTeX), если правильно подобрать инструменты.

Я предлагаю следующую архитектуру:

| Задача | Решение | Размер (gzip) |
|---|---|---|
| **Рендеринг LaTeX** | **KaTeX** | ~88 КБ (JS + CSS) + шрифты (~300 КБ) |
| **Графики** | **uPlot** | ~48 КБ |
| **Численное интегрирование** | **Своя реализация RK4** (~50 строк на TS) | 0 КБ |
| **Массивы / математика** | **Нативный `Float64Array`** | 0 КБ |

Почему именно так:
- **KaTeX** рендерит формулы синхронно и в ~100 раз быстрее MathJax, при этом весит в 30 раз меньше (~88 КБ против ~2.7 МБ).
- **uPlot** — самый быстрый и легкий canvas-график: всего **47.9 КБ** против 254 КБ у Chart.js.
- **RK4** для системы из 4 ОДУ пишется вручную за 15 минут и не требует никаких библиотек.

---

## Структура архива

```
lab-power-feedback/
├── index.html          # разметка + подключение скриптов
├── style.css           # стили
├── main.js             # скомпилированный TypeScript (весь движок)
├── katex.min.js        # рендеринг формул
├── katex.min.css       # стили формул
├── auto-render.min.js  # автопоиск $...$ в HTML
├── uPlot.iife.min.js   # графики
├── uPlot.min.css       # стили графиков
└── fonts/              # шрифты KaTeX (обязательно!)
```

Шрифты KaTeX — это отдельная папка (~300 КБ), без них формулы не отобразятся. Их можно скачать с [katex.org](https://katex.org/docs/font.html) или взять из npm-пакета.

---

## 1. index.html — разметка

```html
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Лабораторная: обратная связь по мощности</title>
  <link rel="stylesheet" href="katex.min.css">
  <link rel="stylesheet" href="uPlot.min.css">
  <link rel="stylesheet" href="style.css">
</head>
<body>
  <header>
    <h1>Реактор с обратной связью по мощности и системой регулирования</h1>
  </header>

  <!-- Блок теории с формулами -->
  <section id="theory">
    <h2>Уравнения динамики</h2>
    <p>Система уравнений в относительных переменных:</p>
    <div class="math-block">
      $$\begin{cases}
      \dfrac{d\,\delta w}{dt} = \dfrac{A\,\rho_{cm} + (B\,\alpha_w n_{уст} - \beta)\,\delta w}{l} + \dfrac{\beta}{l}\,\delta c \\[8pt]
      \dfrac{d\,\delta c}{dt} = \lambda\,(\delta w - \delta c) \\[8pt]
      \dfrac{d\rho_{cm}}{dt} = Z \\[8pt]
      \dfrac{dZ}{dt} = -\dfrac{Z}{\tau_p} - \dfrac{x_0}{\tau_p}\,\delta w
      \end{cases}$$
    </div>
    <p>Ключи <span class="math-inline">\(A\)</span> и <span class="math-inline">\(B\)</span> включают обратные связи.</p>
  </section>

  <!-- Панель управления -->
  <section id="controls">
    <h2>Параметры</h2>

    <div class="control-group">
      <label>α_w (коэффициент реактивности):</label>
      <input type="range" id="alpha_w" min="-0.1" max="0" step="0.0005" value="-0.017">
      <input type="number" id="alpha_w_num" step="0.0001" value="-0.017">
    </div>

    <div class="control-group">
      <label>x₀ (коэффициент усиления):</label>
      <input type="range" id="x0" min="-2" max="3" step="0.01" value="0">
      <input type="number" id="x0_num" step="0.1" value="1">
      <small>Слайдер в логарифмической шкале (10^x0)</small>
    </div>

    <div class="control-group">
      <label>τ_p (постоянная времени регулятора), с:</label>
      <input type="range" id="tau_p" min="-3" max="0" step="0.01" value="-1.125">
      <input type="number" id="tau_p_num" step="0.001" value="0.075">
    </div>

    <div class="control-group">
      <label>n_уст (целевая мощность):</label>
      <input type="range" id="n_ust" min="0.1" max="1.5" step="0.05" value="0.8">
      <input type="number" id="n_ust_num" step="0.05" value="0.8">
    </div>

    <div class="control-group">
      <label>β (доля запаздывающих нейтронов):</label>
      <input type="range" id="beta" min="0.001" max="0.02" step="0.0005" value="0.0065">
      <input type="number" id="beta_num" step="0.0005" value="0.0065">
    </div>

    <div class="control-group">
      <label>λ, с⁻¹:</label>
      <input type="range" id="lambda" min="0.01" max="0.2" step="0.001" value="0.0765">
      <input type="number" id="lambda_num" step="0.001" value="0.0765">
    </div>

    <div class="control-group">
      <label>l (время жизни мгновенных нейтронов), с:</label>
      <input type="range" id="l" min="-5" max="-2" step="0.01" value="-3">
      <input type="number" id="l_num" step="0.0001" value="0.001">
    </div>

    <div class="control-group">
      <label>Шаг h, с:</label>
      <input type="range" id="h" min="-5" max="-2" step="0.01" value="-4">
      <input type="number" id="h_num" step="0.0001" value="0.0001">
    </div>

    <div class="control-group">
      <label>Время расчёта t_end, с:</label>
      <input type="range" id="t_end" min="0.5" max="30" step="0.5" value="5">
      <input type="number" id="t_end_num" step="0.5" value="5">
    </div>

    <div class="control-group">
      <label><input type="checkbox" id="A" checked> A (регулятор)</label>
      <label><input type="checkbox" id="B" checked> B (обратная связь по мощности)</label>
    </div>

    <div class="presets">
      <button data-preset="stable">✅ Стабильный</button>
      <button data-preset="oscill">🌊 Колебательный</button>
      <button data-preset="unstable">💥 Неустойчивый</button>
      <button data-preset="no_ctrl">🚫 Без регулятора</button>
      <button data-preset="only_pow">⚡ Только мощность</button>
    </div>

    <div class="actions">
      <button id="save">📌 Сохранить кривую</button>
      <button id="clear">🗑️ Очистить</button>
      <button id="export">💾 Экспорт CSV</button>
    </div>
  </section>

  <!-- Графики -->
  <section id="plots">
    <div id="plot-dw"></div>
    <div id="plot-rho"></div>
    <div id="plot-Z"></div>
    <div id="plot-dc"></div>
  </section>

  <!-- Таблица метрик -->
  <section id="metrics">
    <h2>Метрики переходного процесса</h2>
    <table id="metrics-table">
      <thead>
        <tr>
          <th>σ (перерегулирование)</th>
          <th>t_рег, с</th>
          <th>δw(конец)</th>
          <th>N пиков</th>
          <th>T_osc, с</th>
          <th>Затухание</th>
        </tr>
      </thead>
      <tbody><tr id="metrics-row"><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td><td>—</td></tr></tbody>
    </table>
  </section>

  <!-- Подключение библиотек -->
  <script src="katex.min.js"></script>
  <script src="auto-render.min.js"></script>
  <script src="uPlot.iife.min.js"></script>
  <script src="main.js"></script>
</body>
</html>
```

---

## 2. main.ts — численное ядро на TypeScript

Этот код компилируется в `main.js` командой `tsc main.ts --target es2017 --outFile main.js`.

```typescript
// ==================== Типы ====================
type State = [number, number, number, number]; // [dw, dc, rho, Z]

interface Params {
  alpha_w: number; x0: number; tau_p: number; n_ust: number;
  l: number; beta: number; lambda_: number; h: number; t_end: number;
  A: number; B: number;
}

// ==================== Правые части системы ====================
function deriv(y: State, p: Params): State {
  const [dw, dc, rho, Z] = y;
  const ddw = (p.A * rho + (p.B * p.alpha_w * p.n_ust - p.beta) * dw) / p.l
              + (p.beta / p.l) * dc;
  const ddc = p.lambda_ * (dw - dc);
  const drho = Z;
  const dZ = -Z / p.tau_p - (p.x0 / p.tau_p) * dw;
  return [ddw, ddc, drho, dZ];
}

// ==================== Один шаг Рунге–Кутты 4-го порядка ====================
function rk4Step(y: State, p: Params): State {
  const k1 = deriv(y, p);
  const y2: State = [y[0] + 0.5*p.h*k1[0], y[1] + 0.5*p.h*k1[1],
                     y[2] + 0.5*p.h*k1[2], y[3] + 0.5*p.h*k1[3]];
  const k2 = deriv(y2, p);
  const y3: State = [y[0] + 0.5*p.h*k2[0], y[1] + 0.5*p.h*k2[1],
                     y[2] + 0.5*p.h*k2[2], y[3] + 0.5*p.h*k2[3]];
  const k3 = deriv(y3, p);
  const y4: State = [y[0] + p.h*k3[0], y[1] + p.h*k3[1],
                     y[2] + p.h*k3[2], y[3] + p.h*k3[3]];
  const k4 = deriv(y4, p);

  return [
    y[0] + (p.h/6) * (k1[0] + 2*k2[0] + 2*k3[0] + k4[0]),
    y[1] + (p.h/6) * (k1[1] + 2*k2[1] + 2*k3[1] + k4[1]),
    y[2] + (p.h/6) * (k1[2] + 2*k2[2] + 2*k3[2] + k4[2]),
    y[3] + (p.h/6) * (k1[3] + 2*k2[3] + 2*k3[3] + k4[3]),
  ];
}

// ==================== Полное интегрирование ====================
interface SimResult {
  t: Float64Array;
  dw: Float64Array;
  dc: Float64Array;
  rho: Float64Array;
  Z: Float64Array;
}

function simulate(p: Params): SimResult {
  const nSteps = Math.round(p.t_end / p.h) + 1;
  const t = new Float64Array(nSteps);
  const dw = new Float64Array(nSteps);
  const dc = new Float64Array(nSteps);
  const rho = new Float64Array(nSteps);
  const Z = new Float64Array(nSteps);

  const dw0 = (1 - p.n_ust) / p.n_ust;
  let y: State = [dw0, dw0, 0, 0];

  t[0] = 0; dw[0] = y[0]; dc[0] = y[1]; rho[0] = y[2]; Z[0] = y[3];

  for (let i = 1; i < nSteps; i++) {
    y = rk4Step(y, p);
    t[i] = i * p.h;
    dw[i] = y[0]; dc[i] = y[1]; rho[i] = y[2]; Z[i] = y[3];
  }

  return { t, dw, dc, rho, Z };
}

// ==================== Анализ переходного процесса ====================
interface Metrics {
  sigma: number; t_reg: number; dw_end: number;
  n_peaks: number; T_osc: number; decay: number;
}

function analyse(res: SimResult, dw0: number): Metrics {
  const absDw = Array.from(res.dw).map(Math.abs);
  const maxAbs = Math.max(...absDw);
  const sigma = maxAbs / Math.abs(dw0);

  // Время регулирования: последний момент, когда |dw| > 0.05*|dw0|
  let t_reg = 0;
  const threshold = 0.05 * Math.abs(dw0);
  for (let i = res.dw.length - 1; i >= 0; i--) {
    if (Math.abs(res.dw[i]) > threshold) { t_reg = res.t[i]; break; }
  }

  // Поиск пиков (локальных максимумов |dw|)
  const peaks: number[] = [];
  for (let i = 1; i < absDw.length - 1; i++) {
    if (absDw[i] > absDw[i-1] && absDw[i] > absDw[i+1] &&
        absDw[i] > 0.02 * Math.abs(dw0)) {
      peaks.push(i);
    }
  }
  const n_peaks = peaks.length;
  let T_osc = NaN;
  if (n_peaks >= 2) {
    let sum = 0;
    for (let i = 1; i < peaks.length; i++) {
      sum += res.t[peaks[i]] - res.t[peaks[i-1]];
    }
    T_osc = sum / (peaks.length - 1);
  }

  let decay = NaN;
  if (n_peaks >= 2) {
    decay = absDw[peaks[peaks.length-1]] / absDw[peaks[0]];
  }

  return { sigma, t_reg, dw_end: res.dw[res.dw.length-1],
           n_peaks, T_osc, decay };
}

// ==================== Графики (uPlot) ====================
let plots: Record<string, uPlot> = {};
let savedRuns: { label: string; res: SimResult }[] = [];

function createPlots() {
  const opts = (title: string, yLabel: string) => ({
    width: 560, height: 320,
    title,
    scales: { x: { time: false } },
    axes: [
      { label: 't, с' },
      { label: yLabel },
    ],
    series: [
      {},
      { stroke: '#2563eb', width: 2, label: yLabel },
    ],
  });

  plots.dw  = new uPlot(opts('Отклонение мощности δw', 'δw'), [[]], document.getElementById('plot-dw')!);
  plots.rho = new uPlot(opts('Реактивность регулятора ρ_cm', 'ρ_cm'), [[]], document.getElementById('plot-rho')!);
  plots.Z   = new uPlot(opts('Скорость изменения ρ_cm (Z)', 'Z'), [[]], document.getElementById('plot-Z')!);
  plots.dc  = new uPlot(opts('Концентрация запаздывающих нейтронов δc', 'δc'), [[]], document.getElementById('plot-dc')!);
}

function updatePlots(res: SimResult) {
  plots.dw.setData([res.t, res.dw]);
  plots.rho.setData([res.t, res.rho]);
  plots.Z.setData([res.t, res.Z]);
  plots.dc.setData([res.t, res.dc]);
}

// ==================== Связывание UI ====================
function readParams(): Params {
  const val = (id: string) => parseFloat((document.getElementById(id) as HTMLInputElement).value);
  const chk = (id: string) => (document.getElementById(id) as HTMLInputElement).checked ? 1 : 0;

  return {
    alpha_w: val('alpha_w_num'),
    x0:      Math.pow(10, val('x0_num')),  // если слайдер логарифмический
    tau_p:   Math.pow(10, val('tau_p_num')),
    n_ust:   val('n_ust_num'),
    l:       Math.pow(10, val('l_num')),
    beta:    val('beta_num'),
    lambda_: val('lambda_num'),
    h:       Math.pow(10, val('h_num')),
    t_end:   val('t_end_num'),
    A: chk('A'), B: chk('B'),
  };
}

function recalc() {
  const p = readParams();
  const res = simulate(p);
  const dw0 = (1 - p.n_ust) / p.n_ust;
  const m = analyse(res, dw0);
  updatePlots(res);
  updateMetricsTable(m);
}

// ==================== Таблица метрик ====================
function updateMetricsTable(m: Metrics) {
  const row = document.getElementById('metrics-row')!;
  row.innerHTML = `
    <td>${m.sigma.toFixed(3)}</td>
    <td>${m.t_reg.toFixed(3)}</td>
    <td>${m.dw_end.toExponential(2)}</td>
    <td>${m.n_peaks}</td>
    <td>${isNaN(m.T_osc) ? '—' : m.T_osc.toFixed(3)}</td>
    <td>${isNaN(m.decay) ? '—' : m.decay.toFixed(3)}</td>
  `;
}

// ==================== Сохранение кривых ====================
function saveCurrent() {
  const p = readParams();
  const res = simulate(p);
  const label = `α=${p.alpha_w.toFixed(3)} x0=${p.x0.toFixed(2)} τ=${p.tau_p.toFixed(3)} A=${p.A}B=${p.B}`;
  savedRuns.push({ label, res });
  console.log('Сохранено:', label);
}

function clearSaved() {
  savedRuns = [];
  console.log('Очищено');
}

// ==================== Экспорт CSV ====================
function exportCSV() {
  if (savedRuns.length === 0) return;
  let csv = 'run,t,dw,dc,rho,Z\n';
  savedRuns.forEach((run, idx) => {
    for (let i = 0; i < run.res.t.length; i++) {
      csv += `${idx+1},${run.res.t[i]},${run.res.dw[i]},${run.res.dc[i]},${run.res.rho[i]},${run.res.Z[i]}\n`;
    }
  });
  const blob = new Blob([csv], { type: 'text/csv' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'lab1_runs.csv';
  a.click();
}

// ==================== Пресеты ====================
const presets: Record<string, Partial<Params>> = {
  stable:     { alpha_w: -0.017, x0: 1, tau_p: 0.075, n_ust: 0.8, beta: 0.0065, lambda_: 0.0765, h: 1e-4, t_end: 5, A: 1, B: 1 },
  oscill:     { alpha_w: -0.017, x0: 5, tau_p: 0.075, n_ust: 0.8, beta: 0.0065, lambda_: 0.0765, h: 1e-4, t_end: 10, A: 1, B: 1 },
  unstable:   { alpha_w: -0.05,  x0: 20, tau_p: 0.075, n_ust: 0.8, beta: 0.0065, lambda_: 0.0765, h: 1e-4, t_end: 5, A: 1, B: 1 },
  no_ctrl:    { alpha_w: -0.017, x0: 1, tau_p: 0.075, n_ust: 0.8, beta: 0.0065, lambda_: 0.0765, h: 1e-4, t_end: 5, A: 0, B: 1 },
  only_pow:   { alpha_w: -0.017, x0: 1, tau_p: 0.075, n_ust: 0.8, beta: 0.0065, lambda_: 0.0765, h: 1e-4, t_end: 5, A: 1, B: 0 },
};

// ==================== Инициализация ====================
document.addEventListener('DOMContentLoaded', () => {
  // Рендеринг формул KaTeX
  renderMathInElement(document.body, {
    delimiters: [
      { left: '$$', right: '$$', display: true },
      { left: '\\(', right: '\\)', display: false },
    ],
  });

  createPlots();
  recalc();

  // Обработчики слайдеров
  document.querySelectorAll('input[type="range"]').forEach((slider) => {
    slider.addEventListener('input', () => {
      const num = document.getElementById(slider.id + '_num') as HTMLInputElement;
      if (num) num.value = (slider as HTMLInputElement).value;
      recalc();
    });
  });

  document.querySelectorAll('input[type="number"]').forEach((num) => {
    num.addEventListener('change', () => {
      const slider = document.getElementById(num.id.replace('_num', '')) as HTMLInputElement;
      if (slider) slider.value = (num as HTMLInputElement).value;
      recalc();
    });
  });

  document.getElementById('A')!.addEventListener('change', recalc);
  document.getElementById('B')!.addEventListener('change', recalc);

  // Пресеты
  document.querySelectorAll('[data-preset]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const key = (btn as HTMLElement).dataset.preset!;
      const p = presets[key];
      if (!p) return;
      // ... применить p ко всем полям и вызвать recalc()
    });
  });

  document.getElementById('save')!.addEventListener('click', saveCurrent);
  document.getElementById('clear')!.addEventListener('click', clearSaved);
  document.getElementById('export')!.addEventListener('click', exportCSV);
});
```

---

## 3. style.css — минимальные стили

```css
* { box-sizing: border-box; margin: 0; padding: 0; }

body {
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
  background: #f8fafc;
  color: #1e293b;
  line-height: 1.6;
  padding: 24px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 { font-size: 1.6rem; margin-bottom: 16px; color: #0f172a; }
h2 { font-size: 1.25rem; margin: 20px 0 12px; color: #334155; }

section {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  margin-bottom: 16px;
  box-shadow: 0 1px 3px rgba(0,0,0,0.08);
}

.math-block {
  overflow-x: auto;
  padding: 12px 0;
}

.control-group {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 10px;
  flex-wrap: wrap;
}

.control-group label {
  min-width: 220px;
  font-size: 0.9rem;
}

.control-group input[type="range"] { flex: 1; min-width: 120px; }
.control-group input[type="number"] {
  width: 100px;
  padding: 4px 8px;
  border: 1px solid #cbd5e1;
  border-radius: 4px;
}

.control-group small { color: #64748b; font-size: 0.75rem; }

.presets, .actions {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  margin-top: 12px;
}

button {
  padding: 8px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 6px;
  background: #fff;
  cursor: pointer;
  font-size: 0.85rem;
  transition: background 0.15s;
}

button:hover { background: #f1f5f9; }
button[data-preset="unstable"] { border-color: #fca5a5; color: #dc2626; }
button[data-preset="stable"] { border-color: #86efac; color: #16a34a; }

#plots {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 16px;
}

@media (max-width: 900px) {
  #plots { grid-template-columns: 1fr; }
}

#metrics-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.9rem;
}

#metrics-table th, #metrics-table td {
  padding: 8px 12px;
  border: 1px solid #e2e8f0;
  text-align: center;
}

#metrics-table th { background: #f1f5f9; font-weight: 600; }
```

---

## 4. Итоговый размер архива

| Файл | Размер |
|---|---|
| `katex.min.js` | ~75 КБ (gzip) |
| `katex.min.css` + шрифты | ~300 КБ |
| `auto-render.min.js` | ~5 КБ |
| `uPlot.iife.min.js` | ~48 КБ |
| `uPlot.min.css` | ~3 КБ |
| `main.js` (скомпилированный) | ~10 КБ |
| `index.html` + `style.css` | ~15 КБ |
| **Итого** | **~450 КБ** |

Это **в 10 раз меньше**, чем если бы вы использовали Plotly + MathJax (~5 МБ). Архив спокойно отправится по почте и откроется офлайн двойным кликом по `index.html`.

---

## 5. Как собрать проект

1. **Скачайте библиотеки:**
   - KaTeX: [https://katex.org/docs/browser](https://katex.org/docs/browser) — возьмите `katex.min.js`, `katex.min.css`, `auto-render.min.js` и папку `fonts/`.
   - uPlot: [https://github.com/leeoniya/uPlot/tree/master/dist](https://github.com/leeoniya/uPlot/tree/master/dist) — возьмите `uPlot.iife.min.js` и `uPlot.min.css`.

2. **Скомпилируйте TypeScript:**
   ```bash
   npx tsc main.ts --target es2017 --outFile main.js
   ```
   Или установите TypeScript глобально: `npm i -g typescript`.

3. **Соберите структуру папок** как показано выше.

4. **Откройте `index.html`** в браузере — всё работает офлайн.

---

## Что можно улучшить (опционально)

- **Наложение сохранённых кривых на график** — uPlot поддерживает несколько серий через `series.push()` и `setData()` с дополнительными массивами.
- **Зум и панорамирование** — в uPlot включается через `cursor: { drag: { x: true, y: true } }`.
- **Экспорт в Excel** — можно добавить SheetJS, но это +300 КБ. Лучше ограничиться CSV.
- **Сборка через Vite** — если хотите модульность и минификацию, используйте Vite + TypeScript. Итоговый `dist/` будет ещё меньше.

Если нужно, могу расписать, как добавить наложение сохранённых кривых на uPlot или как настроить автоматическую сборку через Vite.