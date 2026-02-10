import { Renderer } from './systems/Renderer';
import { ParticleSystem } from './systems/ParticleSystem';
import { InputManager } from './InputManager';
import { ProgressManager } from './managers/ProgressManager';
import { ScreenManager } from './managers/ScreenManager';
import { Crowd } from './entities/Crowd';
import { Enemy } from './entities/Enemy';
import { Boss } from './entities/Boss';
import { renderGate, isGoodGate } from './entities/Gate';
import { ObstacleData, updateObstacle, renderObstacle } from './entities/Obstacle';
import { checkGateCollision, applyGateEffect, checkObstacleCollision, applyObstacleDamage } from './systems/Physics';
import { generateLevel, LevelData } from './LevelGenerator';
import {
  BASE_FORWARD_SPEED,
  SPEED_INCREMENT_PER_LEVEL,
  LATERAL_SENSITIVITY,
  COLORS,
  CAMERA_LOOK_AHEAD,
  CAMERA_SHAKE_DECAY,
  CAMERA_SHAKE_SMALL,
  CAMERA_SHAKE_BIG,
  CLASH_DELAY_MS,
  LEVEL_COMPLETE_DELAY_MS,
  FRAME_CAP_MS,
  OBSTACLE_HIT_COOLDOWN,
} from './utils/constants';

export class Game {
  renderer: Renderer;
  particles: ParticleSystem;
  input: InputManager;
  progress: ProgressManager;
  screens: ScreenManager;

  private animFrame = 0;
  private lastTime = 0;
  private paused = false;
  private running = false;

  // Game state
  private crowd: Crowd | null = null;
  private enemy: Enemy | null = null;
  private boss: Boss | null = null;
  private level: LevelData | null = null;
  private cameraY = 0;
  private currentLevel = 1;
  private gamePhase: 'running' | 'clashing' | 'bossing' | 'idle' = 'idle';
  private clashTimer = 0;
  private clashResult: { playerRemaining: number; enemyRemaining: number } | null = null;
  private bossChipTimer = 0;
  private obstacleHitCooldowns: Map<ObstacleData, number> = new Map();

  // Screen shake
  private shakeIntensity = 0;

  // Pending timeouts (for cleanup)
  private pendingTimeouts: ReturnType<typeof setTimeout>[] = [];

  getUnitCount(): number {
    return this.crowd?.count ?? 0;
  }

  constructor(canvas: HTMLCanvasElement) {
    this.renderer = new Renderer(canvas);
    this.particles = new ParticleSystem();
    this.input = new InputManager(canvas);
    this.progress = new ProgressManager();
    this.screens = new ScreenManager();
    this.currentLevel = this.progress.data.highestLevel;

    // Handle resize
    window.addEventListener('resize', () => this.renderer.resize());

    // Pause on visibility change
    document.addEventListener('visibilitychange', () => {
      this.paused = document.hidden;
    });

    // Handle tap for starting
    this.input.onTap = () => {
      if (this.screens.currentScreen === 'title') {
        this.startLevel();
      }
    };
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.screens.setScreen('title');
    this.lastTime = performance.now();
    this.loop(this.lastTime);
  }

  startLevel() {
    this.level = generateLevel(this.currentLevel);
    this.crowd = new Crowd(0, 0, this.progress.getStartingUnits(), true);
    this.cameraY = 0;
    this.gamePhase = 'running';
    this.clashResult = null;
    this.clashTimer = 0;
    this.bossChipTimer = 0;
    this.shakeIntensity = 0;
    this.obstacleHitCooldowns.clear();
    this.particles.clear();
    this.clearPendingTimeouts();

    if (this.level.isBossLevel) {
      this.boss = new Boss(0, this.level.enemyY, this.currentLevel);
      this.enemy = null;
    } else {
      this.enemy = new Enemy(0, this.level.enemyY, this.currentLevel);
      this.boss = null;
    }

    this.screens.setScreen('playing');
  }

