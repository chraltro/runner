import { Crowd } from '../entities/Crowd';
import { GateData } from '../entities/Gate';
import { ObstacleData } from '../entities/Obstacle';
import { GATE_WIDTH, GATE_HEIGHT } from '../utils/constants';

export function checkGateCollision(crowd: Crowd, gate: GateData): boolean {
  if (gate.passed) return false;

  const gateLeft = gate.x - GATE_WIDTH / 2;
  const gateRight = gate.x + GATE_WIDTH / 2;
  const gateTop = gate.y - GATE_HEIGHT / 2;
  const gateBottom = gate.y + GATE_HEIGHT / 2;

  const inX = crowd.x >= gateLeft && crowd.x <= gateRight;
  const inY = crowd.y >= gateTop && crowd.y <= gateBottom;

  return inX && inY;
}

export function applyGateEffect(crowd: Crowd, gate: GateData) {
  switch (gate.type) {
    case 'add':
      crowd.addUnits(gate.value);
      break;
    case 'multiply':
      crowd.multiplyUnits(gate.value);
      break;
    case 'subtract':
      crowd.removeUnits(gate.value);
      break;
    case 'divide':
      crowd.divideUnits(gate.value);
      break;
  }
  gate.passed = true;
}

export function checkObstacleCollision(crowd: Crowd, obstacle: ObstacleData): boolean {
  if (!obstacle.active) return false;

  const dx = Math.abs(crowd.x - obstacle.x);
  const dy = Math.abs(crowd.y - obstacle.y);
  // Use dynamic crowd radius based on actual spread
  const crowdRadius = Math.max(15, crowd.getSpread() * 0.5);

  return dx < (obstacle.width / 2 + crowdRadius) && dy < (obstacle.height / 2 + crowdRadius);
}

export function applyObstacleDamage(crowd: Crowd): number {
  const damage = Math.max(1, Math.floor(crowd.count * 0.12));
  crowd.removeUnits(damage);
  return damage;
}
