'use client';

import { formatNumber } from '@/game/utils/helpers';

interface GameHUDProps {
  unitCount: number;
  level: number;
  coins: number;
}

export default function GameHUD({ unitCount, level, coins }: GameHUDProps) {
  return (
    <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none"
      style={{ paddingTop: 'env(safe-area-inset-top, 12px)' }}>
      <div className="flex justify-between items-start px-4 pt-3">
        {/* Level */}
        <div className="bg-black/50 rounded-xl px-3 py-1.5 backdrop-blur-sm">
          <span className="text-white text-sm font-bold">LVL {level}</span>
        </div>

        {/* Unit count */}
        <div className="bg-black/50 rounded-xl px-4 py-1.5 backdrop-blur-sm">
          <span className="text-cyan-400 text-lg font-bold">{formatNumber(unitCount)}</span>
        </div>

        {/* Coins */}
        <div className="bg-black/50 rounded-xl px-3 py-1.5 backdrop-blur-sm flex items-center gap-1.5">
          <span className="text-yellow-400 text-base">&#9679;</span>
          <span className="text-white text-sm font-bold">{formatNumber(coins)}</span>
        </div>
      </div>
    </div>
  );
}