  private loop = (time: number) => {
    const dt = Math.min(time - this.lastTime, FRAME_CAP_MS);
    this.lastTime = time;

    if (!this.paused) {
      this.update(dt);
      this.render();
    }

    this.animFrame = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    this.renderer.updateTime(dt);

    if (this.screens.currentScreen !== 'playing') return;
    if (!this.crowd || !this.level) return;

    // Update screen shake
    this.updateShake(dt);

    this.particles.update(dt);

    if (this.gamePhase === 'running') {
      this.updateRunning(dt);
    } else if (this.gamePhase === 'clashing') {
      this.updateClash(dt);
    } else if (this.gamePhase === 'bossing') {
      this.updateBoss(dt);
    }
  }

  private updateShake(dt: number) {
    if (this.shakeIntensity > 0.1) {
      this.renderer.shakeX = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.renderer.shakeY = (Math.random() - 0.5) * this.shakeIntensity * 2;
      this.shakeIntensity *= Math.pow(CAMERA_SHAKE_DECAY, dt / 16);
    } else {
      this.shakeIntensity = 0;
      this.renderer.shakeX = 0;
      this.renderer.shakeY = 0;
    }
  }

  private addShake(intensity: number) {
    this.shakeIntensity = Math.min(this.shakeIntensity + intensity, 15);
  }

  private updateRunning(dt: number) {
    const crowd = this.crowd!;
    const level = this.level!;

    // Forward movement
    const speed = (BASE_FORWARD_SPEED + this.currentLevel * SPEED_INCREMENT_PER_LEVEL) *
      this.progress.getSpeedBonus();
    crowd.y -= speed;
    this.cameraY = crowd.y - this.renderer.height / this.renderer.scale * CAMERA_LOOK_AHEAD;

    // Lateral movement from input
    const dragDelta = this.input.consumeDragDelta();
    if (dragDelta !== 0) {
      crowd.setTargetX(crowd.x + dragDelta * LATERAL_SENSITIVITY / this.renderer.scale);
    }

    crowd.update(dt);

    // Check gates
    for (const gate of level.gates) {
      if (!gate.passed && checkGateCollision(crowd, gate)) {
        const good = isGoodGate(gate);
        applyGateEffect(crowd, gate);
        this.particles.burstGate(gate.x, gate.y, good);
        this.addShake(good ? CAMERA_SHAKE_SMALL : CAMERA_SHAKE_SMALL * 1.5);

        // Mark the partner gate as passed too
        for (const other of level.gates) {
          if (other !== gate && Math.abs(other.y - gate.y) < 10) {
            other.passed = true;
          }
        }
      }
    }

    // Check obstacles
    for (const obstacle of level.obstacles) {
      if (!obstacle.active) continue;
      const cooldown = this.obstacleHitCooldowns.get(obstacle) || 0;
      if (cooldown > 0) {
        this.obstacleHitCooldowns.set(obstacle, cooldown - dt);
        continue;
      }
      if (checkObstacleCollision(crowd, obstacle)) {
        applyObstacleDamage(crowd);
        this.obstacleHitCooldowns.set(obstacle, OBSTACLE_HIT_COOLDOWN);
        this.particles.burstDamage(obstacle.x, obstacle.y);
        this.addShake(CAMERA_SHAKE_SMALL);
        if (crowd.count <= 0) {
          this.gameOver();
          return;
        }
      }
    }

    // Update obstacles
    for (const obstacle of level.obstacles) {
      updateObstacle(obstacle, dt);
    }

    // Check if reached enemy/boss
    if (this.enemy && Math.abs(crowd.y - this.enemy.y) < 50) {
      this.gamePhase = 'clashing';
      this.clashTimer = 0;
    }
    if (this.boss && Math.abs(crowd.y - this.boss.y) < this.boss.radius + 50) {
      this.gamePhase = 'bossing';
      this.bossChipTimer = 0;
    }
  }

