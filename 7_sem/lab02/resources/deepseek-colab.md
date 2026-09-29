Ниже — готовый текст теории для вставки в Colab. Разбейте его на несколько **Markdown-ячеек** (как помечено `# --- Ячейка N ---`), чтобы было удобно читать и прогонять. Формулы записаны в LaTeX, Colab их отрендерит.

---

### `# --- Ячейка 1. Заголовок и постановка задачи ---`

```markdown
# Лабораторная работа
## Реактор с обратной связью по мощности и системой регулирования

**Цель работы:** исследовать динамику ядерного реактора при переводе мощности с одного уровня на другой с учётом обратной связи по мощности и автоматической системы регулирования. Определить влияние параметров (α_w, x₀, τ_p, β, λ, l) на устойчивость и качество переходного процесса.

**Задачи:**
1. Реализовать численное решение уравнений точечной кинетики с одной группой запаздывающих нейтронов методом Рунге–Кутты 4-го порядка.
2. Провести серию численных экспериментов с разными комбинациями обратных связей (ключи A и B).
3. Исследовать влияние параметров на устойчивость и качество регулирования.
4. Построить графики переходных процессов и сделать выводы.
```

---

### `# --- Ячейка 2. Точечная кинетика ---`

```markdown
## 1. Уравнения точечной кинетики

Динамика нейтронного поля в реакторе с одной группой запаздывающих нейтронов описывается системой:

$$
\begin{cases}
\dfrac{dn}{dt} = \dfrac{\rho + \alpha_w \cdot n - \beta}{l}\, n + \lambda\, c,\\[8pt]
\dfrac{dc}{dt} = \dfrac{\beta}{l}\, n - \lambda\, c,
\end{cases}
$$

где:
- $n(t)$ — плотность нейтронов (пропорциональна мощности $W$),
- $c(t)$ — концентрация ядер-предшественников запаздывающих нейтронов,
- $\rho$ — реактивность,
- $\alpha_w$ — коэффициент реактивности по мощности (отрицательная обратная связь),
- $\beta$ — доля запаздывающих нейтронов,
- $l$ — время жизни мгновенных нейтронов,
- $\lambda$ — постоянная распада предшественников.

**Физический смысл членов:**
- $(\rho - \beta)/l$ — скорость изменения за счёт мгновенных нейтронов;
- $\lambda c$ — вклад от распада предшественников;
- $\beta n / l$ — «утечка» мгновенных нейтронов в предшественники;
- $\alpha_w n$ — обратная связь по мощности (температурный или мощностной эффект реактивности).
```

---

### `# --- Ячейка 3. Система регулирования ---`

```markdown
## 2. Уравнение системы регулирования

Система регулирования имеет инерционность второго порядка (например, электропривод стержней СУЗ). Её поведение описывается:

$$
\tau_p\,\dfrac{d^2\rho_{cm}}{dt^2} + \dfrac{d\rho_{cm}}{dt} = -x_0\, y,
$$

где $\rho_{cm}(t)$ — реактивность, вносимая системой регулирования, $\tau_p$ — постоянная времени, $x_0$ — коэффициент усиления, а $y$ — сигнал рассогласования:

$$
y = \dfrac{n - n_{уст}}{n_{уст}}.
$$

Если $|y| \le y_0$ (мал порог срабатывания), то регулятор не работает: $\rho_{cm} = 0$.

**Замечание:** в линейной модели мы пренебрегаем порогом $y_0$ и считаем регулятор непрерывным.
```

---

### `# --- Ячейка 4. Линеаризация ---`

```markdown
## 3. Линеаризация системы

Введём отклонения от стационарного состояния $n_{уст}$, $c_{уст}$:

$$
\delta n = n - n_{уст}, \qquad \delta c = c - c_{уст}.
$$

В стационарном состоянии ($dn/dt = dc/dt = 0$):

$$
c_{уст} = \dfrac{\beta}{\lambda l}\, n_{уст}.
$$

Пренебрегая малыми второго порядка ($\delta n \cdot \rho_{cm}$, $\delta n^2$), получаем **линеаризованную систему**:

$$
\begin{cases}
\dfrac{d\,\delta n}{dt} = \dfrac{\rho_{cm} + (\alpha_w n_{уст} - \beta)}{l}\,\delta n + \lambda\,\delta c,\\[8pt]
\dfrac{d\,\delta c}{dt} = \dfrac{\beta}{l}\,\delta n - \lambda\,\delta c,\\[8pt]
\tau_p\,\dfrac{d^2 \rho_{cm}}{dt^2} + \dfrac{d \rho_{cm}}{dt} = -x_0\,\delta w,
\end{cases}
$$

где введена **относительная мощность** $\delta w = \delta n / n_{уст}$.
```

