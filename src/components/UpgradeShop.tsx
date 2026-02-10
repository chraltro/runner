'use client';

import { ProgressManager, UpgradeState } from '@/game/managers/ProgressManager';
import { useState } from 'react';

interface UpgradeShopProps {
  progress: ProgressManager;
  coins: number;
  onPurchase: (key: string) => boolean;
  onPlay: () => void;
  onBack: () => void;
}

const UPGRADE_INFO: { key: keyof UpgradeState; label: string; desc: string; icon: string }[] = [
  { key: 'startingUnits', label: 'Starting Units', desc: '+5 units per level', icon: '👥' },
  { key: 'unitPower', label: 'Unit Power', desc: '+0.2x clash power', icon: '⚔️' },
  { key: 'speed', label: 'Speed', desc: '+10% forward speed', icon: '💨' },
  { key: 'income', label: 'Income', desc: '+30% coin earnings', icon: '💰' },
];

export default function UpgradeShop({ progress, coins, onPurchase, onPlay, onBack }: UpgradeShopProps) {
  const [, forceUpdate] = useState(0);

  const handlePurchase = (key: string) => {
    const success = onPurchase(key);
    if (success) {
      forceUpdate(v => v + 1);
    }
  };

  return (
    <div className="absolute inset-0 flex flex-col z-30 bg-gray-900/98"
      style={{
        paddingTop: 'env(safe-area-inset-top, 12px)',
        paddingBottom: 'env(safe-area-inset-bottom, 12px)',
      }}>
      {/* Header */}
      <div className="flex justify-between items-center px-4 pt-4 pb-2">
        <button
          onClick={onBack}
          onTouchEnd={(e) => { e.preventDefault(); onBack(); }}
          className="text-gray-400 text-base font-bold px-3 py-2"
        >
          ← BACK
        </button>
        <div className="flex items-center gap-2">
          <span className="text-yellow-400 text-lg">&#9679;</span>
          <span className="text-white text-xl font-bold">{coins}</span>
        </div>
      </div>

      <h2 className="text-2xl font-bold text-white text-center mb-4">UPGRADES</h2>

      {/* Upgrade grid */}
      <div className="flex-1 overflow-y-auto px-4 pb-4">
        <div className="grid grid-cols-1 gap-3">
          {UPGRADE_INFO.map(({ key, label, desc, icon }) => {
            const cost = progress.getUpgradeCost(key);
            const currentLevel = progress.data.upgrades[key];
            const canAfford = coins >= cost;

            return (
              <div key={key} className="bg-gray-800 rounded-xl p-4 border border-gray-700">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{icon}</span>
                    <div>
                      <h3 className="text-white font-bold text-base">{label}</h3>
                      <p className="text-gray-400 text-sm">{desc}</p>
                      <p className="text-cyan-400 text-xs mt-0.5">Level {currentLevel}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => handlePurchase(key)}
                    onTouchEnd={(e) => { e.preventDefault(); handlePurchase(key); }}
                    disabled={!canAfford}
                    className={`px-4 py-2 rounded-lg font-bold text-sm min-w-[80px] transition-colors ${
                      canAfford
                        ? 'bg-yellow-500 hover:bg-yellow-600 active:bg-yellow-700 text-black'
                        : 'bg-gray-600 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {cost}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Play button */}
      <div className="px-4 pb-4">
        <button
          onClick={onPlay}
          onTouchEnd={(e) => { e.preventDefault(); onPlay(); }}
          className="w-full py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-xl font-bold rounded-xl transition-colors"
        >
          PLAY
        </button>
      </div>
    </div>
  );
}
