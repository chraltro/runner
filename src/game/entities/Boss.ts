import { BOSS_BASE_HP, BOSS_HP_SCALE, BOSS_ATTACK_INTERVAL, BOSS_ATTACK_DAMAGE, BOSS_RADIUS, COLORS } from '../utils/constants';
import { Renderer } from '../systems/Renderer';

export class Boss {
  x: number;
  y: number;
  hp: number;
  maxHp: number;
  attackTimer: number;
  isAttacking = false;
  attackAnimTimer = 0;
  defeated = false;
  radius = BOSS_RADIUS;
  private pulsePhase = 0;
  private hitFlash = 0;

  constructor(x: number, y: number, level: number) {
    this.x = x;
    this.y = y;
    this.maxHp = BOSS_BASE_HP + Math.floor((level / 5) * BOSS_HP_SCALE);
    this.hp = this.maxHp;
    this.attackTimer = BOSS_ATTACK_INTERVAL;
  }

  update(dt: number): { shouldAttack: boolean } {
    let shouldAttack = false;
    this.pulsePhase += dt * 0.003;

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

    if (this.hitFlash > 0) {
      this.hitFlash -= dt;
    }

    return { shouldAttack };
  }

  takeDamage(amount: number) {
    this.hp = Math.max(0, this.hp - amount);
    this.hitFlash = 100;
    if (this.hp <= 0) {
      this.defeated = true;
    }
  }

  getAttackDamage(): number {
    return BOSS_ATTACK_DAMAGE;
  }

  render(renderer: Renderer, cameraY: number) {
    const ctx = renderer.ctx;
    const scale = renderer.scale;
    const screenX = renderer.worldToScreenX(this.x);
    const screenY = renderer.worldToScreenY(this.y, cameraY);

    if (screenY < -250 || screenY > renderer.height + 250) return;

    const r = this.radius * scale;
    const attackScale = this.isAttacking ? 1.25 : 1.0;
    const pulse = 1 + Math.sin(this.pulsePhase) * 0.03;
    const totalScale = attackScale * pulse;

    ctx.save();
    ctx.translate(screenX, screenY);
    ctx.scale(totalScale, totalScale);

    // Boss shadow
    ctx.fillStyle = 'rgba(0,0,0,0.25)';
    ctx.beginPath();
    ctx.ellipse(3, 5, r * 0.9, r * 0.4, 0, 0, Math.PI * 2);
    ctx.fill();

    // Outer glow ring
    ctx.shadowColor = COLORS.bossGlow;
    ctx.shadowBlur = 20 * scale;

    // Body gradient
    const bodyGrad = ctx.createRadialGradient(-r * 0.2, -r * 0.2, r * 0.1, 0, 0, r);
    bodyGrad.addColorStop(0, COLORS.bossBodyLight);
    bodyGrad.addColorStop(1, this.hitFlash > 0 ? '#FF4444' : COLORS.bossBody);
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;

    // Accent ring
    ctx.strokeStyle = COLORS.bossAccent;
    ctx.lineWidth = 3 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.72, 0, Math.PI * 2);
    ctx.stroke();

    // Inner pattern ring
    ctx.strokeStyle = 'rgba(224,64,251,0.3)';
    ctx.lineWidth = 1.5 * scale;
    ctx.beginPath();
    ctx.arc(0, 0, r * 0.5, 0, Math.PI * 2);
    ctx.stroke();

    // Eyes
    const eyeOffX = r * 0.3;
    const eyeOffY = -r * 0.15;
    const eyeR = r * 0.17;

    // Eye whites
    ctx.fillStyle = COLORS.bossEye;
    ctx.beginPath();
    ctx.ellipse(-eyeOffX, eyeOffY, eyeR, eyeR * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(eyeOffX, eyeOffY, eyeR, eyeR * 1.1, 0, 0, Math.PI * 2);
    ctx.fill();

    // Pupils (angry, look at player)
    const pupilR = eyeR * 0.5;
    ctx.fillStyle = COLORS.black;
    ctx.beginPath();
    ctx.arc(-eyeOffX, eyeOffY + pupilR * 0.3, pupilR, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(eyeOffX, eyeOffY + pupilR * 0.3, pupilR, 0, Math.PI * 2);
    ctx.fill();

    // Angry eyebrows
    ctx.strokeStyle = COLORS.bossBody;
    ctx.lineWidth = 3 * scale;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.moveTo(-eyeOffX - eyeR, eyeOffY - eyeR * 0.8);
    ctx.lineTo(-eyeOffX + eyeR * 0.5, eyeOffY - eyeR * 1.3);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(eyeOffX + eyeR, eyeOffY - eyeR * 0.8);
    ctx.lineTo(eyeOffX - eyeR * 0.5, eyeOffY - eyeR * 1.3);
    ctx.stroke();

    // Mouth (grimace)
    ctx.strokeStyle = '#4A148C';
    ctx.lineWidth = 2.5 * scale;
    ctx.beginPath();
    ctx.arc(0, r * 0.25, r * 0.25, 0.2, Math.PI - 0.2);
    ctx.stroke();

    // Crown/horns
    const hornH = r * 0.4;
    ctx.fillStyle = COLORS.bossAccent;
    ctx.beginPath();
    ctx.moveTo(-r * 0.5, -r * 0.85);
    ctx.lineTo(-r * 0.6, -r * 0.85 - hornH);
    ctx.lineTo(-r * 0.3, -r * 0.75);
    ctx.closePath();
    ctx.fill();
    ctx.beginPath();
    ctx.moveTo(r * 0.5, -r * 0.85);
    ctx.lineTo(r * 0.6, -r * 0.85 - hornH);
    ctx.lineTo(r * 0.3, -r * 0.75);
    ctx.closePath();
    ctx.fill();

    ctx.restore();

    // HP Bar (outside the transform)
    const barWidth = 120 * scale;
    const barHeight = 10 * scale;
    const barX = screenX - barWidth / 2;
    const barY = screenY - r * totalScale - 25 * scale;

    // Bar background
    ctx.fillStyle = COLORS.hpBarBg;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.fill();

    // HP fill
    const hpRatio = this.hp / this.maxHp;
    const hpColor = hpRatio > 0.5 ? '#4CAF50' : hpRatio > 0.25 ? '#FF9800' : '#F44336';
    const hpGrad = ctx.createLinearGradient(barX, barY, barX + barWidth * hpRatio, barY);
    hpGrad.addColorStop(0, hpColor);
    hpGrad.addColorStop(1, hpColor);
    ctx.fillStyle = hpGrad;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * hpRatio, barHeight, 5);
    ctx.fill();

    // HP shine
    ctx.fillStyle = COLORS.hpBarShine;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * hpRatio, barHeight * 0.4, [5, 5, 0, 0]);
    ctx.fill();

    // HP border
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 5);
    ctx.stroke();

    // HP text
    ctx.fillStyle = COLORS.white;
    ctx.font = `bold ${Math.round(11 * scale)}px Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(`${this.hp} / ${this.maxHp}`, screenX, barY + barHeight / 2);
  }
}
