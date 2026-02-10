import { COLORS, TRACK_WIDTH } from '../utils/constants';
import { Renderer } from '../systems/Renderer';

export type ObstacleType = 'blade' | 'wall' | 'pit';

export interface ObstacleData {
  type: ObstacleType;
  x: number;
  y: number;
  width: number;
  height: number;
  rotation: number;
  active: boolean;
}

export function createObstacle(
  y: number,
  _level: number,
  rng: () => number
): ObstacleData {
  const types: ObstacleType[] = ['blade', 'wall', 'pit'];
  const type = types[Math.floor(rng() * types.length)];
  const halfTrack = TRACK_WIDTH / 2 - 40;

  switch (type) {
    case 'blade':
      return {
        type,
        x: (rng() - 0.5) * halfTrack * 1.5,
        y,
        width: 35 + rng() * 20,
        height: 35 + rng() * 20,
        rotation: rng() * Math.PI * 2,
        active: true,
      };
    case 'wall':
      return {
        type,
        x: (rng() - 0.5) * halfTrack,
        y,
        width: 70 + rng() * 80,
        height: 18,
        rotation: 0,
        active: true,
      };
    case 'pit':
      return {
        type,
        x: (rng() - 0.5) * halfTrack,
        y,
        width: 50 + rng() * 40,
        height: 35 + rng() * 20,
        rotation: 0,
        active: true,
      };
  }
}

export function updateObstacle(obstacle: ObstacleData, dt: number) {
  if (obstacle.type === 'blade') {
    obstacle.rotation += dt * 0.006;
  }
}

export function renderObstacle(renderer: Renderer, obstacle: ObstacleData, cameraY: number) {
  if (!obstacle.active) return;

  const ctx = renderer.ctx;
  const scale = renderer.scale;
  const screenX = renderer.worldToScreenX(obstacle.x);
  const screenY = renderer.worldToScreenY(obstacle.y, cameraY);

  if (screenY < -120 || screenY > renderer.height + 120) return;

  const w = obstacle.width * scale;
  const h = obstacle.height * scale;

  ctx.save();
  ctx.translate(screenX, screenY);

  switch (obstacle.type) {
    case 'blade': {
      ctx.rotate(obstacle.rotation);

      // Glow
      ctx.shadowColor = COLORS.bladeGlow;
      ctx.shadowBlur = 12 * scale;

      // Blade arms
      const bladeCount = 4;
      for (let i = 0; i < bladeCount; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI * 2) / bladeCount);

        // Blade shape (tapered)
        const bw = w * 0.12;
        const bh = w * 0.48;
        ctx.fillStyle = COLORS.bladeEdge;
        ctx.beginPath();
        ctx.moveTo(-bw, 0);
        ctx.lineTo(-bw * 0.3, -bh);
        ctx.lineTo(bw * 0.3, -bh);
        ctx.lineTo(bw, 0);
        ctx.closePath();
        ctx.fill();

        // Blade highlight
        ctx.fillStyle = 'rgba(255,255,255,0.2)';
        ctx.beginPath();
        ctx.moveTo(-bw * 0.3, 0);
        ctx.lineTo(-bw * 0.1, -bh * 0.9);
        ctx.lineTo(bw * 0.1, -bh * 0.9);
        ctx.lineTo(bw * 0.3, 0);
        ctx.closePath();
        ctx.fill();

        ctx.restore();
      }

      ctx.shadowBlur = 0;

      // Center hub
      const hubR = w * 0.14;
      const hubGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, hubR);
      hubGrad.addColorStop(0, '#FF8A80');
      hubGrad.addColorStop(1, COLORS.bladeCore);
      ctx.fillStyle = hubGrad;
      ctx.beginPath();
      ctx.arc(0, 0, hubR, 0, Math.PI * 2);
      ctx.fill();

      // Hub bolt
      ctx.fillStyle = '#555';
      ctx.beginPath();
      ctx.arc(0, 0, hubR * 0.35, 0, Math.PI * 2);
      ctx.fill();
      break;
    }

    case 'wall': {
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.3)';
      ctx.fillRect(-w / 2 + 2, -h / 2 + 3, w, h);

      // Wall body
      const wallGrad = ctx.createLinearGradient(0, -h / 2, 0, h / 2);
      wallGrad.addColorStop(0, COLORS.wallTop);
      wallGrad.addColorStop(1, COLORS.wallBase);
      ctx.fillStyle = wallGrad;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 4 * scale);
      ctx.fill();

      // Warning stripe
      const stripeW = 8 * scale;
      ctx.fillStyle = COLORS.wallStripe;
      for (let sx = -w / 2; sx < w / 2; sx += stripeW * 2) {
        ctx.fillRect(sx, -h / 2, stripeW, h);
      }
      // Clip to rounded rect shape
      ctx.globalCompositeOperation = 'destination-in';
      ctx.fillStyle = 'white';
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 4 * scale);
      ctx.fill();
      ctx.globalCompositeOperation = 'source-over';

      // Top highlight
      ctx.fillStyle = 'rgba(255,255,255,0.15)';
      ctx.fillRect(-w / 2, -h / 2, w, h * 0.3);

      // Border
      ctx.strokeStyle = 'rgba(0,0,0,0.3)';
      ctx.lineWidth = 1.5 * scale;
      ctx.beginPath();
      ctx.roundRect(-w / 2, -h / 2, w, h, 4 * scale);
      ctx.stroke();
      break;
    }

    case 'pit': {
      // Outer rim
      ctx.fillStyle = COLORS.pitOuter;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2 + 4 * scale, h / 2 + 4 * scale, 0, 0, Math.PI * 2);
      ctx.fill();

      // Inner darkness
      const pitGrad = ctx.createRadialGradient(0, 0, 0, 0, 0, w / 2);
      pitGrad.addColorStop(0, COLORS.pitInner);
      pitGrad.addColorStop(0.7, '#1a0a0a');
      pitGrad.addColorStop(1, COLORS.pitOuter);
      ctx.fillStyle = pitGrad;
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();

      // Warning ring
      ctx.strokeStyle = COLORS.wallStripe;
      ctx.lineWidth = 2 * scale;
      ctx.setLineDash([4 * scale, 4 * scale]);
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2 + 2 * scale, h / 2 + 2 * scale, 0, 0, Math.PI * 2);
      ctx.stroke();
      ctx.setLineDash([]);
      break;
    }
  }

  ctx.restore();
}
