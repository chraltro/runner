import { GateData, createGatePair } from './entities/Gate';
import { ObstacleData, createObstacle } from './entities/Obstacle';
import {
  GATE_SPACING,
  LEVEL_BASE_LENGTH,
  LEVEL_LENGTH_INCREMENT,
  OBSTACLE_MIN_SPACING,
  BOSS_EVERY_N_LEVELS,
} from './utils/constants';
import { seededRandom } from './utils/helpers';

export interface LevelData {
  gates: GateData[];
  obstacles: ObstacleData[];
  length: number;
  enemyY: number;
  isBossLevel: boolean;
  levelNumber: number;
}

export function generateLevel(levelNumber: number): LevelData {
  const rng = seededRandom(levelNumber * 7919 + 1337);
  const isBossLevel = levelNumber % BOSS_EVERY_N_LEVELS === 0;
  const length = LEVEL_BASE_LENGTH + levelNumber * LEVEL_LENGTH_INCREMENT;

  const gates: GateData[] = [];
  const obstacles: ObstacleData[] = [];

  // Place gates at regular intervals
  const numGates = Math.floor(length / GATE_SPACING) - 1;
  for (let i = 0; i < numGates; i++) {
    const y = -(GATE_SPACING * (i + 1));
    const pair = createGatePair(y, levelNumber, rng);
    gates.push(pair[0], pair[1]);
  }

  // Place obstacles between gates
  const numObstacles = Math.min(2 + levelNumber, 15);
  const usedYs = new Set<number>();

  for (let i = 0; i < numObstacles; i++) {
    let y: number;
    let attempts = 0;
    do {
      y = -(OBSTACLE_MIN_SPACING + rng() * (length - OBSTACLE_MIN_SPACING * 2));
      attempts++;
    } while (
      attempts < 50 &&
      (isTooCloseToGate(y, gates) || isTooCloseToUsed(y, usedYs))
    );

    if (attempts < 50) {
      usedYs.add(y);
      obstacles.push(createObstacle(y, levelNumber, rng));
    }
  }

  const enemyY = -(length - 100);

  return {
    gates,
    obstacles,
    length,
    enemyY,
    isBossLevel,
    levelNumber,
  };
}

function isTooCloseToGate(y: number, gates: GateData[]): boolean {
  for (const gate of gates) {
    if (Math.abs(y - gate.y) < 80) return true;
  }
  return false;
}

function isTooCloseToUsed(y: number, usedYs: Set<number>): boolean {
  for (const uy of usedYs) {
    if (Math.abs(y - uy) < OBSTACLE_MIN_SPACING) return true;
  }
  return false;
}
