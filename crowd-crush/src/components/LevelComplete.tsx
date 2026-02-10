'use client';

interface LevelCompleteProps {
  coinsEarned: number;
  level: number;
  onNextLevel: () => void;
  onUpgrades: () => void;
}

export default function LevelComplete({ coinsEarned, level, onNextLevel, onUpgrades }: LevelCompleteProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-2xl p-8 mx-6 w-full max-w-sm text-center border border-gray-700">
        <h2 className="text-3xl font-bold text-green-400 mb-2">LEVEL {level}</h2>
        <h3 className="text-xl font-bold text-white mb-6">COMPLETE!</h3>

        <div className="bg-gray-800 rounded-xl p-4 mb-6">
          <p className="text-gray-400 text-sm mb-1">Coins Earned</p>
          <p className="text-yellow-400 text-3xl font-bold">+{coinsEarned}</p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onNextLevel}
            onTouchEnd={(e) => { e.preventDefault(); onNextLevel(); }}
            className="w-full py-4 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white text-lg font-bold rounded-xl transition-colors"
          >
            NEXT LEVEL
          </button>
          <button
            onClick={onUpgrades}
            onTouchEnd={(e) => { e.preventDefault(); onUpgrades(); }}
            className="w-full py-3 bg-gray-700 hover:bg-gray-600 active:bg-gray-500 text-white text-base font-bold rounded-xl transition-colors"
          >
            UPGRADES
          </button>
        </div>
      </div>
    </div>
  );
}
