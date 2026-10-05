# Лабораторные страницы

Теория лежит в `7_sem/lab01/index.html` и `7_sem/lab02/index.html`. Общие стили — в корневом `styles.css`. Расчёт первой работы — в `src/lab01/`, второй — в `src/lab02/`.

Формулы записаны в LaTeX и рисуются локальным KaTeX, без CDN и интернета.

## Сборка

```bash
npm run build:all
```

Отдельная работа:

```bash
npm run build:lab01
npm run build:lab02
```

`npm run build` только компилирует TypeScript. Скрипты `build:lab01` и `build:lab02` собирают автономные каталоги `dist/7_sem/lab01/` и `dist/7_sem/lab02/`.

## Автономный архив

Каталог `dist/7_sem/lab01/` или `dist/7_sem/lab02/` можно целиком упаковать в zip. В архиве должны быть:

- `index.html`
- `styles.css`
- `js/`
- `katex.min.js`
- `katex.min.css`
- `fonts/`

`index.html` можно открыть двойным щелчком: скрипт лабораторной собран в один файл и не требует сервера. Каталог всех работ по-прежнему открывается через сервер. Из корня проекта:

```bash
npm run dev
```

Затем откройте `http://localhost:3000/dist/7_sem/lab01/` или `http://localhost:3000/dist/7_sem/lab02/`.
