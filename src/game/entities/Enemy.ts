import { Crowd } from './Crowd';
import { ENEMY_BASE_COUNT, ENEMY_COUNT_SCALE } from '../utils/constants';

export class Enemy extends Crowd {
  defeated = false;

  constructor(x: number, y: number, level: number) {
    const count = ENEMY_BASE_COUNT + Math.floor(level * ENEMY_COUNT_SCALE * (1 + level * 0.1));
    super(x, y, count, false);
  }

  clash(playerCount: number, unitPower: number): { playerRemaining: number; enemyRemaining: number } {
    const effectivePlayer = Math.floor(playerCount * unitPower);
    const remaining = effectivePlayer - this.count;

    if (remaining > 0) {
      this.defeated = true;
      this.count = 0;
      return {
        playerRemaining: Math.floor(remaining / unitPower),
        enemyRemaining: 0,
      };
    } else {
      this.count = Math.abs(remaining);
      return {
        playerRemaining: 0,
        enemyRemaining: this.count,
      };
    }
  }
}
