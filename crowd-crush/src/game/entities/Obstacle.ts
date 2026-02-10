import { COLORS, TRACK_WIDTH } from '../utils/constants';

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
  level: number,
  rng: () => number
): ObstacleData {
  const types: ObstacleType[] = ['blade', 'wall', 'pit'];
  const type = types[Math.floor(rng() * types.length)];
  const halfTrack = TRACK_WIDTH / 2 - 30;

  switch (type) {
    case 'blade':
      return {
        type,
        x: (rng() - 0.5) * halfTrack * 2,
        y,
        width: 30 + rng() * 20,
        height: 30 + rng() * 20,
        rotation: 0,
        active: true,
      };
    case 'wall':
      return {
        type,
        x: (rng() - 0.5) * halfTrack,
        y,
        width: 60 + rng() * 80,
        height: 15,
        rotation: 0,
        active: true,
      };
    case 'pit':
      return {
        type,
        x: (rng() - 0.5) * halfTrack,
        y,
        width: 50 + rng() * 40,
        height: 30 + rng() * 20,
        rotation: 0,
        active: true,
      };
  }
}

export function updateObstacle(obstacle: ObstacleData, dt: number) {
  if (obstacle.type === 'blade') {
    obstacle.rotation += dt * 0.005;
  }
}

export function renderObstacle(
  ctx: CanvasRenderingContext2D,
  obstacle: ObstacleData,
  cameraY: number,
  scale: number
) {
  if (!obstacle.active) return;

  const screenX = ctx.canvas.width / 2 + obstacle.x * scale;
  const screenY = (obstacle.y - cameraY) * scale;

  if (screenY < -100 || screenY > ctx.canvas.height + 100) return;

  const w = obstacle.width * scale;
  const h = obstacle.height * scale;

  ctx.save();
  ctx.translate(screenX, screenY);

  switch (obstacle.type) {
    case 'blade':
      ctx.rotate(obstacle.rotation);
      // Draw spinning blade
      ctx.fillStyle = COLORS.obstacleBlade;
      for (let i = 0; i < 4; i++) {
        ctx.save();
        ctx.rotate((i * Math.PI) / 2);
        ctx.fillRect(-w * 0.08, -w / 2, w * 0.16, w);
        ctx.restore();
      }
      // Center hub
      ctx.fillStyle = COLORS.obstacleBase;
      ctx.beginPath();
      ctx.arc(0, 0, w * 0.15, 0, Math.PI * 2);
      ctx.fill();
      break;

    case 'wall':
      ctx.fillStyle = COLORS.obstacleBase;
      ctx.fillRect(-w / 2, -h / 2, w, h);
      // Highlight
      ctx.fillStyle = 'rgba(255,255,255,0.2)';
      ctx.fillRect(-w / 2, -h / 2, w, h / 3);
      break;

    case 'pit':
      ctx.fillStyle = '#1a0a0a';
      ctx.beginPath();
      ctx.ellipse(0, 0, w / 2, h / 2, 0, 0, Math.PI * 2);
      ctx.fill();
      // Rim
      ctx.strokeStyle = COLORS.obstacleBase;
      ctx.lineWidth = 2 * scale;
      ctx.stroke();
      break;
  }

  ctx.restore();
}