---

### `# --- Ячейка 5. Безразмерная форма ---`

```markdown
## 4. Безразмерная форма

Перейдём к относительным переменным:

$$
\delta w = \dfrac{n - n_{уст}}{n_{уст}}, \qquad
\widetilde{\delta c} = \dfrac{c - c_{уст}}{c_{уст}}.
$$

С учётом $c_{уст} = \beta n_{уст}/(\lambda l)$ система принимает вид:

$$
\begin{cases}
\dfrac{d\,\delta w}{dt} = \dfrac{A\,\rho_{cm} + \bigl(B\,\alpha_w n_{уст} - \beta\bigr)\,\delta w}{l} + \dfrac{\beta}{l}\,\widetilde{\delta c},\\[8pt]
\dfrac{d\,\widetilde{\delta c}}{dt} = \lambda\,(\delta w - \widetilde{\delta c}),\\[8pt]
\dfrac{d\rho_{cm}}{dt} = Z,\\[8pt]
\dfrac{dZ}{dt} = -\dfrac{Z}{\tau_p} - \dfrac{x_0}{\tau_p}\,\delta w.
\end{cases}
$$

Здесь введены **ключи A и B**, позволяющие включать/отключать обратные связи:

| Режим | A | B | Что работает |
|:---:|:---:|:---:|---|
| Обе связи | 1 | 1 | мощность + регулятор |
| Только мощность | 0 | 1 | обратная связь по мощности |
| Только регулятор | 1 | 0 | система регулирования |
| Без связей | 0 | 0 | «голый» реактор |
```

---

### `# --- Ячейка 6. Начальные условия ---`

```markdown
## 5. Начальные условия

Пусть в момент $t=0$ реактор работает на уровне $n_0$, а требуется выйти на $n_{уст}$.  
Введём параметр $\alpha = n_0 / n_{уст}$.

Начальные отклонения:

$$
\delta w(0) = \dfrac{n_0 - n_{уст}}{n_{уст}} = 1 - \alpha,
$$

$$
\widetilde{\delta c}(0) = \dfrac{c_0 - c_{уст}}{c_{уст}} = \dfrac{\beta n_0 /(\lambda l) - \beta n_{уст}/(\lambda l)}{\beta n_{уст}/(\lambda l)} = \dfrac{n_0 - n_{уст}}{n_{уст}} = 1 - \alpha.
$$

Начальные условия по регулятору:

$$
\rho_{cm}(0) = 0, \qquad Z(0) = 0.
$$

> В лаборатории полагаем $n_{уст} = 0.8$, что соответствует снижению мощности с номинала до 80 %, т.е. $\alpha = 1/n_{уст} = 1.25$ и $\delta w(0) = -0.25$.
```

---

### `# --- Ячейка 7. Параметры и численный метод ---`

```markdown
## 6. Численный метод: Рунге–Кутты 4-го порядка

Систему из четырёх ОДУ первого порядка решаем классическим методом РК4:

$$
\mathbf{y}_{i+1} = \mathbf{y}_i + \dfrac{h}{6}\left(\mathbf{k}_1 + 2\mathbf{k}_2 + 2\mathbf{k}_3 + \mathbf{k}_4\right),
$$

где $\mathbf{y} = [\delta w, \widetilde{\delta c}, \rho_{cm}, Z]^T$ и

$$
\begin{aligned}
\mathbf{k}_1 &= f(t_i, \mathbf{y}_i),\\
\mathbf{k}_2 &= f(t_i + h/2,\ \mathbf{y}_i + h\mathbf{k}_1/2),\\
\mathbf{k}_3 &= f(t_i + h/2,\ \mathbf{y}_i + h\mathbf{k}_2/2),\\
\mathbf{k}_4 &= f(t_i + h,\ \mathbf{y}_i + h\mathbf{k}_3).
\end{aligned}
$$

### Выбор шага интегрирования
Уравнения жёсткие: самое быстрое время — $l$ (порядка $10^{-3}$ с).  
Для устойчивости РК4 необходимо $h \ll l$, поэтому берём $h \sim 10^{-4}$ с.

### Эталонные значения параметров
| Параметр | Значение | Единица |
|---|---|---|
| $l$ | $10^{-3}$ | с |
| $\beta$ | $0.0065$ | – |
| $\lambda$ | $0.0765$ | с⁻¹ |
| $\alpha_w$ | $-1.7\cdot10^{-2}$ | – |
| $\tau_p$ | $0.075$ | с |
| $x_0$ | 1…100 | – |
| $n_{уст}$ | $0.8$ | – |
| $h$ | $10^{-4}$ | с |
```

