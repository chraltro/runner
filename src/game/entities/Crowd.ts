import { UNIT_RADIUS, CROWD_SPREAD, MAX_RENDER_UNITS, COLORS, TRACK_WIDTH } from '../utils/constants';
import { clamp, randomRange } from '../utils/helpers';

interface Unit {
  offsetX: number;
  offsetY: number;
  jigglePhase: number;
  jiggleSpeed: number;
}

export class Crowd {
  x: number;
  y: number;
  count: number;
  units: Unit[] = [];
  isPlayer: boolean;
  color: string;
  colorDark: string;
  private targetX: number;
  animatingSpawn = false;
  private spawnTimer = 0;

  constructor(x: number, y: number, count: number, isPlayer: boolean) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.count = count;
    this.isPlayer = isPlayer;
    this.color = isPlayer ? COLORS.crowdPlayer : COLORS.crowdEnemy;
    this.colorDark = isPlayer ? COLORS.crowdPlayerDark : COLORS.crowdEnemyDark;
    this.generateUnits(count);
  }

  private generateUnits(count: number) {
    this.units = [];
    const renderCount = Math.min(count, MAX_RENDER_UNITS);
    for (let i = 0; i < renderCount; i++) {
      const angle = (i / renderCount) * Math.PI * 2 + i * 0.618 * Math.PI * 2;
      const r = Math.sqrt(i / renderCount) * this.getSpread();
      this.units.push({
        offsetX: Math.cos(angle) * r,
        offsetY: Math.sin(angle) * r,
        jigglePhase: randomRange(0, Math.PI * 2),
        jiggleSpeed: randomRange(2, 5),
      });
    }
  }

  private getSpread(): number {
    return CROWD_SPREAD * Math.sqrt(Math.min(this.count, MAX_RENDER_UNITS) / 30);
  }

  setTargetX(x: number) {
    const halfTrack = TRACK_WIDTH / 2;
    this.targetX = clamp(x, -halfTrack + 20, halfTrack - 20);
  }

  addUnits(amount: number) {
    this.count = Math.max(0, this.count + amount);
    this.generateUnits(this.count);
    this.animatingSpawn = true;
    this.spawnTimer = 300;
  }

  multiplyUnits(factor: number) {
    this.count = Math.max(0, Math.floor(this.count * factor));
    this.generateUnits(this.count);
    this.animatingSpawn = true;
    this.spawnTimer = 300;
  }

  removeUnits(amount: number) {
    this.count = Math.max(0, this.count - amount);
    this.generateUnits(this.count);
  }

  divideUnits(divisor: number) {
    this.count = Math.max(1, Math.floor(this.count / divisor));
    this.generateUnits(this.count);
  }

  update(dt: number) {
    // Smooth lateral movement
    this.x += (this.targetX - this.x) * 0.15;

    // Update jiggle
    for (const unit of this.units) {
      unit.jigglePhase += unit.jiggleSpeed * dt * 0.001;
    }

    if (this.spawnTimer > 0) {
      this.spawnTimer -= dt;
      if (this.spawnTimer <= 0) {
        this.animatingSpawn = false;
      }
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraY: number, scale: number) {
    const screenX = ctx.canvas.width / 2 + this.x * scale;
    const screenY = (this.y - cameraY) * scale;

    if (screenY < -100 || screenY > ctx.canvas.height + 100) return;

    const unitR = UNIT_RADIUS * scale;
    const renderCount = Math.min(this.units.length, MAX_RENDER_UNITS);

    // Draw units
    for (let i = 0; i < renderCount; i++) {
      const unit = this.units[i];
      const jigX = Math.sin(unit.jigglePhase) * 1.5;
      const jigY = Math.cos(unit.jigglePhase * 0.7) * 1.5;
      const ux = screenX + (unit.offsetX + jigX) * scale;
      const uy = screenY + (unit.offsetY + jigY) * scale;

      // Shadow
      ctx.fillStyle = this.colorDark;
      ctx.beginPath();
      ctx.arc(ux + 1, uy + 1, unitR, 0, Math.PI * 2);
      ctx.fill();

      // Body
      ctx.fillStyle = this.animatingSpawn ? COLORS.white : this.color;
      ctx.beginPath();
      ctx.arc(ux, uy, unitR, 0, Math.PI * 2);
      ctx.fill();
    }

    // Count label
    ctx.save();
    ctx.fillStyle = COLORS.white;
    ctx.strokeStyle = COLORS.black;
    ctx.lineWidth = 3;
    ctx.font = `bold ${Math.round(16 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    const labelY = screenY - this.getSpread() * scale - 10;
    ctx.strokeText(this.count.toString(), screenX, labelY);
    ctx.fillText(this.count.toString(), screenX, labelY);
    ctx.restore();
  }

  getBounds() {
    const spread = this.getSpread();
    return {
      left: this.x - spread,
      right: this.x + spread,
      top: this.y - spread,
      bottom: this.y + spread,
    };
  }
}
