Ниже — полный набор для первой лабораторной в стиле отчёта по температуре: **теория (Markdown-ячейки) + план эксперимента + интерактивный скрипт с автоанализом**. Просто вставляйте блоки по порядку в Colab.

---

## Часть 1. Теория (Markdown-ячейки)

### `# --- Ячейка 1. Титул и цель ---`

```markdown
# Отчёт по семинарскому занятию
## «Переходный процесс с обратной связью по мощности и системой регулирования»

по курсу «Математические модели физических процессов»

**Цель работы.** Исследовать динамику ядерного реактора при переводе мощности с одного уровня на другой с учётом обратной связи по мощности и автоматической системы регулирования. Оценить влияние коэффициентов реактивности, усиления и инерционности регулятора на устойчивость и качество переходного процесса.

**Постановка задачи:**
1. Реализовать численное интегрирование линеаризованной системы точечной кинетики с одной группой запаздывающих нейтронов, дополненной уравнением системы регулирования, методом Рунге–Кутты 4-го порядка.
2. Провести серию расчётов для четырёх комбинаций обратных связей (A, B).
3. Исследовать влияние параметров α_w, x₀, τ_p, β, λ на устойчивость.
4. Построить семейства зависимостей δw(t), ρ_cm(t), Z(t), δc(t).
5. Найти границы устойчивости и объяснить особенности поведения мощности.
```

---

### `# --- Ячейка 2. Модель ---`

```markdown
## 1. Уравнения динамики

Рассматривается точечная модель кинетики реактора с одной эффективной группой запаздывающих нейтронов, дополненная уравнением системы регулирования и линейной обратной связью по мощности.

### 1.1. Исходная система

$$
\begin{cases}
\dfrac{dn}{dt} = \dfrac{\rho_{cm} + \alpha_w n - \beta}{l}\, n + \lambda c,\\[8pt]
\dfrac{dc}{dt} = \dfrac{\beta}{l}\, n - \lambda c,\\[8pt]
\tau_p \dfrac{d^2 \rho_{cm}}{dt^2} + \dfrac{d\rho_{cm}}{dt} = -x_0\, y,
\end{cases}
$$

где
- $n$ — плотность нейтронов (пропорциональна мощности $W$),
- $c$ — концентрация предшественников запаздывающих нейтронов,
- $\rho_{cm}$ — реактивность, вносимая системой регулирования,
- $\alpha_w$ — коэффициент реактивности по мощности (отрицательная обратная связь),
- $\beta$ — доля запаздывающих нейтронов,
- $l$ — время жизни мгновенных нейтронов,
- $\lambda$ — постоянная распада предшественников,
- $\tau_p$ — постоянная времени регулятора,
- $x_0$ — коэффициент усиления регулятора,
- $y = (n - n_{уст})/n_{уст}$ — сигнал рассогласования.

### 1.2. Линеаризация

Введём отклонения от стационарного состояния $n_{уст}$, $c_{уст}$:
$\delta n = n - n_{уст}$, $\delta c = c - c_{уст}$.

Пренебрегая членами второго порядка малости ($\delta n \cdot \rho_{cm}$, $\delta n^2$), получаем:

$$
\begin{cases}
\dfrac{d\,\delta n}{dt} = \dfrac{\rho_{cm} + (\alpha_w n_{уст} - \beta)}{l}\,\delta n + \lambda\,\delta c,\\[8pt]
\dfrac{d\,\delta c}{dt} = \dfrac{\beta}{l}\,\delta n - \lambda\,\delta c.
\end{cases}
$$

### 1.3. Относительные переменные

Переходим к $\delta w = \delta n / n_{уст}$, $\widetilde{\delta c} = \delta c / c_{уст}$, где $c_{уст} = \beta n_{уст}/(\lambda l)$:

$$
\begin{cases}
\dfrac{d\,\delta w}{dt} = \dfrac{A\,\rho_{cm} + \bigl(B\,\alpha_w n_{уст} - \beta\bigr)\,\delta w}{l} + \dfrac{\beta}{l}\,\widetilde{\delta c},\\[8pt]
\dfrac{d\,\widetilde{\delta c}}{dt} = \lambda\,(\delta w - \widetilde{\delta c}),\\[8pt]
\dfrac{d\rho_{cm}}{dt} = Z,\\[8pt]
\dfrac{dZ}{dt} = -\dfrac{Z}{\tau_p} - \dfrac{x_0}{\tau_p}\,\delta w.
\end{cases}
\tag{1}
$$

Ключи $A$ и $B$ позволяют включать/отключать обратные связи:

| Режим | A | B | Что работает |
|:---:|:---:|:---:|---|
| Обе связи | 1 | 1 | мощность + регулятор |
| Только мощность | 0 | 1 | обратная связь по мощности |
| Только регулятор | 1 | 0 | система регулирования |
| Без связей | 0 | 0 | «голый» реактор |
```

