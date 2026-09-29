const GRID_COLOR = "#dbe3ee";
const AXIS_COLOR = "#59677d";
const PADDING = { left: 48, right: 12, top: 16, bottom: 28 };
const GRID_LINES = 5;

export type ChartSeries = {
  x: number[];
  y: number[];
  color: string;
  dashed?: boolean;
  width?: number;
};

function bounds(series: ChartSeries[]): { xMin: number; xMax: number; yMin: number; yMax: number } {
  let xMin = Infinity;
  let xMax = -Infinity;
  let yMin = Infinity;
  let yMax = -Infinity;

  for (const line of series) {
    for (let index = 0; index < line.x.length; index += 1) {
      const x = line.x[index];
      const y = line.y[index];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      xMin = Math.min(xMin, x);
      xMax = Math.max(xMax, x);
      yMin = Math.min(yMin, y);
      yMax = Math.max(yMax, y);
    }
  }

  return { xMin, xMax, yMin, yMax };
}

export function drawChart(canvas: HTMLCanvasElement, series: ChartSeries[], label: string): void {
  const context = canvas.getContext("2d");
  const visible = series.filter((line) => line.x.length > 0 && line.y.length > 0);
  if (!context || visible.length === 0) return;

  const ratio = devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const { xMin, xMax, yMin, yMax } = bounds(visible);
  const low = yMin === yMax ? yMin - 1 : yMin;
  const high = yMin === yMax ? yMax + 1 : yMax;
  const timeSpan = xMax === xMin ? 1 : xMax - xMin;

  context.strokeStyle = GRID_COLOR;
  context.lineWidth = 1;
  context.font = "11px system-ui";
  context.fillStyle = AXIS_COLOR;

  for (let line = 0; line < GRID_LINES; line += 1) {
    const yPosition = PADDING.top + (plotHeight * line) / 4;
    context.beginPath();
    context.moveTo(PADDING.left, yPosition);
    context.lineTo(width - PADDING.right, yPosition);
    context.stroke();
    const tick = high - ((high - low) * line) / 4;
    context.fillText(tick.toPrecision(3), 3, yPosition + 4);
  }

  for (const line of visible) {
    context.strokeStyle = line.color;
    context.lineWidth = line.width ?? (line.dashed ? 1.5 : 2);
    context.setLineDash(line.dashed ? [5, 4] : []);
    context.beginPath();
    let started = false;
    for (let index = 0; index < line.y.length; index += 1) {
      const x = line.x[index];
      const y = line.y[index];
      if (!Number.isFinite(x) || !Number.isFinite(y)) continue;
      const xPosition = PADDING.left + (plotWidth * (x - xMin)) / timeSpan;
      const yPosition = PADDING.top + (plotHeight * (high - y)) / (high - low);
      if (!started) {
        context.moveTo(xPosition, yPosition);
        started = true;
      } else {
        context.lineTo(xPosition, yPosition);
      }
    }
    context.stroke();
  }

  context.setLineDash([]);
  context.fillStyle = AXIS_COLOR;
  context.fillText("0", PADDING.left, height - 8);
  context.fillText(`${xMax.toFixed(1)} с`, width - 48, height - 8);
  context.fillText(label, PADDING.left + 4, 12);
}
