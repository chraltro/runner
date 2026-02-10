import { UNIT_RADIUS, CROWD_SPREAD_FACTOR, MAX_RENDER_UNITS, COLORS, TRACK_WIDTH, CROWD_SMOOTHING } from '../utils/constants';
import { clamp, randomRange } from '../utils/helpers';
import { Renderer } from '../systems/Renderer';

interface Unit {
  offsetX: number;
  offsetY: number;
  jigglePhase: number;
  jiggleSpeed: number;
  size: number; // individual size variation
}

export class Crowd {
  x: number;
  y: number;
  count: number;
  units: Unit[] = [];
  isPlayer: boolean;
  color: string;
  colorLight: string;
  colorDark: string;
  glowColor: string;
  private targetX: number;
  animatingSpawn = false;
  private spawnTimer = 0;
  private spawnScale = 1;
  private hitFlashTimer = 0;

  constructor(x: number, y: number, count: number, isPlayer: boolean) {
    this.x = x;
    this.y = y;
    this.targetX = x;
    this.count = count;
    this.isPlayer = isPlayer;
    this.color = isPlayer ? COLORS.crowdPlayer : COLORS.crowdEnemy;
    this.colorLight = isPlayer ? COLORS.crowdPlayerLight : COLORS.crowdEnemyLight;
    this.colorDark = isPlayer ? COLORS.crowdPlayerDark : COLORS.crowdEnemyDark;
    this.glowColor = isPlayer ? COLORS.crowdPlayerGlow : COLORS.crowdEnemyGlow;
    this.regenerateUnits();
  }

  private regenerateUnits() {
    const renderCount = Math.min(this.count, MAX_RENDER_UNITS);
    // Reuse existing units where possible
    while (this.units.length > renderCount) this.units.pop();
    const spread = this.getSpread();
    for (let i = this.units.length; i < renderCount; i++) {
      const angle = (i * 2.399963) + i * 0.1; // golden angle spiral
      const r = Math.sqrt(i / Math.max(renderCount, 1)) * spread;
      this.units.push({
        offsetX: Math.cos(angle) * r,
        offsetY: Math.sin(angle) * r,
        jigglePhase: randomRange(0, Math.PI * 2),
        jiggleSpeed: randomRange(3, 6),
        size: randomRange(0.8, 1.2),
      });
    }
    // Update positions for existing units
    for (let i = 0; i < Math.min(this.units.length, renderCount); i++) {
      const angle = (i * 2.399963) + i * 0.1;
      const r = Math.sqrt(i / Math.max(renderCount, 1)) * spread;
      this.units[i].offsetX = Math.cos(angle) * r;
      this.units[i].offsetY = Math.sin(angle) * r;
    }
  }

  getSpread(): number {
    return CROWD_SPREAD_FACTOR * Math.sqrt(Math.min(this.count, MAX_RENDER_UNITS));
  }

  setTargetX(x: number) {
    const halfTrack = TRACK_WIDTH / 2;
    const margin = this.getSpread() + 5;
    this.targetX = clamp(x, -halfTrack + margin, halfTrack - margin);
  }

  addUnits(amount: number) {
    this.count = Math.max(0, this.count + amount);
    this.regenerateUnits();
    this.animatingSpawn = true;
    this.spawnTimer = 400;
    this.spawnScale = 1.3;
  }

  multiplyUnits(factor: number) {
    this.count = Math.max(0, Math.floor(this.count * factor));
    this.regenerateUnits();
    this.animatingSpawn = true;
    this.spawnTimer = 400;
    this.spawnScale = 1.4;
  }

  removeUnits(amount: number) {
    this.count = Math.max(0, this.count - amount);
    this.regenerateUnits();
    this.hitFlashTimer = 150;
  }

  divideUnits(divisor: number) {
    this.count = Math.max(1, Math.floor(this.count / divisor));
    this.regenerateUnits();
    this.hitFlashTimer = 150;
  }