  private updateClash(dt: number) {
    const crowd = this.crowd!;
    const enemy = this.enemy!;

    this.clashTimer += dt;

    if (this.clashTimer < CLASH_DELAY_MS) {
      return;
    }

    if (!this.clashResult) {
      this.clashResult = enemy.clash(crowd.count, this.progress.getUnitPower());
      this.particles.burstImpact(0, enemy.y);
      this.particles.burstImpact(0, enemy.y);
      this.addShake(CAMERA_SHAKE_BIG);

      if (this.clashResult.playerRemaining > 0) {
        crowd.count = this.clashResult.playerRemaining;
        this.scheduleTimeout(() => this.levelComplete(), LEVEL_COMPLETE_DELAY_MS);
      } else {
        crowd.count = 0;
        this.scheduleTimeout(() => this.gameOver(), LEVEL_COMPLETE_DELAY_MS);
      }
    }
  }

  private updateBoss(dt: number) {
    const crowd = this.crowd!;
    const boss = this.boss!;

    if (boss.defeated) return;

    // Boss attacks
    const { shouldAttack } = boss.update(dt);
    if (shouldAttack) {
      const dmg = boss.getAttackDamage();
      crowd.removeUnits(dmg);
      this.particles.burstImpact(boss.x, boss.y + boss.radius);
      this.addShake(CAMERA_SHAKE_SMALL * 2);
      if (crowd.count <= 0) {
        this.gameOver();
        return;
      }
    }

    // Player crowd chips away at boss
    this.bossChipTimer += dt;
    if (this.bossChipTimer > 200) {
      this.bossChipTimer = 0;
      const chipDamage = Math.max(1, Math.floor(crowd.count * 0.05));
      boss.takeDamage(chipDamage);
      crowd.removeUnits(Math.max(1, Math.floor(chipDamage * 0.3)));

      if (crowd.count <= 0) {
        this.gameOver();
        return;
      }

      if (boss.defeated) {
        this.particles.burstConfetti(boss.x, boss.y);
        this.particles.burstConfetti(boss.x, boss.y);
        this.addShake(CAMERA_SHAKE_BIG * 1.5);
        this.scheduleTimeout(() => this.levelComplete(), LEVEL_COMPLETE_DELAY_MS);
      }
    }
  }

  private levelComplete() {
    if (this.gamePhase === 'idle') return; // guard against double-fire
    const earned = this.progress.awardCoins(this.crowd?.count || 0);
    this.progress.advanceLevel();
    this.currentLevel++;
    this.gamePhase = 'idle';
    this.screens.setScreen('levelComplete', { coins: earned, level: this.currentLevel - 1 });
  }

  private gameOver() {
    if (this.gamePhase === 'idle') return; // guard against double-fire
    this.gamePhase = 'idle';
    this.screens.setScreen('gameOver');
  }

  goToUpgrades() {
    this.screens.setScreen('upgrades');
  }

  goToTitle() {
    this.screens.setScreen('title');
  }

  nextLevel() {
    this.startLevel();
  }

  retryLevel() {
    this.startLevel();
  }

  private render() {
    this.renderer.clear();

    if (this.screens.currentScreen === 'title') {
      this.renderTitle();
      return;
    }

    if (this.screens.currentScreen !== 'playing') {
      // Render frozen game in background
      if (this.level && this.crowd) {
        this.renderGameWorld();
        // Darken overlay for menus
        const ctx = this.renderer.ctx;
        ctx.fillStyle = 'rgba(0,0,0,0.4)';
        ctx.fillRect(0, 0, this.renderer.width, this.renderer.height);
      }
      return;
    }

    this.renderGameWorld();
    this.renderHUD();
  }

  private renderGameWorld() {
    const { renderer, particles } = this;
    const cameraY = this.cameraY;
    const level = this.level!;

    // Track
    renderer.renderTrack(cameraY);

    // Finish line
    renderer.renderFinishLine(level.enemyY + 50, cameraY);

    // Gates
    for (const gate of level.gates) {
      renderGate(renderer, gate, cameraY);
    }

    // Obstacles
    for (const obstacle of level.obstacles) {
      renderObstacle(renderer, obstacle, cameraY);
    }

    // Enemy
    if (this.enemy && !this.enemy.defeated) {
      this.enemy.render(renderer, cameraY);
    }

    // Boss
    if (this.boss) {
      this.boss.render(renderer, cameraY);
    }

    // Player crowd
    if (this.crowd && this.crowd.count > 0) {
      this.crowd.render(renderer, cameraY);
    }

    // Particles
    particles.render(renderer, cameraY);
  }

