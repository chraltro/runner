import { COLORS, TRACK_WIDTH, DESIGN_WIDTH } from '../utils/constants';

export class Renderer {
  canvas: HTMLCanvasElement;
  ctx: CanvasRenderingContext2D;
  width = 0;
  height = 0;
  scale = 1;
  private time = 0;
  shakeX = 0;
  shakeY = 0;

  // Cached gradients
  private skyGrad: CanvasGradient | null = null;
  private grassGradL: CanvasGradient | null = null;
  private grassGradR: CanvasGradient | null = null;
  private trackGrad: CanvasGradient | null = null;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d', { alpha: false })!;
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
    this.rebuildGradients();
  }

  private rebuildGradients() {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;
    const centerX = w / 2;
    const trackW = TRACK_WIDTH * this.scale;

    this.skyGrad = ctx.createLinearGradient(0, 0, 0, h);
    this.skyGrad.addColorStop(0, COLORS.skyTop);
    this.skyGrad.addColorStop(0.6, COLORS.skyBottom);
    this.skyGrad.addColorStop(1, COLORS.grassNear);

    this.trackGrad = ctx.createLinearGradient(centerX - trackW / 2, 0, centerX + trackW / 2, 0);
    this.trackGrad.addColorStop(0, COLORS.trackShadow);
    this.trackGrad.addColorStop(0.05, COLORS.trackBase);
    this.trackGrad.addColorStop(0.5, COLORS.trackHighlight);
    this.trackGrad.addColorStop(0.95, COLORS.trackBase);
    this.trackGrad.addColorStop(1, COLORS.trackShadow);

    this.grassGradL = ctx.createLinearGradient(0, 0, centerX - trackW / 2, 0);
    this.grassGradL.addColorStop(0, COLORS.grassFar);
    this.grassGradL.addColorStop(1, COLORS.grassNear);

    this.grassGradR = ctx.createLinearGradient(centerX + trackW / 2, 0, w, 0);
    this.grassGradR.addColorStop(0, COLORS.grassNear);
    this.grassGradR.addColorStop(1, COLORS.grassFar);
  }

  updateTime(dt: number) {
    this.time += dt;
  }

  clear() {
    this.ctx.fillStyle = this.skyGrad!;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  worldToScreenX(worldX: number): number {
    return this.width / 2 + worldX * this.scale + this.shakeX;
  }

  worldToScreenY(worldY: number, cameraY: number): number {
    return (worldY - cameraY) * this.scale + this.shakeY;
  }

  renderTrack(cameraY: number) {
    const ctx = this.ctx;
    const scale = this.scale;
    const centerX = this.width / 2 + this.shakeX;
    const trackW = TRACK_WIDTH * scale;
    const trackL = centerX - trackW / 2;
    const trackR = centerX + trackW / 2;

    // Grass sides
    ctx.fillStyle = this.grassGradL!;
    ctx.fillRect(0, 0, trackL, this.height);
    ctx.fillStyle = this.grassGradR!;
    ctx.fillRect(trackR, 0, this.width - trackR, this.height);

    // Animated grass stripes
    const stripeH = 30 * scale;
    const stripeOffset = ((cameraY * scale) % (stripeH * 2) + stripeH * 2) % (stripeH * 2);
    ctx.fillStyle = COLORS.grassStripe;
    ctx.globalAlpha = 0.15;
    for (let y = -stripeH + stripeOffset; y < this.height + stripeH; y += stripeH * 2) {
      ctx.fillRect(0, y, trackL, stripeH);
      ctx.fillRect(trackR, y, this.width - trackR, stripeH);
    }
    ctx.globalAlpha = 1;

    // Track surface
    ctx.fillStyle = this.trackGrad!;
    ctx.fillRect(trackL, 0, trackW, this.height);

    // Track edge glow lines
    ctx.strokeStyle = COLORS.trackEdge;
    ctx.lineWidth = 3 * scale;
    ctx.shadowColor = COLORS.trackEdge;
    ctx.shadowBlur = 6 * scale;
    ctx.beginPath();
    ctx.moveTo(trackL, 0);
    ctx.lineTo(trackL, this.height);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(trackR, 0);
    ctx.lineTo(trackR, this.height);
    ctx.stroke();
    ctx.shadowBlur = 0;

    // Lane dividers (dashed, subtle)
    ctx.strokeStyle = COLORS.trackLine;
    ctx.lineWidth = 1.5 * scale;
    ctx.setLineDash([20 * scale, 20 * scale]);
    const dashOffset = ((cameraY * scale) % (40 * scale) + 40 * scale) % (40 * scale);
    ctx.lineDashOffset = -dashOffset;
    const laneW = trackW / 3;
    for (let i = 1; i < 3; i++) {
      const lx = trackL + laneW * i;
      ctx.beginPath();
      ctx.moveTo(lx, 0);
      ctx.lineTo(lx, this.height);
      ctx.stroke();
    }
    ctx.setLineDash([]);
    ctx.lineDashOffset = 0;

    // Center line pulse (subtle)
    const pulse = 0.05 + Math.sin(this.time * 0.002) * 0.03;
    ctx.strokeStyle = `rgba(255,255,255,${pulse})`;
    ctx.lineWidth = 2 * scale;
    ctx.beginPath();
    ctx.moveTo(centerX, 0);
    ctx.lineTo(centerX, this.height);
    ctx.stroke();
  }

  renderFinishLine(finishY: number, cameraY: number) {
    const ctx = this.ctx;
    const scale = this.scale;
    const screenY = this.worldToScreenY(finishY, cameraY);

    if (screenY < -30 || screenY > this.height + 30) return;

    const centerX = this.width / 2 + this.shakeX;
    const trackW = TRACK_WIDTH * scale;
    const squareSize = 12 * scale;
    const rows = 3;
    const numSquares = Math.ceil(trackW / squareSize);

    for (let i = 0; i < numSquares; i++) {
      for (let j = 0; j < rows; j++) {
        const isWhite = (i + j) % 2 === 0;
        ctx.fillStyle = isWhite ? COLORS.white : COLORS.black;
        ctx.fillRect(
          centerX - trackW / 2 + i * squareSize,
          screenY - (rows * squareSize) / 2 + j * squareSize,
          squareSize,
          squareSize
        );
      }
    }

    // Glow
    ctx.shadowColor = COLORS.white;
    ctx.shadowBlur = 10 * scale;
    ctx.strokeStyle = 'rgba(255,255,255,0.6)';
    ctx.lineWidth = 2 * scale;
    ctx.strokeRect(
      centerX - trackW / 2,
      screenY - (rows * squareSize) / 2,
      trackW,
      rows * squareSize
    );
    ctx.shadowBlur = 0;
  }

  renderProgressBar(crowdY: number, enemyY: number) {
    const ctx = this.ctx;
    const scale = this.scale;
    const barW = this.width * 0.6;
    const barH = 4 * scale;
    const barX = (this.width - barW) / 2;
    const barY = 52 * scale;

    const progress = Math.min(1, Math.max(0, crowdY / enemyY));

    ctx.fillStyle = 'rgba(255,255,255,0.1)';
    ctx.beginPath();
    ctx.roundRect(barX, barY, barW, barH, barH / 2);
    ctx.fill();

    if (progress > 0) {
      const grad = ctx.createLinearGradient(barX, 0, barX + barW * progress, 0);
      grad.addColorStop(0, COLORS.crowdPlayer);
      grad.addColorStop(1, COLORS.crowdPlayerLight);
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.roundRect(barX, barY, barW * progress, barH, barH / 2);
      ctx.fill();
    }

    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(barX + barW * progress, barY + barH / 2, 4 * scale, 0, Math.PI * 2);
    ctx.fill();
  }
}