  update(dt: number) {
    // Smooth lateral movement
    this.x += (this.targetX - this.x) * CROWD_SMOOTHING;

    // Update jiggle
    for (const unit of this.units) {
      unit.jigglePhase += unit.jiggleSpeed * dt * 0.001;
    }

    if (this.spawnTimer > 0) {
      this.spawnTimer -= dt;
      this.spawnScale = 1 + (this.spawnScale - 1) * 0.92;
      if (this.spawnTimer <= 0) {
        this.animatingSpawn = false;
        this.spawnScale = 1;
      }
    }

    if (this.hitFlashTimer > 0) {
      this.hitFlashTimer -= dt;
    }
  }

  render(renderer: Renderer, cameraY: number) {
    const ctx = renderer.ctx;
    const scale = renderer.scale;
    const screenX = renderer.worldToScreenX(this.x);
    const screenY = renderer.worldToScreenY(this.y, cameraY);

    if (screenY < -150 || screenY > renderer.height + 150) return;

    const unitR = UNIT_RADIUS * scale;
    const renderCount = this.units.length;
    const isHit = this.hitFlashTimer > 0;

    // Crowd shadow (ellipse under the crowd)
    const spread = this.getSpread() * scale;
    ctx.fillStyle = 'rgba(0,0,0,0.18)';
    ctx.beginPath();
    ctx.ellipse(screenX, screenY + 3 * scale, spread * 0.9, spread * 0.45, 0, 0, Math.PI * 2);
    ctx.fill();

    // Glow under crowd
    if (this.isPlayer) {
      ctx.fillStyle = this.glowColor;
      ctx.beginPath();
      ctx.ellipse(screenX, screenY, spread * 1.1, spread * 0.6, 0, 0, Math.PI * 2);
      ctx.fill();
    }

    // Draw units back-to-front (higher offsetY drawn first)
    for (let i = renderCount - 1; i >= 0; i--) {
      const unit = this.units[i];
      const jigX = Math.sin(unit.jigglePhase) * 2;
      const jigY = Math.cos(unit.jigglePhase * 0.7) * 1.5;
      const s = this.animatingSpawn ? this.spawnScale : 1;
      const ux = screenX + (unit.offsetX + jigX) * scale * s;
      const uy = screenY + (unit.offsetY + jigY) * scale * s;
      const r = unitR * unit.size;

      // Drop shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.arc(ux + scale, uy + scale * 1.5, r * 0.9, 0, Math.PI * 2);
      ctx.fill();

      // Body gradient
      if (isHit) {
        ctx.fillStyle = COLORS.white;
      } else if (this.animatingSpawn && this.spawnTimer > 200) {
        ctx.fillStyle = this.colorLight;
      } else {
        ctx.fillStyle = this.color;
      }
      ctx.beginPath();
      ctx.arc(ux, uy, r, 0, Math.PI * 2);
      ctx.fill();

      // Highlight dot (top-left of each unit)
      ctx.fillStyle = this.colorLight;
      ctx.globalAlpha = 0.6;
      ctx.beginPath();
      ctx.arc(ux - r * 0.25, uy - r * 0.25, r * 0.35, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    // Count label with pill background
    const labelText = this.count.toString();
    const fontSize = Math.round(Math.max(14, 18 * scale));
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const textWidth = ctx.measureText(labelText).width;
    const pillW = textWidth + 16 * scale;
    const pillH = fontSize + 8 * scale;
    const labelY = screenY - spread - 12 * scale;

    // Pill background
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.beginPath();
    ctx.roundRect(screenX - pillW / 2, labelY - pillH / 2, pillW, pillH, pillH / 2);
    ctx.fill();

    // Border
    ctx.strokeStyle = this.color;
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.roundRect(screenX - pillW / 2, labelY - pillH / 2, pillW, pillH, pillH / 2);
    ctx.stroke();

    // Text
    ctx.fillStyle = COLORS.white;
    ctx.fillText(labelText, screenX, labelY);
  }
}