  private renderHUD() {
    if (!this.crowd || !this.level) return;

    // Progress bar (level/coins shown by React GameHUD overlay)
    this.renderer.renderProgressBar(this.crowd.y, this.level.enemyY);
  }

  private renderTitle() {
    const { ctx } = this.renderer;
    const w = this.renderer.width;
    const h = this.renderer.height;
    const scale = this.renderer.scale;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(0.5, '#0f1b4d');
    grad.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Subtle background pattern
    const t = performance.now() * 0.001;
    ctx.globalAlpha = 0.04;
    for (let i = 0; i < 12; i++) {
      const cx = w * 0.5 + Math.cos(t * 0.3 + i * 0.5) * w * 0.3;
      const cy = h * 0.4 + Math.sin(t * 0.2 + i * 0.7) * h * 0.2;
      const r = 60 + i * 15;
      ctx.fillStyle = COLORS.crowdPlayer;
      ctx.beginPath();
      ctx.arc(cx, cy, r * scale, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // Title "CROWD"
    const titleSize = Math.round(52 * scale);
    ctx.font = `bold ${titleSize}px Arial, sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // Text shadow
    ctx.fillStyle = 'rgba(0,0,0,0.5)';
    ctx.fillText('CROWD', w / 2 + 2, h * 0.28 + 2);
    ctx.fillStyle = COLORS.white;
    ctx.fillText('CROWD', w / 2, h * 0.28);

    // Title "CRUSH" with glow
    ctx.shadowColor = COLORS.crowdPlayer;
    ctx.shadowBlur = 20 * scale;
    ctx.fillStyle = COLORS.crowdPlayer;
    ctx.fillText('CRUSH', w / 2, h * 0.28 + titleSize * 1.1);
    ctx.shadowBlur = 0;

    // Decorative line
    const lineW = 120 * scale;
    const lineY = h * 0.28 + titleSize * 1.8;
    const lineGrad = ctx.createLinearGradient(w / 2 - lineW / 2, 0, w / 2 + lineW / 2, 0);
    lineGrad.addColorStop(0, 'rgba(79,195,247,0)');
    lineGrad.addColorStop(0.5, 'rgba(79,195,247,0.6)');
    lineGrad.addColorStop(1, 'rgba(79,195,247,0)');
    ctx.fillStyle = lineGrad;
    ctx.fillRect(w / 2 - lineW / 2, lineY, lineW, 2 * scale);

    // Tap to start (pulsing)
    const pulse = 0.6 + Math.sin(t * 3) * 0.4;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.white;
    ctx.font = `bold ${Math.round(22 * scale)}px Arial, sans-serif`;
    ctx.fillText('TAP TO START', w / 2, h * 0.58);
    ctx.globalAlpha = 1;

    // Stats
    const statsY = h * 0.72;
    const statsFont = Math.round(14 * scale);
    ctx.font = `${statsFont}px Arial, sans-serif`;
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillText(`Highest Level: ${this.progress.data.highestLevel}`, w / 2, statsY);
    ctx.fillStyle = COLORS.coin;
    ctx.fillText(`${this.progress.data.coins}`, w / 2, statsY + statsFont * 1.8);
    ctx.fillStyle = 'rgba(255,255,255,0.3)';
    ctx.font = `${Math.round(12 * scale)}px Arial, sans-serif`;
    ctx.fillText('coins', w / 2, statsY + statsFont * 3);
  }

  private scheduleTimeout(fn: () => void, delay: number) {
    const id = setTimeout(() => {
      // Remove from pending list
      const idx = this.pendingTimeouts.indexOf(id);
      if (idx !== -1) this.pendingTimeouts.splice(idx, 1);
      fn();
    }, delay);
    this.pendingTimeouts.push(id);
  }

  private clearPendingTimeouts() {
    for (const id of this.pendingTimeouts) {
      clearTimeout(id);
    }
    this.pendingTimeouts.length = 0;
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    this.clearPendingTimeouts();
    this.input.destroy();
  }
}
