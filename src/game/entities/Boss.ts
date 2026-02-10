import { BOSS_BASE_HP, BOSS_HP_SCALE, BOSS_ATTACK_INTERVAL, BOSS_ATTACK_DAMAGE, COLORS } from '../utils/constants';

export class Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attackTimer: number;
  isAttacking = false;
  attackAnimTimer = 0;
  defeated = false;
  radius = 40;

  constructor(x: number, y: number, level: number) {
    this.x = x;
    this.y = y;
    this.maxHp = BOSS_BASE_HP + Math.floor((level / 5) * BOSS_HP_SCALE);
    this.hp = this.maxHp;
    this.attackTimer = BOSS_ATTACK_INTERVAL;
  }

  update(dt: number): { shouldAttack: boolean } {
    let shouldAttack = false;

    this.attackTimer -= dt;
    if (this.attackTimer <= 0) {
      this.attackTimer = BOSS_ATTACK_INTERVAL;
      this.isAttacking = true;
      this.attackAnimTimer = 400;
      shouldAttack = true;
    }

    if (this.attackAnimTimer > 0) {
      this.attackAnimTimer -= dt;
      if (this.attackAnimTimer <= 0) {
        this.isAttacking = false;
      }
    }

    return { shouldAttack };
  }

  takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    if (this.hp <= 0) {
      this.defeated = true;
    }
  }

  getAttackDamage(): number {
    return BOSS_ATTACK_DAMAGE;
  }

  render(ctx: CanvasRenderingContext2D, cameraY: number, scale: number) {
    const screenX = ctx.canvas.width / 2 + this.x * scale;
    const screenY = (this.y - cameraY) * scale;

    if (screenY < -200 || screenY > ctx.canvas.height + 200) return;

    const r = this.radius * scale;
    const attackScale = this.isAttacking ? 1.2 : 1.0;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(attackScale, attackScale);

    // Body
    ctx.fillStyle = COLORS.bossBody;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();

    // Accent ring
    ctx.strokeStyle = COLORS.bossAccent;
    ctx.lineWidth = 4 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.7, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    ctx.fillStyle = COLORS.white;
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.2, r * 0.15, 0, Math.PI * 2);
    ctx.fill();

    // Pupils
    ctx.fillStyle = COLORS.black;
    ctx.beginPath();
    ctx.arc(-r * 0.3, -r * 0.15, r * 0.07, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(r * 0.3, -r * 0.15, r * 0.07, 0, Math.PI * 2);
    ctx.fill();

    ctx.restore();

    // HP Bar
    const barWidth = 100 * scale;
    const barHeight = 10 * scale;
    const barX = screenX - barWidth / 2;
    const barY = screenY - r * attackScale - 20 * scale;

    ctx.fillStyle = COLORS.hpBarBg;
    ctx.fillRect(barX, barY, barWidth, barHeight);
    ctx.fillStyle = COLORS.hpBarFill;
    ctx.fillRect(barX, barY, barWidth * (this.hp / this.maxHp), barHeight);
    ctx.strokeStyle = COLORS.white;
    ctx.lineWidth = 1;
    ctx.strokeRect(barX, barY, barWidth, barHeight);

    // HP text
    ctx.fillStyle = COLORS.white;
    ctx.font = `bold ${Math.round(12 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';
    ctx.fillText(`${this.hp}/${this.maxHp}`, screenX, barY - 2);
  }
}
