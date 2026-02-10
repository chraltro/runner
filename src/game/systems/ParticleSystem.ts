import { MAX_PARTICLES, PARTICLE_LIFETIME } from '../utils/constants';

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
}

export class ParticleSystem {
  private particles: Particle[] = [];

  constructor() {
    // Pre-allocate particle pool
    for (let i = 0; i < MAX_PARTICLES; i++) {
      this.particles.push({
        x: 0, y: 0, vx: 0, vy: 0,
        life: 0, maxLife: 0, color: '', size: 0, active: false,
      });
    }
  }

  private getInactive(): Particle | null {
    for (const p of this.particles) {
      if (!p.active) return p;
    }
    return null;
  }

  emit(x: number, y: number, count: number, color: string, spread: number = 3, size: number = 3) {
    for (let i = 0; i < count; i++) {
      const p = this.getInactive();
      if (!p) break;

      const angle = Math.random() * Math.PI * 2;
      const speed = Math.random() * spread;

      p.x = x;
      p.y = y;
      p.vx = Math.cos(angle) * speed;
      p.vy = Math.sin(angle) * speed;
      p.life = PARTICLE_LIFETIME * (0.5 + Math.random() * 0.5);
      p.maxLife = p.life;
      p.color = color;
      p.size = size * (0.5 + Math.random() * 0.5);
      p.active = true;
    }
  }

  burstConfetti(x: number, y: number) {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD700', '#FF69B4'];
    for (const color of colors) {
      this.emit(x, y, 8, color, 5, 4);
    }
  }

  burstImpact(x: number, y: number) {
    this.emit(x, y, 20, '#FF5722', 4, 3);
    this.emit(x, y, 10, '#FFD700', 3, 2);
  }

  burstGate(x: number, y: number, good: boolean) {
    const color = good ? '#4CAF50' : '#F44336';
    this.emit(x, y, 15, color, 3, 3);
    this.emit(x, y, 10, '#FFFFFF', 2, 2);
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
      p.vy += 0.05; // gravity
      p.vx *= 0.98; // drag
    }
  }

  render(ctx: CanvasRenderingContext2D, cameraY: number, scale: number) {
    for (const p of this.particles) {
      if (!p.active) continue;

      const screenX = ctx.canvas.width / 2 + p.x * scale;
      const screenY = (p.y - cameraY) * scale;

      if (screenY < -50 || screenY > ctx.canvas.height + 50) continue;

      const alpha = p.life / p.maxLife;
      ctx.globalAlpha = alpha;
      ctx.fillStyle = p.color;
      ctx.fillRect(
        screenX - (p.size * scale) / 2,
        screenY - (p.size * scale) / 2,
        p.size * scale,
        p.size * scale
      );
    }
    ctx.globalAlpha = 1;
  }

  clear() {
    for (const p of this.particles) {
      p.active = false;
    }
  }
}
