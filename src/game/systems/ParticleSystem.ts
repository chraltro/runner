import { MAX_PARTICLES, PARTICLE_LIFETIME, COLORS } from '../utils/constants';
import { Renderer } from './Renderer';

type ParticleShape = 'circle' | 'square' | 'star';

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  life: number;
  maxLife: number;
  color: string;
  size: number;
  active: boolean;
  shape: ParticleShape;
  rotation: number;
  rotationSpeed: number;
  gravity: number;
}

export class ParticleSystem {
  private particles: Particle[] = [];
  private nextFree = 0;

  constructor() {
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, color: '', size: 0, active: false,
        shape: 'circle', rotation: 0, rotationSpeed: 0, gravity: 0.05,
      });
    }
  }

  private getInactive(): Particle | null {
    // Start from nextFree hint for O(1) best case
    for (let i = 0; i < this.particles.length; i++) {
      const idx = (this.nextFree + i) % this.particles.length;
      if (!this.particles[idx].active) {
        this.nextFree = (idx + 1) % this.particles.length;
        return this.particles[idx];
      }
    }
    return null;
  }

  emit(
    x: number, y: number, count: number, color: string,
    spread = 3, size = 3, shape: ParticleShape = 'circle', gravity = 0.05
  ) {
    for (let i = 0; i < count; i++) {
      const p = this.getInactive();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * spread;

      p.x = x + (Math.random() - 0.5) * 5;
      p.y = y + (Math.random() - 0.5) * 5;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);
      p.maxLife = p.life;
      p.color = color;
      p.size = size * (0.6 + Math.random() * 0.8);
      p.active = true;
      p.shape = shape;
      p.rotation = Math.random() * Math.PI * 2;
      p.rotationSpeed = (Math.random() - 0.5) * 0.15;
      p.gravity = gravity;
    }
  }

  burstConfetti(x: number, y: number) {
    const colors = COLORS.confetti;
    for (let i = 0; i < 40; i++) {
      const color = colors[i % colors.length];
      const shape: ParticleShape = i % 3 === 0 ? 'star' : i % 2 === 0 ? 'square' : 'circle';
      this.emit(x, y, 1, color, 6, 4 + Math.random() * 3, shape, 0.04);
    }
  }

  burstImpact(x: number, y: number) {
    this.emit(x, y, 15, COLORS.sparkOrange, 5, 3, 'circle', 0.06);
    this.emit(x, y, 10, COLORS.sparkYellow, 4, 2, 'star', 0.04);
    this.emit(x, y, 5, COLORS.sparkWhite, 3, 4, 'circle', 0.03);
  }

  burstGate(x: number, y: number, good: boolean) {
    const mainColor = good ? COLORS.sparkGreen : COLORS.sparkRed;
    this.emit(x, y, 20, mainColor, 4, 3, 'circle', 0.03);
    this.emit(x, y, 10, COLORS.sparkWhite, 3, 2, 'star', 0.02);
    // Upward fountain
    for (let i = 0; i < 8; i++) {
      const p = this.getInactive();
      if (!p) break;
      p.x = x + (Math.random() - 0.5) * 20;
      p.y = y;
      p.vx = (Math.random() - 0.5) * 2;
      p.vy = -(2 + Math.random() * 3);
      p.life = 800 + Math.random() * 400;
      p.maxLife = p.life;
      p.color = mainColor;
      p.size = 3 + Math.random() * 2;
      p.active = true;
      p.shape = 'circle';
      p.rotation = 0;
      p.rotationSpeed = 0;
      p.gravity = 0.08;
    }
  }

  burstDamage(x: number, y: number) {
    this.emit(x, y, 8, COLORS.sparkRed, 3, 2, 'circle', 0.06);
  }

  update(dt: number) {
    for (const p of this.particles) {
      if (!p.active) continue;

      p.life -= dt;
      if (p.life <= 0) {
        p.active = false;
        continue;
      }

      p.x += p.vx;
      p.y += p.vy;
      p.vy += p.gravity;
      p.vx *= 0.98;
      p.rotation += p.rotationSpeed;
    }
  }

  render(renderer: Renderer, cameraY: number) {
    const ctx = renderer.ctx;
    const scale = renderer.scale;

    for (const p of this.particles) {
      if (!p.active) continue;

      const screenX = renderer.worldToScreenX(p.x);
      const screenY = renderer.worldToScreenY(p.y, cameraY);

      if (screenY < -50 || screenY > renderer.height + 50) continue;
      if (screenX < -50 || screenX > renderer.width + 50) continue;

      const alpha = Math.min(1, p.life / p.maxLife * 1.5);
      const s = p.size * scale * (0.5 + alpha * 0.5);

      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;

      switch (p.shape) {
        case 'circle':
          ctx.beginPath();
          ctx.arc(screenX, screenY, s / 2, 0, Math.PI * 2);
          ctx.fill();
          break;

        case 'square':
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(p.rotation);
          ctx.fillRect(-s / 2, -s / 2, s, s);
          ctx.restore();
          break;

        case 'star':
          ctx.save();
          ctx.translate(screenX, screenY);
          ctx.rotate(p.rotation);
          this.drawStar(ctx, 0, 0, 4, s / 2, s / 4);
          ctx.restore();
          break;
      }
    }
    ctx.globalAlpha = 1;
  }

  private drawStar(ctx: CanvasRenderingContext2D, cx: number, cy: number, spikes: number, outerR: number, innerR: number) {
    let rot = -Math.PI / 2;
    const step = Math.PI / spikes;
    ctx.beginPath();
    for (let i = 0; i < spikes * 2; i++) {
      const r = i % 2 === 0 ? outerR : innerR;
      ctx.lineTo(cx + Math.cos(rot) * r, cy + Math.sin(rot) * r);
      rot += step;
    }
    ctx.closePath();
    ctx.fill();
  }

  clear() {
    for (const p of this.particles) {
      p.active = false;
    }
    this.nextFree = 0;
  }
}
