'use client';

interface GameOverProps {
  onRetry: () => void;
  onUpgrades: () => void;
}

export default function GameOver({ onRetry, onUpgrades }: GameOverProps) {
  return (
    <div className="absolute inset-0 flex items-center justify-center z-30 bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900/95 rounded-2xl p-8 mx-6 w-full max-w-sm text-center border border-gray-700">
        <h2 className="text-3xl font-bold text-red-400 mb-2">GAME OVER</h2>
        <p className="text-gray-400 mb-8">Your crowd was wiped out!</p>

        <div className="flex flex-col gap-3">
          <button
            onClick={onRetry}
            onTouchEnd={(e) => { e.preventDefault(); onRetry(); }}
            className="w-full py-4 bg-red-500 hover:bg-red-600 active:bg-red-700 text-white text-lg font-bold rounded-xl transition-colors"
          >
            RETRY
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