---

### `# --- Ячейка 8. Что такое устойчивость ---`

```markdown
## 7. Понятие устойчивости

Переходный процесс называется **устойчивым**, если $\delta w(t) \to 0$ при $t\to\infty$.  
Формально это определяется корнями характеристического уравнения линеаризованной системы.

### Оценка частоты колебаний
Если система неустойчива и раскачивается, характерная частота близка к:

$$
\omega_{osc} \approx \sqrt{\dfrac{x_0}{\tau_p}}.
$$

Это полезно для проверки численных результатов: например, при $x_0 = 1$, $\tau_p = 0.075$ получаем $\omega \approx 3.65$ рад/с, период $T \approx 1.7$ с.

### Источники неустойчивости в модели
1. **Инерционность регулятора** $\tau_p$ — даёт фазовое запаздывание.
2. **Слишком большой коэффициент усиления** $x_0$ — увеличивает петлевое усиление.
3. **Слабая отрицательная обратная связь** $|\alpha_w|$ — не демпфирует колебания.

### Роль запаздывающих нейтронов
Увеличение $\beta$ **стабилизирует** реактор: растёт модуль эффективного коэффициента $|B\alpha_w n_{уст} - \beta|$ и усиливается связь с концентрацией предшественников. Однако $\beta$ не может полностью компенсировать неустойчивость, вносимую регулятором.
```

---

### `# --- Ячейка 9. План эксперимента ---`

```markdown
## 8. Программа численных экспериментов

### 8.1. Сравнение режимов
Поочерёдно установить:
- **A=1, B=1** — обе связи;
- **A=0, B=1** — только мощность;
- **A=1, B=0** — только регулятор;
- **A=0, B=0** — без связей.

Сравнить четыре кривые $\delta w(t)$.

### 8.2. Влияние $x_0$
Зафиксировать $A=1, B=1$, $\alpha_w=-0.017$, $\tau_p=0.075$.  
Пройти по $x_0 = 0.1;\ 0.5;\ 1;\ 5;\ 20$. Найти границу устойчивости.

### 8.3. Влияние $\alpha_w$
Зафиксировать $x_0=1$, остальные — как в 8.2.  
Пройти $\alpha_w = -0.005;\ -0.010;\ -0.017;\ -0.030;\ -0.050$.

### 8.4. Влияние $\tau_p$
Зафиксировать $x_0=2$, $\alpha_w=-0.017$.  
Пройти $\tau_p = 0.01;\ 0.05;\ 0.075;\ 0.2;\ 0.5$.

### 8.5. Влияние $\beta$
Зафиксировать $x_0=1$, $\tau_p=0.075$.  
Пройти $\beta = 0.003;\ 0.005;\ 0.0065;\ 0.01;\ 0.02$.

### 8.6. Проверка численного метода
При устойчивом режиме пройти $h = 10^{-4},\ 5\cdot10^{-4},\ 10^{-3}$ — показать, что при увеличении шага появляется численный «шум».

### 8.7. Обязательные величины для отчёта
- Перерегулирование $\sigma = \dfrac{\delta w_{max}}{\delta w(0)}$.
- Время регулирования $t_{рег}$ (когда $|\delta w| < 5\%\,\delta w(0)$).
- Частота и период колебаний.
- Границы устойчивости по каждому параметру.
```

---

### `# --- Ячейка 10. Что должно быть в выводах ---`