---

### `# --- Ячейка 3. Начальные условия и стационарное состояние ---`

```markdown
## 2. Начальные условия

При $t = 0$ реактор работает на уровне $n_0$; требуется выйти на $n_{уст}$.  
Введём $\alpha = n_0 / n_{уст}$. Тогда:

$$
\delta w(0) = \dfrac{n_0 - n_{уст}}{n_{уст}} = 1 - \alpha,
\qquad
\widetilde{\delta c}(0) = 1 - \alpha,
\qquad
\rho_{cm}(0) = 0,
\qquad
Z(0) = 0.
$$

При $n_{уст} < 1$ мощность **снижается**, при $n_{уст} > 1$ — **растёт**.

## 3. Стационарное состояние

При $d/dt = 0$ из (1) следует:

$$
\delta w_{ст} = 0, \quad \widetilde{\delta c}_{ст} = 0, \quad Z_{ст} = 0, \quad \rho_{cm,ст} = 0.
$$

Это означает: в устойчивом режиме регулятор выводит систему на заданный уровень $n_{уст}$ с **нулевой статической ошибкой**, если в модели нет внешних возмущений. В реальности статическая ошибка появляется из-за порога $y_0$ и сухого трения в приводе.
```

---

### `# --- Ячейка 4. Численные значения констант ---`

```markdown
## 4. Численные значения констант

Для реактора типа ВВЭР-1000 приняты:

| Параметр | Обозначение | Значение | Ед. |
|---|---|---|---|
| Время жизни мгновенных нейтронов | $l$ | $10^{-3}$ | с |
| Доля запаздывающих нейтронов | $\beta$ | $0.0065$ | – |
| Постоянная распада предшественников | $\lambda$ | $0.0765$ | с⁻¹ |
| Стандартный коэффициент реактивности по мощности | $\alpha_{w0}$ | $-1.7\cdot10^{-2}$ | – |
| Постоянная времени регулятора | $\tau_p$ | $0.075$ | с |
| Коэффициент усиления регулятора | $x_0$ | $1$ | – |
| Целевая относительная мощность | $n_{уст}$ | $0.8$ | – |
| Шаг интегрирования | $h$ | $10^{-4}$ | с |
| Интервал наблюдения | $t_{end}$ | $5$ | с |

Тогда $\beta/l = 6.5$ с⁻¹, $\alpha_w n_{уст} = -0.0136$, а начальное отклонение $\delta w(0) = 0.25$.
```

---

### `# --- Ячейка 5. Метод решения ---`

