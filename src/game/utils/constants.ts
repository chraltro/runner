// ── Track & World ──────────────────────────────────────
export const TRACK_WIDTH = 320;
export const TRACK_LANES = 3;
export const LANE_WIDTH = TRACK_WIDTH / TRACK_LANES;
export const TRACK_EDGE_MARGIN = 15;

// ── Canvas / Rendering ─────────────────────────────────
export const DESIGN_WIDTH = 400;

// ── Crowd ──────────────────────────────────────────────
export const BASE_UNIT_COUNT = 10;
export const UNIT_RADIUS = 5;
export const CROWD_SPREAD_FACTOR = 6.5;
export const MAX_RENDER_UNITS = 250;

// ── Movement ───────────────────────────────────────────
export const BASE_FORWARD_SPEED = 3.2;
export const SPEED_INCREMENT_PER_LEVEL = 0.08;
export const LATERAL_SENSITIVITY = 1.8;
export const CROWD_SMOOTHING = 0.18;

// ── Gates ──────────────────────────────────────────────
export const GATE_GAP = 20;
export const GATE_WIDTH = (TRACK_WIDTH - GATE_GAP) / 2;
export const GATE_HEIGHT = 70;
export const GATE_SPACING = 450;
export const GATE_PILLAR_WIDTH = 8;

// ── Obstacles ──────────────────────────────────────────
export const OBSTACLE_MIN_SPACING = 200;
export const OBSTACLE_HIT_COOLDOWN = 500;

// ── Level ──────────────────────────────────────────────
export const LEVEL_BASE_LENGTH = 3500;
export const LEVEL_LENGTH_INCREMENT = 400;
export const BOSS_EVERY_N_LEVELS = 5;

// ── Enemy ──────────────────────────────────────────────
export const ENEMY_BASE_COUNT = 8;
export const ENEMY_COUNT_SCALE = 5;

// ── Boss ───────────────────────────────────────────────
export const BOSS_BASE_HP = 30;
export const BOSS_HP_SCALE = 20;
export const BOSS_ATTACK_INTERVAL = 2000;
export const BOSS_ATTACK_DAMAGE = 5;
export const BOSS_RADIUS = 45;

// ── Upgrades ───────────────────────────────────────────
export const UPGRADE_BASE_COST = 50;
export const UPGRADE_COST_MULTIPLIER = 1.8;

// ── Coins ──────────────────────────────────────────────
export const COINS_PER_UNIT = 2;

// ── Camera ─────────────────────────────────────────────
export const CAMERA_LOOK_AHEAD = 0.55;
export const CAMERA_SHAKE_DECAY = 0.9;
export const CAMERA_SHAKE_SMALL = 3;
export const CAMERA_SHAKE_BIG = 8;

// ── Particles ──────────────────────────────────────────
export const MAX_PARTICLES = 500;
export const PARTICLE_LIFETIME = 1200;

// ── Timing ─────────────────────────────────────────────
export const CLASH_DELAY_MS = 800;
export const LEVEL_COMPLETE_DELAY_MS = 1200;
export const FRAME_CAP_MS = 33;

// ── Color Palette ──────────────────────────────────────
export const COLORS = {
  // Background
  skyTop: '#5B86E5',
  skyBottom: '#36D1DC',
  backgroundDark: '#0f0c29',

  // Track
  trackBase: '#555580',
  trackHighlight: '#6E6E9E',
  trackEdge: '#8888BB',
  trackLine: 'rgba(255,255,255,0.15)',
  trackShadow: 'rgba(0,0,0,0.3)',

  // Grass / sides
  grassNear: '#3CAA3C',
  grassFar: '#1D6B1D',
  grassStripe: '#34963A',

  // Player crowd
  crowdPlayer: '#4FC3F7',
  crowdPlayerLight: '#81D4FA',
  crowdPlayerDark: '#0277BD',
  crowdPlayerGlow: 'rgba(79,195,247,0.35)',

  // Enemy crowd
  crowdEnemy: '#EF5350',
  crowdEnemyLight: '#FF8A80',
  crowdEnemyDark: '#C62828',
  crowdEnemyGlow: 'rgba(239,83,80,0.35)',

  // Gates
  gateGoodStart: '#43A047',
  gateGoodEnd: '#66BB6A',
  gateGoodBorder: '#2E7D32',
  gateGoodGlow: 'rgba(76,175,80,0.5)',
  gateBadStart: '#E53935',
  gateBadEnd: '#EF5350',
  gateBadBorder: '#B71C1C',
  gateBadGlow: 'rgba(244,67,54,0.5)',
  gatePillar: '#DDD',
  gatePillarShadow: '#999',

  // Obstacles
  bladeCore: '#B71C1C',
  bladeEdge: '#FF5252',
  bladeGlow: 'rgba(255,82,82,0.4)',
  wallBase: '#546E7A',
  wallTop: '#78909C',
  wallStripe: '#FF7043',
  pitOuter: '#37474F',
  pitInner: '#0a0a0a',

  // Boss
  bossBody: '#7B1FA2',
  bossBodyLight: '#AB47BC',
  bossAccent: '#E040FB',
  bossEye: '#FFD600',
  bossGlow: 'rgba(224,64,251,0.4)',

  // UI
  coin: '#FFD700',
  coinDark: '#FFA000',
  white: '#FFFFFF',
  black: '#000000',
  textShadow: 'rgba(0,0,0,0.6)',
  hpBarBg: 'rgba(0,0,0,0.6)',
  hpBarFill: '#F44336',
  hpBarShine: 'rgba(255,255,255,0.25)',

  // Particles
  sparkYellow: '#FFD54F',
  sparkOrange: '#FF9800',
  sparkWhite: '#FFFFFF',
  sparkBlue: '#4FC3F7',
  sparkRed: '#FF5252',
  sparkGreen: '#69F0AE',
  confetti: ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#FFD700', '#FF69B4', '#7C4DFF', '#69F0AE'],
};