```markdown
## 9. Что должно быть в выводах лабораторной

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

## Как вставить в Colab

1. Создайте новую тетрадь.
2. Добавьте **Markdown-ячейки** для каждого блока выше (по одному разделу = одна ячейка).
3. После ячейки 10 добавьте **Code-ячейку** с интерактивным скриптом из предыдущего сообщения.

Порядок будет такой:

```
[Markdown]  Ячейка 1  — заголовок и постановка задачи
[Markdown]  Ячейка 2  — точечная кинетика
[Markdown]  Ячейка 3  — система регулирования
[Markdown]  Ячейка 4  — линеаризация
[Markdown]  Ячейка 5  — безразмерная форма
[Markdown]  Ячейка 6  — начальные условия
[Markdown]  Ячейка 7  — численный метод
[Markdown]  Ячейка 8  — устойчивость
[Markdown]  Ячейка 9  — план эксперимента
[Markdown]  Ячейка 10 — что в выводах
[Code]      — интерактивная модель со слайдерами
```

Если хотите, могу добавить ещё **ячейку с автогенерацией графиков для отчёта** (сохранение PNG с подписанными осями для вставки в Word) или **ячейку с расчётом декремента затухания и границы устойчивости автоматически**.


Отлично, теперь процесс **физически корректный**! Смотрите: `δw` плавно затухает до нуля, `Z` тоже, а `ρ_cm` медленно дрейфует — это статическая ошибка регулятора (нормально для П-регулятора без интегратора).

Теперь давайте переделаем интерфейс, чтобы было удобно проводить эксперименты. Я заменю обычные слайдеры на:
1. **Логарифмические слайдеры** для `x0`, `τ_p`, `l` — потому что они меняются на порядки.
2. **Поля ввода** рядом со слайдерами — для точного ввода значения.
3. **Кнопки-пресеты** — быстрая загрузка типовых режимов.
4. **Кнопку "Сохранить кривую"** — чтобы накладывать несколько экспериментов на один график для сравнения.

```python
# ==================== ИНТЕРАКТИВНАЯ ЛАБОРАТОРНАЯ (v2) ====================
import numpy as np
import matplotlib.pyplot as plt
from ipywidgets import (interactive_output, FloatSlider, FloatLogSlider,
                        FloatText, Checkbox, Button, VBox, HBox, Output,
                        Layout, Label, HTML)
from IPython.display import display, clear_output

# ---------- Правые части системы ----------
def deriv(t, y, A, B, alpha_w, x0, tau_p, n_ust, l, beta, lambda_):
    dw, dc, rho, Z = y
    ddw = (A * rho + (B * alpha_w * n_ust - beta) * dw) / l + (beta / l) * dc
    ddc = lambda_ * (dw - dc)
    drho = Z
    dZ = -Z / tau_p - (x0 / tau_p) * dw
    return np.array([ddw, ddc, drho, dZ])

def rk4_step(t, y, h, A, B, alpha_w, x0, tau_p, n_ust, l, beta, lambda_):
    k1 = h * deriv(t, y, A, B, alpha_w, x0, tau_p, n_ust, l, beta, lambda_)
    k2 = h * deriv(t + h/2, y + k1/2, A, B, alpha_w, x0, tau_p, n_ust, l, beta, lambda_)
    k3 = h * deriv(t + h/2, y + k2/2, A, B, alpha_w, x0, tau_p, n_ust, l, beta, lambda_)
    k4 = h * deriv(t + h, y + k3, A, B, alpha_w, x0, tau_p, n_ust, l, beta, lambda_)
    return y + (k1 + 2*k2 + 2*k3 + k4) / 6

def simulate(alpha_w, x0, tau_p, n_ust, l, beta, lambda_, h, t_end, A, B):
    dw0 = (1 - n_ust) / n_ust
    y0 = np.array([dw0, dw0, 0.0, 0.0])
    t = np.arange(0, t_end + h, h)
    y = np.zeros((len(t), 4))
    y[0] = y0
    for i in range(1, len(t)):
        y[i] = rk4_step(t[i-1], y[i-1], h, A, B,
                        alpha_w, x0, tau_p, n_ust, l, beta, lambda_)
    return t, y

# ---------- Хранилище сохранённых кривых ----------
saved_runs = []   # список dict: {'t':..., 'y':..., 'label':...}
out_plot = Output()

