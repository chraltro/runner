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
  LATERAL_SPEED,
  COLORS,
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
    this.obstacleHitCooldowns.clear();
    this.particles.clear();

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
    const dt = Math.min(time - this.lastTime, 33); // Cap at ~30fps minimum
    this.lastTime = time;

    if (!this.paused) {
      this.update(dt);
      this.render();
    }

    this.animFrame = requestAnimationFrame(this.loop);
  };

  private update(dt: number) {
    if (this.screens.currentScreen !== 'playing') return;
    if (!this.crowd || !this.level) return;

    this.particles.update(dt);

    if (this.gamePhase === 'running') {
      this.updateRunning(dt);
    } else if (this.gamePhase === 'clashing') {
      this.updateClash(dt);
    } else if (this.gamePhase === 'bossing') {
      this.updateBoss(dt);
    }
  }

  private updateRunning(dt: number) {
    const crowd = this.crowd!;
    const level = this.level!;

    // Forward movement
    const speed = (BASE_FORWARD_SPEED + this.currentLevel * SPEED_INCREMENT_PER_LEVEL) *
      this.progress.getSpeedBonus();
    crowd.y -= speed;
    this.cameraY = crowd.y - this.renderer.height / this.renderer.scale * 0.6;

    // Lateral movement from input
    const dragDelta = this.input.getDragDelta();
    if (dragDelta !== 0) {
      crowd.setTargetX(crowd.x + dragDelta * LATERAL_SPEED / this.renderer.scale);
    }

    crowd.update(dt);

    // Check gates
    for (const gate of level.gates) {
      if (!gate.passed && checkGateCollision(crowd, gate)) {
        const good = isGoodGate(gate);
        applyGateEffect(crowd, gate);
        this.particles.burstGate(gate.x, gate.y, good);

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
        this.obstacleHitCooldowns.set(obstacle, 500);
        this.particles.burstImpact(obstacle.x, obstacle.y);
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

    if (this.clashTimer < 1000) {
      // Animate approaching
      return;
    }

    if (!this.clashResult) {
      this.clashResult = enemy.clash(crowd.count, this.progress.getUnitPower());
      this.particles.burstImpact(0, enemy.y);
      this.particles.burstImpact(0, enemy.y);

      if (this.clashResult.playerRemaining > 0) {
        crowd.count = this.clashResult.playerRemaining;
        setTimeout(() => this.levelComplete(), 1500);
      } else {
        crowd.count = 0;
        setTimeout(() => this.gameOver(), 1500);
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
        setTimeout(() => this.levelComplete(), 1500);
      }
    }
  }

  private levelComplete() {
    const earned = this.progress.awardCoins(this.crowd?.count || 0);
    this.progress.advanceLevel();
    this.currentLevel++;
    this.gamePhase = 'idle';
    this.screens.setScreen('levelComplete', { coins: earned, level: this.currentLevel - 1 });
  }

  private gameOver() {
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
      }
      return;
    }

    this.renderGameWorld();
  }

  private renderGameWorld() {
    const { renderer, particles } = this;
    const ctx = renderer.ctx;
    const scale = renderer.scale;
    const cameraY = this.cameraY;
    const level = this.level!;

    // Track
    renderer.renderTrack(cameraY);

    // Finish line
    renderer.renderFinishLine(level.enemyY + 50, cameraY);

    // Gates
    for (const gate of level.gates) {
      renderGate(ctx, gate, cameraY, scale);
    }

    // Obstacles
    for (const obstacle of level.obstacles) {
      renderObstacle(ctx, obstacle, cameraY, scale);
    }

    // Enemy
    if (this.enemy && !this.enemy.defeated) {
      this.enemy.render(ctx, cameraY, scale);
    }

    // Boss
    if (this.boss) {
      this.boss.render(ctx, cameraY, scale);
    }

    // Player crowd
    if (this.crowd && this.crowd.count > 0) {
      this.crowd.render(ctx, cameraY, scale);
    }

    // Particles
    particles.render(ctx, cameraY, scale);
  }

  private renderTitle() {
    const { ctx } = this.renderer;
    const w = this.renderer.width;
    const h = this.renderer.height;

    // Background
    const grad = ctx.createLinearGradient(0, 0, 0, h);
    grad.addColorStop(0, '#1a1a3e');
    grad.addColorStop(1, '#0a0a1e');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, h);

    // Title
    ctx.fillStyle = COLORS.white;
    ctx.font = `bold ${Math.round(48 * this.renderer.scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('CROWD', w / 2, h * 0.3);
    ctx.fillStyle = COLORS.crowdPlayer;
    ctx.fillText('CRUSH', w / 2, h * 0.3 + 55 * this.renderer.scale);

    // Tap to start (pulsing)
    const pulse = 0.7 + Math.sin(performance.now() * 0.003) * 0.3;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = COLORS.white;
    ctx.font = `bold ${Math.round(20 * this.renderer.scale)}px Arial`;
    ctx.fillText('TAP TO START', w / 2, h * 0.6);
    ctx.globalAlpha = 1;

    // High level
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.font = `${Math.round(16 * this.renderer.scale)}px Arial`;
    ctx.fillText(`Highest Level: ${this.progress.data.highestLevel}`, w / 2, h * 0.7);
    ctx.fillText(`Coins: ${this.progress.data.coins}`, w / 2, h * 0.75);
  }

  destroy() {
    this.running = false;
    cancelAnimationFrame(this.animFrame);
    this.input.destroy();
  }
}
