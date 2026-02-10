import { GATE_WIDTH, GATE_HEIGHT, COLORS, TRACK_WIDTH } from '../utils/constants';

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
  const gap = 5;
  return [
    {
      type: gateTypes[0].type,
      value: gateTypes[0].value,
      x: -(TRACK_WIDTH / 4) - gap / 2,
      y,
      side: 'left',
      passed: false,
    },
    {
      type: gateTypes[1].type,
      value: gateTypes[1].value,
      x: TRACK_WIDTH / 4 + gap / 2,
      y,
      side: 'right',
      passed: false,
    },
  ];
}

function getGateOptions(level: number, rng: () => number): { type: GateType; value: number }[] {
  const goodTypes: { type: GateType; value: number }[] = [];
  const badTypes: { type: GateType; value: number }[] = [];

  // Good gates
  const addVal = Math.floor(5 + rng() * (10 + level * 2));
  goodTypes.push({ type: 'add', value: addVal });
  const mulVal = 2 + Math.floor(rng() * Math.min(level, 4));
  goodTypes.push({ type: 'multiply', value: mulVal });

  // Bad gates
  const subVal = Math.floor(3 + rng() * (5 + level));
  badTypes.push({ type: 'subtract', value: subVal });
  const divVal = 2 + Math.floor(rng() * Math.min(level, 3));
  badTypes.push({ type: 'divide', value: divVal });

  // Pick one good, one bad
  const good = goodTypes[Math.floor(rng() * goodTypes.length)];
  const bad = badTypes[Math.floor(rng() * badTypes.length)];

  // Sometimes both can be good (rare) or both bad (tricky)
  if (rng() < 0.15 && level > 3) {
    // Both good but different values
    const good2 = goodTypes[Math.floor(rng() * goodTypes.length)];
    return rng() < 0.5 ? [good, good2] : [good2, good];
  }
  if (rng() < 0.1 && level > 5) {
    // Both bad - must pick least worst
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
    case 'multiply': return `×${gate.value}`;
    case 'subtract': return `-${gate.value}`;
    case 'divide': return `÷${gate.value}`;
  }
}

export function renderGate(
  ctx: CanvasRenderingContext2D,
  gate: GateData,
  cameraY: number,
  scale: number
) {
  if (gate.passed) return;

  const screenX = ctx.canvas.width / 2 + gate.x * scale;
  const screenY = (gate.y - cameraY) * scale;

  if (screenY < -100 || screenY > ctx.canvas.height + 100) return;

  const w = GATE_WIDTH * scale;
  const h = GATE_HEIGHT * scale;
  const good = isGoodGate(gate);

  // Gate background
  ctx.fillStyle = good ? COLORS.gateGoodBg : COLORS.gateBadBg;
  const radius = 8 * scale;
  ctx.beginPath();
  ctx.moveTo(screenX - w / 2 + radius, screenY - h / 2);
  ctx.lineTo(screenX + w / 2 - radius, screenY - h / 2);
  ctx.quadraticCurveTo(screenX + w / 2, screenY - h / 2, screenX + w / 2, screenY - h / 2 + radius);
  ctx.lineTo(screenX + w / 2, screenY + h / 2 - radius);
  ctx.quadraticCurveTo(screenX + w / 2, screenY + h / 2, screenX + w / 2 - radius, screenY + h / 2);
  ctx.lineTo(screenX - w / 2 + radius, screenY + h / 2);
  ctx.quadraticCurveTo(screenX - w / 2, screenY + h / 2, screenX - w / 2, screenY + h / 2 - radius);
  ctx.lineTo(screenX - w / 2, screenY - h / 2 + radius);
  ctx.quadraticCurveTo(screenX - w / 2, screenY - h / 2, screenX - w / 2 + radius, screenY - h / 2);
  ctx.closePath();
  ctx.fill();

  // Border
  ctx.strokeStyle = good ? COLORS.gateGood : COLORS.gateBad;
  ctx.lineWidth = 3 * scale;
  ctx.stroke();

  // Label
  ctx.fillStyle = COLORS.white;
  ctx.font = `bold ${Math.round(22 * scale)}px Arial`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(getGateLabel(gate), screenX, screenY);
}