def draw_plot(current_params):
    """Рисует текущий расчёт + сохранённые кривые."""
    with out_plot:
        clear_output(wait=True)
        fig, axs = plt.subplots(2, 2, figsize=(12, 8))
        fig.suptitle(current_params['label'], fontsize=12)

        # --- текущий расчёт ---
        t, y = simulate(**current_params['sim_args'])

        # --- сохранённые кривые (тонкими линиями) ---
        for run in saved_runs:
            axs[0, 0].plot(run['t'], run['y'][:, 0], '--', alpha=0.5, lw=1,
                           label=run['label'])
            axs[0, 1].plot(run['t'], run['y'][:, 2], '--', alpha=0.5, lw=1)
            axs[1, 0].plot(run['t'], run['y'][:, 3], '--', alpha=0.5, lw=1)
            axs[1, 1].plot(run['t'], run['y'][:, 1], '--', alpha=0.5, lw=1)

        # --- текущий ---
        axs[0, 0].plot(t, y[:, 0], 'b', lw=2)
        axs[0, 1].plot(t, y[:, 2], 'r', lw=2)
        axs[1, 0].plot(t, y[:, 3], 'g', lw=2)
        axs[1, 1].plot(t, y[:, 1], 'm', lw=2)

        axs[0, 0].set_title('Отклонение мощности δw')
        axs[0, 0].set_xlabel('t, с'); axs[0, 0].set_ylabel('δw'); axs[0, 0].grid(True)

        axs[0, 1].set_title('Реактивность регулятора ρ_cm')
        axs[0, 1].set_xlabel('t, с'); axs[0, 1].set_ylabel('ρ_cm'); axs[0, 1].grid(True)

        axs[1, 0].set_title('Скорость изменения ρ_cm (Z)')
        axs[1, 0].set_xlabel('t, с'); axs[1, 0].set_ylabel('Z'); axs[1, 0].grid(True)

        axs[1, 1].set_title('Концентрация запаздывающих нейтронов δc')
        axs[1, 1].set_xlabel('t, с'); axs[1, 1].set_ylabel('δc'); axs[1, 1].grid(True)

        if saved_runs:
            axs[0, 0].legend(fontsize=8, loc='best')

        plt.tight_layout()
        plt.show()

# ---------- Виджеты ----------
# Общий стиль
style = {'description_width': '100px'}
layout_w = Layout(width='420px')

# --- alpha_w: обычный слайдер + текст ---
alpha_w_sl = FloatSlider(value=-0.017, min=-0.1, max=0.0, step=0.0005,
                         description='α_w:', style=style)
alpha_w_tx = FloatText(value=-0.017, step=0.0001, description='точно:',
                       style=style, layout=Layout(width='160px'))

# --- x0: логарифмический слайдер ---
x0_sl = FloatLogSlider(value=1.0, base=10, min=-2, max=3, step=0.01,
                       description='x0 (log):', style=style)
x0_tx = FloatText(value=1.0, step=0.1, description='точно:',
                  style=style, layout=Layout(width='160px'))

# --- tau_p: логарифмический слайдер ---
tau_p_sl = FloatLogSlider(value=0.075, base=10, min=-3, max=0, step=0.01,
                          description='τ_p (log):', style=style)
tau_p_tx = FloatText(value=0.075, step=0.001, description='точно:',
                     style=style, layout=Layout(width='160px'))

# --- остальные ---
n_ust_sl = FloatSlider(value=0.8, min=0.1, max=1.5, step=0.05,
                       description='n_уст:', style=style)
l_sl = FloatLogSlider(value=0.001, base=10, min=-5, max=-2, step=0.01,
                      description='l (log):', style=style)
beta_sl = FloatSlider(value=0.0065, min=0.001, max=0.01, step=0.0005,
                      description='β:', style=style, readout_format='.4f')
lambda_sl = FloatSlider(value=0.0765, min=0.01, max=0.2, step=0.001,
                        description='λ:', style=style)
h_sl = FloatLogSlider(value=0.0001, base=10, min=-5, max=-2, step=0.01,
                      description='шаг h (log):', style=style)
t_end_sl = FloatSlider(value=5.0, min=0.5, max=20.0, step=0.5,
                       description='t_end:', style=style)

# --- Ключи A, B ---
A_ch = Checkbox(value=True, description='A (регулятор)')
B_ch = Checkbox(value=True, description='B (мощность)')

# --- Синхронизация слайдер ↔ текст ---
def link_slider_text(sl, tx, name):
    def sl_changed(change):
        tx.value = change['new']
    def tx_changed(change):
        sl.value = change['new']
    sl.observe(sl_changed, names='value')
    tx.observe(tx_changed, names='value')