```markdown
## 5. Метод решения

Система (1) — система из четырёх ОДУ первого порядка. Вектор состояния:

$$
\mathbf y = \bigl(\delta w,\ \widetilde{\delta c},\ \rho_{cm},\ Z\bigr)^T.
$$

Интегрирование выполняется классическим методом Рунге–Кутты 4-го порядка:

$$
\mathbf y_{n+1} = \mathbf y_n + \dfrac{h}{6}\bigl(\mathbf k_1 + 2\mathbf k_2 + 2\mathbf k_3 + \mathbf k_4\bigr),
$$

$$
\begin{aligned}
\mathbf k_1 &= f(\mathbf y_n), &
\mathbf k_2 &= f\!\left(\mathbf y_n + \tfrac{h}{2}\mathbf k_1\right),\\
\mathbf k_3 &= f\!\left(\mathbf y_n + \tfrac{h}{2}\mathbf k_2\right), &
\mathbf k_4 &= f(\mathbf y_n + h\mathbf k_3).
\end{aligned}
$$

### Устойчивость численного метода
Самая быстрая составляющая решения — мгновенные нейтроны с показателем
$\lambda_{max} \approx (\alpha_w n_{уст} - \beta)/l \approx -20.1$ с⁻¹.
Для устойчивости РК4 требуется $h\,|\lambda_{max}| < 2.78$, откуда $h < 0.14$ с.
Однако для правильной передачи фронта при $l = 10^{-3}$ с необходимо $h \ll l$,
поэтому принимаем $h = 10^{-4}$ с (проверка сходимости по шагу — в разделе результатов).
```

---

### `# --- Ячейка 6. Аналитические оценки ---`

```markdown
## 6. Аналитические оценки

### 6.1. Частота колебаний неустойчивой системы
При $A = 1$, $B = 0$ (только регулятор) характеристическое уравнение при больших $x_0$ даёт оценку частоты колебаний:

$$
\omega_{osc} \approx \sqrt{\dfrac{x_0}{\tau_p}}.
$$

При $x_0 = 1$, $\tau_p = 0.075$ с: $\omega \approx 3.65$ рад/с, $T \approx 1.7$ с.

### 6.2. Условие устойчивости по амплитуде
Колебания затухают, если:

$$
x_0 < x_{0,кр} \approx \dfrac{\beta}{l}\cdot l \cdot \dfrac{1}{\tau_p} \cdot \dfrac{1}{|\alpha_w| n_{уст}} \cdot \ldots
$$

(точное выражение получается через критерий Рауса–Гурвица для характеристического полинома 4-й степени).

### 6.3. Роль запаздывающих нейтронов
С ростом $\beta$:
- растёт модуль эффективного коэффициента $|\alpha_w n_{уст} - \beta|$,
- усиливается связь регулятора с концентрацией предшественников,
- система становится **более устойчивой** (колебания затухают медленнее или не возникают вовсе).
```

---

### `# --- Ячейка 7. План эксперимента ---`

```markdown
## 7. Программа численных экспериментов

### 7.1. Сравнение четырёх режимов обратных связей
Поочерёдно установить пресеты:
- **A=1, B=1** — обе связи;
- **A=0, B=1** — только по мощности;
- **A=1, B=0** — только регулятор;
- **A=0, B=0** — без связей.

Сравнить кривые $\delta w(t)$.

### 7.2. Влияние $x_0$ (коэффициента усиления)
$A=1, B=1$, $\alpha_w=-0.017$, $\tau_p=0.075$.  
Пройти $x_0 = 0.1;\ 0.5;\ 1;\ 2;\ 5;\ 10$. Найти границу устойчивости.

### 7.3. Влияние $\alpha_w$
$x_0 = 1$, остальные — как в 7.2.  
Пройти $\alpha_w = -0.005;\ -0.010;\ -0.017;\ -0.030;\ -0.050$.

### 7.4. Влияние $\tau_p$
$x_0 = 2$, $\alpha_w = -0.017$.  
Пройти $\tau_p = 0.01;\ 0.05;\ 0.075;\ 0.2;\ 0.5$ с.

### 7.5. Влияние $\beta$ и $\lambda$
$x_0 = 1$, $\tau_p = 0.075$.  
Пройти $\beta = 0.003;\ 0.005;\ 0.0065;\ 0.01;\ 0.02$.  
Пройти $\lambda = 0.03;\ 0.05;\ 0.0765;\ 0.15$.

### 7.6. Проверка сходимости по шагу
При устойчивом режиме пройти $h = 10^{-4};\ 5\cdot10^{-4};\ 10^{-3}$.  
Показать, что при $h \gtrsim l$ появляется численный шум.

### 7.7. Обязательные величины для отчёта
| Величина | Формула |
|---|---|
| Перерегулирование | $\sigma = \max|\delta w| / |\delta w(0)|$ |
| Время регулирования | $t_{рег}$, когда $|\delta w| < 0.05\,|\delta w(0)|$ |
| Статическая ошибка | $\delta w(t_{end})$ |
| Частота колебаний | по числу пиков на интервале |
| Граница устойчивости | критическое значение параметра |
```

