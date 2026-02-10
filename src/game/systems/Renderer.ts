import { COLORS, TRACK_WIDTH, DESIGN_WIDTH } from '../utils/constants';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  scale = 1;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
  }

  resize() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.width = window.innerWidth;
    this.height = window.innerHeight;
    this.canvas.width = this.width * dpr;
    this.canvas.height = this.height * dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    this.scale = this.width / DESIGN_WIDTH;
  }

  clear() {
    this.ctx.fillStyle = COLORS.background;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  renderTrack(cameraY: number) {
    const ctx = this.ctx;
    const scale = this.scale;
    const centerX = this.width / 2;
    const trackW = TRACK_WIDTH * scale;

    // Track background
    ctx.fillStyle = COLORS.track;
    ctx.fillRect(centerX - trackW / 2, 0, trackW, this.height);

    // Track edges
    ctx.strokeStyle = COLORS.trackEdge;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.moveTo(centerX - trackW / 2, 0);
    ctx.lineTo(centerX - trackW / 2, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(centerX + trackW / 2, 0);
    ctx.lineTo(centerX + trackW / 2, this.height);
    ctx.stroke();

    // Lane dividers (dashed)
    ctx.strokeStyle = COLORS.trackLine;
    ctx.lineWidth = 1 * scale;
    ctx.setLineDash([15 * scale, 15 * scale]);
    const laneW = trackW / 3;

    const dashOffset = (cameraY * scale) % (30 * scale);
    ctx.lineDashOffset = -dashOffset;

    for (let i = 1; i < 3; i++) {
      const lx = centerX - trackW / 2 + laneW * i;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Side grass
    const grassGradLeft = ctx.createLinearGradient(0, 0, centerX - trackW / 2, 0);
    grassGradLeft.addColorStop(0, COLORS.grass);
    grassGradLeft.addColorStop(1, '#1a3a0e');
    ctx.fillStyle = grassGradLeft;
    ctx.fillRect(0, 0, centerX - trackW / 2, this.height);

    const grassGradRight = ctx.createLinearGradient(centerX + trackW / 2, 0, this.width, 0);
    grassGradRight.addColorStop(0, '#1a3a0e');
    grassGradRight.addColorStop(1, COLORS.grass);
    ctx.fillStyle = grassGradRight;
    ctx.fillRect(centerX + trackW / 2, 0, this.width - (centerX + trackW / 2), this.height);
  }

  renderFinishLine(finishY: number, cameraY: number) {
    const ctx = this.ctx;
    const scale = this.scale;
    const screenY = (finishY - cameraY) * scale;

    if (screenY < -20 || screenY > this.height + 20) return;

    const centerX = this.width / 2;
    const trackW = TRACK_WIDTH * scale;
    const lineH = 6 * scale;

    // Checkerboard pattern
    const squareSize = 10 * scale;
    const numSquares = Math.ceil(trackW / squareSize);

    for (let i = 0; i < numSquares; i++) {
      for (let j = 0; j < 2; j++) {
        const isWhite = (i + j) % 2 === 0;
        ctx.fillStyle = isWhite ? COLORS.white : COLORS.black;
        ctx.fillRect(
          centerX - trackW / 2 + i * squareSize,
          screenY - lineH + j * (lineH / 2),
          squareSize,
          lineH / 2
        );
      }
    }
  }
}