link_slider_text(alpha_w_sl, alpha_w_tx, 'alpha_w')
link_slider_text(x0_sl, x0_tx, 'x0')
link_slider_text(tau_p_sl, tau_p_tx, 'tau_p')

# ---------- Основная функция обновления ----------
def update(alpha_w, x0, tau_p, n_ust, l, beta, lambda_, h, t_end, A, B):
    sim_args = dict(
        alpha_w=alpha_w, x0=x0, tau_p=tau_p, n_ust=n_ust,
        l=l, beta=beta, lambda_=lambda_, h=h, t_end=t_end,
        A=float(A), B=float(B)
    )
    label = (f"A={int(A)}, B={int(B)} | α_w={alpha_w:.4f}, x0={x0:.3g}, "
             f"τ_p={tau_p:.4g}, n_уст={n_ust:.2f}, h={h:.5f}, t_end={t_end:.1f}")
    draw_plot({'sim_args': sim_args, 'label': label})

# ---------- Кнопка "Сохранить кривую" ----------
btn_save = Button(description="📌 Сохранить текущую кривую",
                  button_style='success', layout=Layout(width='280px'))
btn_clear = Button(description="🗑️ Очистить сохранённые",
                   button_style='warning', layout=Layout(width='280px'))

def on_save(b):
    # берём значения из слайдеров
    sim_args = dict(
        alpha_w=alpha_w_sl.value, x0=x0_sl.value, tau_p=tau_p_sl.value,
        n_ust=n_ust_sl.value, l=l_sl.value, beta=beta_sl.value,
        lambda_=lambda_sl.value, h=h_sl.value, t_end=t_end_sl.value,
        A=float(A_ch.value), B=float(B_ch.value)
    )
    t, y = simulate(**sim_args)
    label = (f"α={sim_args['alpha_w']:.3f}, x0={sim_args['x0']:.3g}, "
             f"τ={sim_args['tau_p']:.3g}, n={sim_args['n_ust']:.2f}, "
             f"A={int(A_ch.value)},B={int(B_ch.value)}")
    saved_runs.append({'t': t, 'y': y, 'label': label})
    print(f"✔ Сохранено: {label}")
    update(**sim_args)

def on_clear(b):
    saved_runs.clear()
    print("🗑️ Все сохранённые кривые удалены.")
    update(alpha_w_sl.value, x0_sl.value, tau_p_sl.value, n_ust_sl.value,
           l_sl.value, beta_sl.value, lambda_sl.value, h_sl.value,
           t_end_sl.value, A_ch.value, B_ch.value)

btn_save.on_click(on_save)
btn_clear.on_click(on_clear)

# ---------- Пресеты ----------
btn_stable = Button(description="✅ Стабильный режим", button_style='info')
btn_oscill = Button(description="🌊 Колебательный", button_style='info')
btn_unstable = Button(description="💥 Неустойчивый", button_style='danger')
btn_no_ctrl = Button(description="🚫 Без регулятора", button_style='warning')
btn_only_pow = Button(description="⚡ Только мощность", button_style='info')

def apply_preset(alpha_w, x0, tau_p, n_ust, l, beta, lambda_, h, t_end, A, B):
    alpha_w_sl.value = alpha_w; alpha_w_tx.value = alpha_w
    x0_sl.value = x0;           x0_tx.value = x0
    tau_p_sl.value = tau_p;     tau_p_tx.value = tau_p
    n_ust_sl.value = n_ust
    l_sl.value = l
    beta_sl.value = beta
    lambda_sl.value = lambda_
    h_sl.value = h
    t_end_sl.value = t_end
    A_ch.value = A
    B_ch.value = B

btn_stable.on_click(lambda b: apply_preset(-0.017, 1.0, 0.075, 0.8, 0.001, 0.0065, 0.0765, 0.0001, 5.0, True, True))
btn_oscill.on_click(lambda b: apply_preset(-0.017, 5.0, 0.075, 0.8, 0.001, 0.0065, 0.0765, 0.0001, 10.0, True, True))
btn_unstable.on_click(lambda b: apply_preset(-0.05, 20.0, 0.075, 0.8, 0.001, 0.0065, 0.0765, 0.0001, 5.0, True, True))
btn_no_ctrl.on_click(lambda b: apply_preset(-0.017, 1.0, 0.075, 0.8, 0.001, 0.0065, 0.0765, 0.0001, 5.0, False, True))
btn_only_pow.on_click(lambda b: apply_preset(-0.017, 1.0, 0.075, 0.8, 0.001, 0.0065, 0.0765, 0.0001, 5.0, True, False))