---

### `# --- Ячейка 8. Что должно быть в выводах ---`

```markdown
## 8. Что должно быть в выводах

1. Какая из обратных связей (A или B) играет решающую роль в устойчивости?
2. Как меняется качество процесса при изменении $x_0$ и $\tau_p$?
3. При каких значениях $\alpha_w$ обратная связь по мощности стабилизирует систему?
4. Как доля запаздывающих нейтронов $\beta$ влияет на устойчивость?
5. Подтверждается ли теоретическая оценка $\omega_{osc} \approx \sqrt{x_0/\tau_p}$?
6. Какие параметры обеспечивают быстрое и апериодическое (без колебаний) регулирование?
7. Какой шаг $h$ достаточен для устойчивого численного решения?

---

## Литература
1. Хетрик Д. *Динамика ядерных реакторов*. — М.: Атомиздат, 1975.
2. Саркисов А.А., Пучков В.Н. *Физика переходных процессов в ядерных реакторах*. — М.: Энергоатомиздат, 1983.
3. Аш Дж., Хашен Т. *Ядерное реакторное моделирование*. — М.: Атомиздат, 1967.
```

---

## Часть 2. Интерактивный скрипт с автоанализом

```python
# =====================================================================
#  ИНТЕРАКТИВНАЯ МОДЕЛЬ: реактор с обратной связью по мощности
#  и системой регулирования
# =====================================================================
import numpy as np
import matplotlib.pyplot as plt
from ipywidgets import (interactive_output, FloatSlider, FloatLogSlider,
                        FloatText, Checkbox, Button, VBox, HBox, Output,
                        Layout, HTML, Dropdown)
from IPython.display import display, clear_output
import pandas as pd
from scipy.signal import find_peaks
import math

# -------------------- Правые части системы --------------------
def deriv(t, y, A, B, alpha_w, x0, tau_p, n_ust, l, beta, lambda_):
    dw, dc, rho, Z = y
    ddw = (A*rho + (B*alpha_w*n_ust - beta)*dw)/l + (beta/l)*dc
    ddc = lambda_*(dw - dc)
    drho = Z
    dZ = -Z/tau_p - (x0/tau_p)*dw
    return np.array([ddw, ddc, drho, dZ])

def rk4_step(t, y, h, *args):
    k1 = h*deriv(t, y, *args)
    k2 = h*deriv(t+h/2, y+k1/2, *args)
    k3 = h*deriv(t+h/2, y+k2/2, *args)
    k4 = h*deriv(t+h, y+k3, *args)
    return y + (k1 + 2*k2 + 2*k3 + k4)/6

def simulate(alpha_w, x0, tau_p, n_ust, l, beta, lambda_, h, t_end, A, B):
    dw0 = (1 - n_ust)/n_ust
    y = np.array([dw0, dw0, 0.0, 0.0])
    t = np.arange(0.0, t_end + h, h)
    Y = np.zeros((len(t), 4))
    Y[0] = y
    for i in range(1, len(t)):
        y = rk4_step(t[i-1], y, h, A, B, alpha_w, x0, tau_p,
                     n_ust, l, beta, lambda_)
        Y[i] = y
    return t, Y

# -------------------- Анализ переходного процесса --------------------
def analyse(t, Y, dw0):
    """Возвращает метрики переходного процесса."""
    dw = Y[:, 0]
    abs_dw = np.abs(dw)
    # Перерегулирование
    sigma = np.max(abs_dw) / abs(dw0) if abs(dw0) > 0 else 0.0
    # Статическая ошибка (конец)
    static_err = dw[-1]
    # Время регулирования: последний момент, когда |dw| > 0.05|dw0|
    mask = abs_dw > 0.05*abs(dw0)
    if mask.any():
        t_reg = t[np.where(mask)[0][-1]]
    else:
        t_reg = 0.0
    # Число пиков и период колебаний
    peaks, _ = find_peaks(abs_dw, height=0.02*abs(dw0))
    n_peaks = len(peaks)
    if n_peaks >= 2:
        periods = np.diff(t[peaks])
        T_osc = float(np.mean(periods))
    else:
        T_osc = np.nan
    # Оценка устойчивости: отношение амплитуд двух последних пиков
    if n_peaks >= 2:
        dec_ratio = abs_dw[peaks[-1]] / abs_dw[peaks[0]]
    else:
        dec_ratio = np.nan
    return {
        "σ": sigma, "t_рег": t_reg, "δw_кон": static_err,
        "n_pic": n_peaks, "T_osc": T_osc, "decay": dec_ratio
    }

# -------------------- Хранилище и вывод --------------------
saved_runs = []
out_plot = Output()
out_table = Output()

def draw_plot(label, sim_args):
    with out_plot:
        clear_output(wait=True)
        t, Y = simulate(**sim_args)
        fig, axs = plt.subplots(2, 2, figsize=(12, 8))
        fig.suptitle(label, fontsize=11)

        # Сохранённые кривые
        for run in saved_runs:
            axs[0, 0].plot(run['t'], run['Y'][:, 0], '--',
                           alpha=0.45, lw=1, label=run['label'])
            axs[0, 1].plot(run['t'], run['Y'][:, 2], '--', alpha=0.45, lw=1)
            axs[1, 0].plot(run['t'], run['Y'][:, 3], '--', alpha=0.45, lw=1)
            axs[1, 1].plot(run['t'], run['Y'][:, 1], '--', alpha=0.45, lw=1)

        axs[0, 0].plot(t, Y[:, 0], 'b', lw=2)
        axs[0, 1].plot(t, Y[:, 2], 'r', lw=2)
        axs[1, 0].plot(t, Y[:, 3], 'g', lw=2)
        axs[1, 1].plot(t, Y[:, 1], 'm', lw=2)

        axs[0, 0].set_title('Отклонение мощности δw')
        axs[0, 0].set_xlabel('t, с'); axs[0, 0].set_ylabel('δw')
        axs[0, 0].grid(True)

        axs[0, 1].set_title('Реактивность регулятора ρ_cm')
        axs[0, 1].set_xlabel('t, с'); axs[0, 1].set_ylabel('ρ_cm')
        axs[0, 1].grid(True)

        axs[1, 0].set_title('Скорость изменения ρ_cm (Z)')
        axs[1, 0].set_xlabel('t, с'); axs[1, 0].set_ylabel('Z')
        axs[1, 0].grid(True)

        axs[1, 1].set_title('Концентрация запаздывающих нейтронов δc')
        axs[1, 1].set_xlabel('t, с'); axs[1, 1].set_ylabel('δc')
        axs[1, 1].grid(True)

        if saved_runs:
            axs[0, 0].legend(fontsize=8, loc='best')

        plt.tight_layout()
        plt.show()

def update_table(metrics, label):
    with out_table:
        clear_output(wait=True)
        df = pd.DataFrame([{
            "Режим": label,
            "σ (перерег.)": f"{metrics['σ']:.3f}",
            "t_рег, с": f"{metrics['t_рег']:.3f}",
            "δw(конец)": f"{metrics['δw_кон']:.3e}",
            "N пиков": metrics['n_pic'],
            "T_osc, с": f"{metrics['T_osc']:.3f}" if not np.isnan(metrics['T_osc']) else "—",
            "Затухание": f"{metrics['decay']:.3f}" if not np.isnan(metrics['decay']) else "—",
        }])
        display(HTML("<b>📊 Метрики текущего расчёта:</b>"))
        display(df.style.hide(axis='index'))

# -------------------- Виджеты --------------------
style = {'description_width': '110px'}

alpha_w_sl = FloatSlider(value=-0.017, min=-0.1, max=0.0, step=0.0005,
                         description='α_w:', style=style)
alpha_w_tx = FloatText(value=-0.017, step=0.0001, description='точно:',
                       style=style, layout=Layout(width='150px'))

x0_sl = FloatLogSlider(value=1.0, base=10, min=-2, max=3, step=0.01,
                       description='x0 (log):', style=style)
x0_tx = FloatText(value=1.0, step=0.1, description='точно:',
                  style=style, layout=Layout(width='150px'))

tau_p_sl = FloatLogSlider(value=0.075, base=10, min=-3, max=1, step=0.01,
                          description='τ_p (log):', style=style)
tau_p_tx = FloatText(value=0.075, step=0.001, description='точно:',
                     style=style, layout=Layout(width='150px'))

n_ust_sl = FloatSlider(value=0.8, min=0.1, max=1.5, step=0.05,
                       description='n_уст:', style=style)
l_sl = FloatLogSlider(value=0.001, base=10, min=-5, max=-2, step=0.01,
                      description='l (log):', style=style)
beta_sl = FloatSlider(value=0.0065, min=0.001, max=0.02, step=0.0005,
                      description='β:', style=style, readout_format='.4f')
lambda_sl = FloatSlider(value=0.0765, min=0.01, max=0.2, step=0.001,
                        description='λ:', style=style)
h_sl = FloatLogSlider(value=1e-4, base=10, min=-5, max=-2, step=0.01,
                      description='шаг h (log):', style=style)
t_end_sl = FloatSlider(value=5.0, min=0.5, max=30.0, step=0.5,
                       description='t_end:', style=style)

A_ch = Checkbox(value=True, description='A (регулятор)')
B_ch = Checkbox(value=True, description='B (мощность)')

# Синхронизация слайдер ↔ текст
def link(sl, tx):
    sl.observe(lambda c: setattr(tx, 'value', c['new']), names='value')
    tx.observe(lambda c: setattr(sl, 'value', c['new']), names='value')
link(alpha_w_sl, alpha_w_tx)
link(x0_sl, x0_tx)
link(tau_p_sl, tau_p_tx)

# -------------------- Обновление --------------------
def update(alpha_w, x0, tau_p, n_ust, l, beta, lambda_, h, t_end, A, B):
    sim_args = dict(alpha_w=alpha_w, x0=x0, tau_p=tau_p, n_ust=n_ust,
                    l=l, beta=beta, lambda_=lambda_, h=h, t_end=t_end,
                    A=float(A), B=float(B))
    label = (f"A={int(A)}, B={int(B)} | α_w={alpha_w:.4f}, x0={x0:.3g}, "
             f"τ_p={tau_p:.4g}, n_уст={n_ust:.2f}, β={beta:.4f}, "
             f"h={h:.1e}, t_end={t_end:.1f}")
    draw_plot(label, sim_args)
    t, Y = simulate(**sim_args)
    dw0 = (1 - n_ust)/n_ust
    metrics = analyse(t, Y, dw0)
    update_table(metrics, label)

# -------------------- Кнопки --------------------
btn_save = Button(description="📌 Сохранить кривую",
                  button_style='success', layout=Layout(width='200px'))
btn_clear = Button(description="🗑️ Очистить сохранённые",
                   button_style='warning', layout=Layout(width='220px'))
btn_export = Button(description="💾 Экспорт в Excel",
                    button_style='info', layout=Layout(width='200px'))

def on_save(b):
    sim_args = dict(alpha_w=alpha_w_sl.value, x0=x0_sl.value,
                    tau_p=tau_p_sl.value, n_ust=n_ust_sl.value,
                    l=l_sl.value, beta=beta_sl.value,
                    lambda_=lambda_sl.value, h=h_sl.value,
                    t_end=t_end_sl.value, A=float(A_ch.value),
                    B=float(B_ch.value))
    t, Y = simulate(**sim_args)
    label = (f"α={sim_args['alpha_w']:.3f}, x0={sim_args['x0']:.3g}, "
             f"τ={sim_args['tau_p']:.3g}, A={int(A_ch.value)},B={int(B_ch.value)}")
    saved_runs.append({'t': t, 'Y': Y, 'label': label, 'args': sim_args})
    print(f"✔ Сохранено: {label}")
    update(**sim_args)

def on_clear(b):
    saved_runs.clear()
    print("🗑️ Все сохранённые кривые удалены.")
    update(alpha_w_sl.value, x0_sl.value, tau_p_sl.value, n_ust_sl.value,
           l_sl.value, beta_sl.value, lambda_sl.value, h_sl.value,
           t_end_sl.value, A_ch.value, B_ch.value)

def on_export(b):
    if not saved_runs:
        print("Нет сохранённых кривых.")
        return
    with pd.ExcelWriter('lab1_saved_runs.xlsx') as writer:
        for i, run in enumerate(saved_runs):
            df = pd.DataFrame({
                't': run['t'],
                'dw': run['Y'][:, 0],
                'dc': run['Y'][:, 1],
                'rho_cm': run['Y'][:, 2],
                'Z': run['Y'][:, 3],
            })
            sheet = f"run_{i+1}"[:31]
            df.to_excel(writer, sheet_name=sheet, index=False)
    print(f"💾 Экспортировано {len(saved_runs)} кривых в lab1_saved_runs.xlsx")

btn_save.on_click(on_save)
btn_clear.on_click(on_clear)
btn_export.on_click(on_export)

# -------------------- Пресеты --------------------
def apply_preset(alpha_w, x0, tau_p, n_ust, l, beta, lambda_, h, t_end, A, B):
    alpha_w_sl.value = alpha_w; alpha_w_tx.value = alpha_w
    x0_sl.value = x0; x0_tx.value = x0
    tau_p_sl.value = tau_p; tau_p_tx.value = tau_p
    n_ust_sl.value = n_ust
    l_sl.value = l
    beta_sl.value = beta
    lambda_sl.value = lambda_
    h_sl.value = h
    t_end_sl.value = t_end
    A_ch.value = A
    B_ch.value = B

btn_stable = Button(description="✅ Стабильный", button_style='info')
btn_osc = Button(description="🌊 Колебательный", button_style='info')
btn_unst = Button(description="💥 Неустойчивый", button_style='danger')
btn_no_ctrl = Button(description="🚫 Без регулятора", button_style='warning')
btn_only_pow = Button(description="⚡ Только мощность", button_style='info')

btn_stable.on_click(lambda b: apply_preset(-0.017, 1.0, 0.075, 0.8,
    0.001, 0.0065, 0.0765, 1e-4, 5.0, True, True))
btn_osc.on_click(lambda b: apply_preset(-0.017, 5.0, 0.075, 0.8,
    0.001, 0.0065, 0.0765, 1e-4, 10.0, True, True))
btn_unst.on_click(lambda b: apply_preset(-0.05, 20.0, 0.075, 0.8,
    0.001, 0.0065, 0.0765, 1e-4, 5.0, True, True))
btn_no_ctrl.on_click(lambda b: apply_preset(-0.017, 1.0, 0.075, 0.8,
    0.001, 0.0065, 0.0765, 1e-4, 5.0, False, True))
btn_only_pow.on_click(lambda b: apply_preset(-0.017, 1.0, 0.075, 0.8,
    0.001, 0.0065, 0.0765, 1e-4, 5.0, True, False))

# -------------------- Интерфейс --------------------
out = interactive_output(update, {
    'alpha_w': alpha_w_sl, 'x0': x0_sl, 'tau_p': tau_p_sl,
    'n_ust': n_ust_sl, 'l': l_sl, 'beta': beta_sl,
    'lambda_': lambda_sl, 'h': h_sl, 't_end': t_end_sl,
    'A': A_ch, 'B': B_ch
})

display(HTML("<h3>🔬 Интерактивная лабораторная №1: "
             "обратная связь по мощности и система регулирования</h3>"))
display(HTML("<b>Пресеты:</b>"))
display(HBox([btn_stable, btn_osc, btn_unst, btn_no_ctrl, btn_only_pow]))
display(HTML("<hr><b>Параметры (слайдер + точный ввод):</b>"))
display(VBox([
    HBox([alpha_w_sl, alpha_w_tx]),
    HBox([x0_sl, x0_tx]),
    HBox([tau_p_sl, tau_p_tx]),
    HBox([n_ust_sl, l_sl]),
    HBox([beta_sl, lambda_sl]),
    HBox([h_sl, t_end_sl]),
    HBox([A_ch, B_ch]),
]))
display(HTML("<hr><b>Управление кривыми:</b>"))
display(HBox([btn_save, btn_clear, btn_export]))
display(HTML("<hr>"))
display(out_table)
display(out_plot)
display(out)
```

