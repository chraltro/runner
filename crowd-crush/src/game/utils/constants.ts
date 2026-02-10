// Game constants
export const TRACK_WIDTH = 300;
export const TRACK_LANES = 3;
export const LANE_WIDTH = TRACK_WIDTH / TRACK_LANES;

// Canvas / rendering
export const DESIGN_WIDTH = 400;
export const DESIGN_HEIGHT = 700;

// Crowd
export const BASE_UNIT_COUNT = 10;
export const UNIT_RADIUS = 4;
export const CROWD_SPREAD = 40;
export const MAX_RENDER_UNITS = 200;

// Movement
export const BASE_FORWARD_SPEED = 3;
export const SPEED_INCREMENT_PER_LEVEL = 0.1;
export const LATERAL_SPEED = 8;

// Gates
export const GATE_WIDTH = TRACK_WIDTH / 2 - 10;
export const GATE_HEIGHT = 60;
export const GATE_SPACING = 400;

// Obstacles
export const OBSTACLE_MIN_SPACING = 200;

// Level
export const LEVEL_BASE_LENGTH = 3000;
export const LEVEL_LENGTH_INCREMENT = 500;
export const BOSS_EVERY_N_LEVELS = 5;

// Enemy
export const ENEMY_BASE_COUNT = 8;
export const ENEMY_COUNT_SCALE = 5;

// Boss
export const BOSS_BASE_HP = 30;
export const BOSS_HP_SCALE = 20;
export const BOSS_ATTACK_INTERVAL = 2000;
export const BOSS_ATTACK_DAMAGE = 5;

// Upgrades
export const UPGRADE_BASE_COST = 50;
export const UPGRADE_COST_MULTIPLIER = 1.8;

// Coins
export const COINS_PER_UNIT = 2;

// Colors
export const COLORS = {
  track: '#4a4a6a',
  trackEdge: '#6a6a9a',
  trackLine: '#5a5a8a',
  grass: '#2d5a1e',
  sky: '#87CEEB',
  crowdPlayer: '#4FC3F7',
  crowdPlayerDark: '#0288D1',
  crowdEnemy: '#EF5350',
  crowdEnemyDark: '#C62828',
  gateGood: '#4CAF50',
  gateGoodBg: 'rgba(76,175,80,0.85)',
  gateBad: '#F44336',
  gateBadBg: 'rgba(244,67,54,0.85)',
  obstacleBase: '#FF5722',
  obstacleBlade: '#D84315',
  bossBody: '#7B1FA2',
  bossAccent: '#E040FB',
  coin: '#FFD700',
  white: '#FFFFFF',
  black: '#000000',
  textShadow: 'rgba(0,0,0,0.5)',
  hpBarBg: '#333333',
  hpBarFill: '#F44336',
  background: '#1a1a2e',
};

// Particle
export const MAX_PARTICLES = 300;
export const PARTICLE_LIFETIME = 1000;