# ---------- Итоговый интерфейс ----------
out = interactive_output(update, {
    'alpha_w': alpha_w_sl, 'x0': x0_sl, 'tau_p': tau_p_sl,
    'n_ust': n_ust_sl, 'l': l_sl, 'beta': beta_sl,
    'lambda_': lambda_sl, 'h': h_sl, 't_end': t_end_sl,
    'A': A_ch, 'B': B_ch
})

display(HTML("<h3>🔬 Интерактивная лабораторная: реактор с обратной связью</h3>"))
display(HTML("<b>Пресеты:</b>"))
display(HBox([btn_stable, btn_oscill, btn_unstable, btn_no_ctrl, btn_only_pow]))
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
display(HBox([btn_save, btn_clear]))
display(HTML("<hr>"))
display(out_plot)
display(out)
```

---

## Что изменилось и как это использовать

### 1. Логарифмические слайдеры для `x0`, `τ_p`, `l`, `h`
Теперь диапазон:
- `x0` — от **0.01** до **1000** (раньше от 0 до 500 с грубым шагом).
- `τ_p` — от **0.001** до **1** с.
- `l` — от **1e-5** до **1e-2** с.
- `h` — от **1e-5** до **1e-2** с.

Это позволяет плавно исследовать параметры, меняющиеся на порядки.

### 2. Точный ввод
Рядом с `α_w`, `x0`, `τ_p` есть **поля ввода** — можете ввести, например, `x0 = 3.7` или `α_w = -0.0173` точно, без подбора слайдером.

### 3. Пресеты (кнопки сверху)
- **✅ Стабильный режим** — параметры, с которых вы только что получили хороший график.
- **🌊 Колебательный** — увеличивает `x0` до 5, увидите затухающие колебания.
- **💥 Неустойчивый** — `α_w = −0.05`, `x0 = 20`, система разойдётся.
- **🚫 Без регулятора** — `A=False`, `B=True`.
- **⚡ Только мощность** — `A=True`, `B=False`.

### 4. Наложение кривых (для сравнения экспериментов)
- Настроили параметры → нажали **📌 Сохранить текущую кривую**.
- Поменяли параметр (например, `x0`) → старая кривая остаётся пунктиром на графике.
- Так можно наложить 5–10 кривых и сравнить влияние параметра.
- **🗑️ Очистить** — убирает все сохранённые.

---

## Рекомендуемый план эксперимента (что теперь удобно делать)

### Эксперимент 1: влияние `x0`
1. Нажмите **✅ Стабильный режим**.
2. Сохраните кривую (`📌`).
3. Поставьте `x0 = 2` → сохраните.
4. Поставьте `x0 = 5` → сохраните.
5. Поставьте `x0 = 10` → сохраните.
6. Поставьте `x0 = 20` → сохраните.

Теперь на графике `δw` видны **5 кривых**: как растёт перерегулирование и появляются колебания с ростом `x0`.

### Эксперимент 2: влияние `α_w`
Сбросьте сохранённые. Зафиксируйте `x0 = 1`, `τ_p = 0.075`.  
Меняйте `α_w`: **−0.005, −0.010, −0.017, −0.030, −0.050**, каждый раз сохраняя.  
Смотрите, как меняется статическая ошибка и устойчивость.

### Эксперимент 3: влияние `τ_p`
Зафиксируйте `α_w = −0.017`, `x0 = 2`.  
Пробегите `τ_p`: **0.01, 0.05, 0.1, 0.2, 0.5**.  
Смотрите, как замедляется выход на режим.

### Эксперимент 4: сравнение A/B
Нажмите пресеты **🚫 Без регулятора** и **⚡ Только мощность**, каждый сохраните.  
Затем вручную поставьте **A=1, B=1** (оба включены) и сохраните.  
Сравните три кривые — это центральный результат лабораторной.

### Эксперимент 5: шаг интегрирования
Сохраните кривую при `h = 1e-4`. Затем `h = 1e-3` — увидите, что при большом шаге появляется численный «шум». Это подтверждение корректности выбора `h`.