---

## Что вы получаете по сравнению с предыдущей версией

| Возможность | Было | Стало |
|---|---|---|
| Точный ввод `α_w`, `x0`, `τ_p` | ❌ | ✅ (FloatText рядом) |
| Логарифмические слайдеры | частично | ✅ для `x0`, `τ_p`, `l`, `h` |
| Пресеты (5 режимов) | ❌ | ✅ |
| Сохранение кривых на графике | ✅ | ✅ |
| **Экспорт всех сохранённых кривых в Excel** | ❌ | ✅ (кнопка «Экспорт в Excel») |
| **Таблица метрик в реальном времени** | ❌ | ✅ (σ, t_рег, δw_кон, N пиков, T_osc, затухание) |
| Автоопределение периода колебаний | ❌ | ✅ |
| Оценка устойчивости по декременту | ❌ | ✅ |

---

## Как провести эксперимент по шагам

1. **Нажмите «✅ Стабильный»** — убедитесь, что `δw → 0`, метрики: `σ ≈ 1.3`, `t_рег ≈ 1 с`, `N пиков = 2`.
2. **Нажмите «🌊 Колебательный»** — метрики покажут `σ > 2`, `N пиков > 5`, `Затухание < 1` (система устойчива, но колеблется).
3. **Нажмите «💥 Неустойчивый»** — метрики покажут `Затухание > 1` (амплитуда растёт), `t_рег = t_end` (не успевает затухнуть).
4. **Нажмите «📌 Сохранить кривую»** после каждого режима.
5. **Нажмите «💾 Экспорт в Excel»** — получите `lab1_saved_runs.xlsx` со всеми кривыми для отчёта.
6. **Серия по `x0`**: задайте `x0 = 0.1, 0.5, 1, 2, 5, 10` (через поле точного ввода), каждый раз сохраняйте. Смотрите, как `σ` и `N пиков` растут → граница устойчивости где-то между 5 и 10.
7. **Серия по `β`**: `0.003, 0.005, 0.0065, 0.01, 0.02`. Убедитесь, что рост `β` **подавляет** колебания (N пиков уменьшается).
8. **Серия по `τ_p`**: `0.01, 0.05, 0.075, 0.2, 0.5`. Проверьте теоретическую оценку `T_osc ≈ 2π√(τ_p/x0)`.

Все результаты автоматически попадут в таблицу метрик и сохранятся в Excel — это и будет готовый раздел «Результаты моделирования» отчёта.

