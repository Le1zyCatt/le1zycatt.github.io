type VisualMode = "flow" | "topology" | "tensor" | "packet";
type CanvasState = {
  context: CanvasRenderingContext2D;
  width: number;
  height: number;
  pixelWidth: number;
  pixelHeight: number;
};

const cyan = "rgba(100,232,255,";
const violet = "rgba(118,108,255,";
const canvasStates = new WeakMap<HTMLCanvasElement, CanvasState>();

function setupCanvas(canvas: HTMLCanvasElement) {
  const dpr = Math.min(window.devicePixelRatio, 1.5);
  const rect = canvas.getBoundingClientRect();
  const pixelWidth = Math.max(1, Math.floor(rect.width * dpr));
  const pixelHeight = Math.max(1, Math.floor(rect.height * dpr));
  const cached = canvasStates.get(canvas);
  if (cached && cached.pixelWidth === pixelWidth && cached.pixelHeight === pixelHeight) return cached;
  const context = cached?.context || canvas.getContext("2d", { alpha: true });
  if (!context) return null;
  canvas.width = pixelWidth;
  canvas.height = pixelHeight;
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  const state = { context, width: rect.width, height: rect.height, pixelWidth, pixelHeight };
  canvasStates.set(canvas, state);
  return state;
}

function drawFlow(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  for (let row = 0; row < 7; row += 1) {
    const y = ((row + 1) / 8) * height;
    context.beginPath();
    for (let x = 0; x <= width; x += 8) {
      const wave = Math.sin(x * 0.018 + time * 0.00045 + row) * (7 + row * 1.2);
      if (x === 0) context.moveTo(x, y + wave);
      else context.lineTo(x, y + wave);
    }
    context.strokeStyle = `${cyan}${0.08 + row * 0.014})`;
    context.lineWidth = 0.75;
    context.stroke();

    const pulseX = ((time * (0.035 + row * 0.002) + row * 73) % (width + 30)) - 15;
    const pulseY = y + Math.sin(pulseX * 0.018 + time * 0.00045 + row) * (7 + row * 1.2);
    context.fillStyle = `${cyan}0.8)`;
    context.fillRect(pulseX, pulseY, 2, 2);
  }
}

function drawTopology(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const nodes = [
    [0.16, 0.28], [0.46, 0.15], [0.76, 0.3], [0.28, 0.67], [0.6, 0.58], [0.84, 0.78]
  ];
  const edges = [[0, 1], [1, 2], [0, 3], [1, 4], [2, 4], [3, 4], [4, 5]];
  edges.forEach((edge, index) => {
    const a = nodes[edge[0]];
    const b = nodes[edge[1]];
    context.beginPath();
    context.moveTo(a[0] * width, a[1] * height);
    context.lineTo(b[0] * width, b[1] * height);
    context.strokeStyle = `${cyan}${index === Math.floor(time / 900) % edges.length ? 0.38 : 0.11})`;
    context.lineWidth = 0.75;
    context.stroke();
  });
  nodes.forEach((node, index) => {
    const pulse = 2.4 + Math.sin(time * 0.002 + index) * 0.8;
    context.beginPath();
    context.arc(node[0] * width, node[1] * height, pulse, 0, Math.PI * 2);
    context.fillStyle = index === 4 ? `${violet}0.7)` : `${cyan}0.68)`;
    context.fill();
  });
}

function drawTensor(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const columns = 12;
  const rows = 8;
  const cellWidth = width / (columns + 2);
  const cellHeight = height / (rows + 2);
  for (let y = 0; y < rows; y += 1) {
    for (let x = 0; x < columns; x += 1) {
      const wave = (Math.sin(time * 0.0012 + x * 0.65 + y * 0.8) + 1) / 2;
      const px = cellWidth * (x + 1.5) + Math.sin(y + time * 0.0002) * 2;
      const py = cellHeight * (y + 1.5);
      context.fillStyle = x % 7 === 0 ? `${violet}${0.05 + wave * 0.18})` : `${cyan}${0.035 + wave * 0.22})`;
      context.fillRect(px, py, Math.max(1, cellWidth - 4), Math.max(1, cellHeight - 4));
    }
  }
}

function drawPacket(context: CanvasRenderingContext2D, width: number, height: number, time: number) {
  const tracks = 6;
  for (let row = 0; row < tracks; row += 1) {
    const y = ((row + 1) / (tracks + 1)) * height;
    context.beginPath();
    context.moveTo(width * 0.08, y);
    context.lineTo(width * 0.92, y);
    context.strokeStyle = `${cyan}0.11)`;
    context.stroke();
    for (let packet = 0; packet < 3; packet += 1) {
      const position = (time * (0.00007 + row * 0.000006) + packet / 3 + row * 0.11) % 1;
      const x = width * (0.08 + position * 0.84);
      context.fillStyle = packet === 2 && row % 2 ? `${violet}0.55)` : `${cyan}0.62)`;
      context.fillRect(x, y - 1.5, 10 + row * 2, 3);
    }
  }
}

export function initModuleVisuals(reducedMotion: boolean) {
  const canvases = Array.from(document.querySelectorAll<HTMLCanvasElement>("[data-module-visual]"));
  const visible = new WeakSet<HTMLCanvasElement>();
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) visible.add(entry.target as HTMLCanvasElement);
      else visible.delete(entry.target as HTMLCanvasElement);
    });
  }, { rootMargin: "120px" });
  canvases.forEach((canvas) => {
    observer.observe(canvas);
    if (reducedMotion) visible.add(canvas);
  });

  let raf = 0;
  const draw = (time: number) => {
    canvases.forEach((canvas) => {
      if (!visible.has(canvas)) return;
      const setup = setupCanvas(canvas);
      if (!setup) return;
      const { context, width, height } = setup;
      context.clearRect(0, 0, width, height);
      const mode = canvas.dataset.moduleVisual as VisualMode;
      const visualTime = reducedMotion ? 1000 : time;
      if (mode === "flow") drawFlow(context, width, height, visualTime);
      else if (mode === "topology") drawTopology(context, width, height, visualTime);
      else if (mode === "tensor") drawTensor(context, width, height, visualTime);
      else drawPacket(context, width, height, visualTime);
    });
    if (!reducedMotion) raf = window.requestAnimationFrame(draw);
  };
  draw(0);

  return () => {
    window.cancelAnimationFrame(raf);
    observer.disconnect();
  };
}
