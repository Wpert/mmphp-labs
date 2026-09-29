const GRID_COLOR = "#dbe3ee";
const AXIS_COLOR = "#59677d";
const PADDING = { left: 42, right: 12, top: 16, bottom: 28 };
const GRID_LINES = 5;

export function drawChart(
  canvas: HTMLCanvasElement,
  x: number[],
  y: number[],
  color: string,
  label: string,
): void {
  const context = canvas.getContext("2d");
  if (!context || x.length === 0 || y.length === 0) return;

  const ratio = devicePixelRatio || 1;
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  canvas.width = width * ratio;
  canvas.height = height * ratio;
  context.setTransform(ratio, 0, 0, ratio, 0, 0);
  context.clearRect(0, 0, width, height);

  const plotWidth = width - PADDING.left - PADDING.right;
  const plotHeight = height - PADDING.top - PADDING.bottom;
  const min = Math.min(...y);
  const max = Math.max(...y);
  const low = min === max ? min - 1 : min;
  const high = min === max ? max + 1 : max;
  const lastIndex = Math.max(x.length - 1, 1);

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

  context.strokeStyle = color;
  context.lineWidth = 2;
  context.beginPath();
  y.forEach((value, index) => {
    const xPosition = PADDING.left + (plotWidth * index) / lastIndex;
    const yPosition = PADDING.top + (plotHeight * (high - value)) / (high - low);
    if (index === 0) context.moveTo(xPosition, yPosition);
    else context.lineTo(xPosition, yPosition);
  });
  context.stroke();

  context.fillStyle = AXIS_COLOR;
  context.fillText("0", PADDING.left, height - 8);
  context.fillText(`${x[x.length - 1].toFixed(1)} с`, width - 45, height - 8);
  context.fillText(label, PADDING.left + 4, 12);
}
