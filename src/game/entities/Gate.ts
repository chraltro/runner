import { GATE_WIDTH, GATE_HEIGHT, GATE_GAP, GATE_PILLAR_WIDTH, COLORS } from '../utils/constants';
import { Renderer } from '../systems/Renderer';

export type GateType = 'add' | 'multiply' | 'subtract' | 'divide';

export interface GateData {
  type: GateType;
  value: number;
  x: number;
  y: number;
  side: 'left' | 'right';
  passed: boolean;
}

export function createGatePair(y: number, level: number, rng: () => number): [GateData, GateData] {
  const gateTypes = getGateOptions(level, rng);
  const halfGap = GATE_GAP / 2;
  const gateCenter = GATE_WIDTH / 2;
  return [
    {
      type: gateTypes[0].type,
      value: gateTypes[0].value,
      x: -(gateCenter + halfGap),
      y,
      side: 'left',
      passed: false,
    },
    {
      type: gateTypes[1].type,
      value: gateTypes[1].value,
      x: gateCenter + halfGap,
      y,
      side: 'right',
      passed: false,
    },
  ];
}

function getGateOptions(level: number, rng: () => number): { type: GateType; value: number }[] {
  const goodTypes: { type: GateType; value: number }[] = [];
  const badTypes: { type: GateType; value: number }[] = [];

  const addVal = Math.floor(5 + rng() * (10 + level * 2));
  goodTypes.push({ type: 'add', value: addVal });
  const mulVal = 2 + Math.floor(rng() * Math.min(level, 4));
  goodTypes.push({ type: 'multiply', value: mulVal });

  const subVal = Math.floor(3 + rng() * (5 + level));
  badTypes.push({ type: 'subtract', value: subVal });
  const divVal = 2 + Math.floor(rng() * Math.min(level, 3));
  badTypes.push({ type: 'divide', value: divVal });

  const good = goodTypes[Math.floor(rng() * goodTypes.length)];
  const bad = badTypes[Math.floor(rng() * badTypes.length)];

  if (rng() < 0.15 && level > 3) {
    const good2 = goodTypes[Math.floor(rng() * goodTypes.length)];
    return rng() < 0.5 ? [good, good2] : [good2, good];
  }
  if (rng() < 0.1 && level > 5) {
    const bad2 = badTypes[Math.floor(rng() * badTypes.length)];
    return rng() < 0.5 ? [bad, bad2] : [bad2, bad];
  }

  return rng() < 0.5 ? [good, bad] : [bad, good];
}

export function isGoodGate(gate: GateData): boolean {
  return gate.type === 'add' || gate.type === 'multiply';
}

export function getGateLabel(gate: GateData): string {
  switch (gate.type) {
    case 'add': return `+${gate.value}`;
    case 'multiply': return `\u00D7${gate.value}`;
    case 'subtract': return `-${gate.value}`;
    case 'divide': return `\u00F7${gate.value}`;
  }
}

export function renderGate(renderer: Renderer, gate: GateData, cameraY: number) {
  if (gate.passed) return;

  const ctx = renderer.ctx;
  const scale = renderer.scale;
  const screenX = renderer.worldToScreenX(gate.x);
  const screenY = renderer.worldToScreenY(gate.y, cameraY);

  if (screenY < -120 || screenY > renderer.height + 120) return;

  const w = GATE_WIDTH * scale;
  const h = GATE_HEIGHT * scale;
  const good = isGoodGate(gate);
  const pillarW = GATE_PILLAR_WIDTH * scale;
  const radius = 10 * scale;

  // Glow behind gate
  ctx.shadowColor = good ? COLORS.gateGoodGlow : COLORS.gateBadGlow;
  ctx.shadowBlur = 15 * scale;

  // Main gate body with gradient
  const grad = ctx.createLinearGradient(screenX - w / 2, screenY - h / 2, screenX + w / 2, screenY + h / 2);
  grad.addColorStop(0, good ? COLORS.gateGoodStart : COLORS.gateBadStart);
  grad.addColorStop(1, good ? COLORS.gateGoodEnd : COLORS.gateBadEnd);

  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.roundRect(screenX - w / 2, screenY - h / 2, w, h, radius);
  ctx.fill();

  ctx.shadowBlur = 0;

  // Top shine
  ctx.fillStyle = 'rgba(255,255,255,0.15)';
  ctx.beginPath();
  ctx.roundRect(screenX - w / 2 + 2, screenY - h / 2 + 2, w - 4, h * 0.4, [radius, radius, 0, 0]);
  ctx.fill();

  // Border
  ctx.strokeStyle = good ? COLORS.gateGoodBorder : COLORS.gateBadBorder;
  ctx.lineWidth = 2.5 * scale;
  ctx.beginPath();
  ctx.roundRect(screenX - w / 2, screenY - h / 2, w, h, radius);
  ctx.stroke();

  // Side pillars
  const pillarH = h + 16 * scale;
  const pillarX1 = screenX - w / 2 - pillarW / 2;
  const pillarX2 = screenX + w / 2 - pillarW / 2;

  // Pillar shadow
  ctx.fillStyle = COLORS.gatePillarShadow;
  ctx.fillRect(pillarX1 + 1, screenY - pillarH / 2 + 1, pillarW, pillarH);
  ctx.fillRect(pillarX2 + 1, screenY - pillarH / 2 + 1, pillarW, pillarH);

  // Pillar body
  ctx.fillStyle = COLORS.gatePillar;
  ctx.fillRect(pillarX1, screenY - pillarH / 2, pillarW, pillarH);
  ctx.fillRect(pillarX2, screenY - pillarH / 2, pillarW, pillarH);

  // Pillar caps
  ctx.fillStyle = good ? COLORS.gateGoodStart : COLORS.gateBadStart;
  const capH = 6 * scale;
  ctx.beginPath();
  ctx.roundRect(pillarX1 - 2, screenY - pillarH / 2 - capH / 2, pillarW + 4, capH, 3);
  ctx.fill();
  ctx.beginPath();
  ctx.roundRect(pillarX2 - 2, screenY - pillarH / 2 - capH / 2, pillarW + 4, capH, 3);
  ctx.fill();

  // Label text with shadow
  const label = getGateLabel(gate);
  const fontSize = Math.round(26 * scale);
  ctx.font = `bold ${fontSize}px Arial, sans-serif`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  // Text shadow
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fillText(label, screenX + 1, screenY + 1);

  // Text
  ctx.fillStyle = COLORS.white;
  ctx.fillText(label, screenX, screenY);
}
