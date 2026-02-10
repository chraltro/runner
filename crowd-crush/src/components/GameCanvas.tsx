'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { Game } from '@/game/Game';
import { Screen } from '@/game/managers/ScreenManager';
import { ProgressManager } from '@/game/managers/ProgressManager';
import GameHUD from './GameHUD';
import LevelComplete from './LevelComplete';
import GameOver from './GameOver';
import UpgradeShop from './UpgradeShop';

export default function GameCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gameRef = useRef<Game | null>(null);
  const [screen, setScreen] = useState<Screen>('title');
  const [screenData, setScreenData] = useState<Record<string, unknown>>({});
  const [coins, setCoins] = useState(0);
  const [level, setLevel] = useState(1);
  const [unitCount, setUnitCount] = useState(0);
  const [progressManager, setProgressManager] = useState<ProgressManager | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const game = new Game(canvas);
    gameRef.current = game;
    setProgressManager(game.progress);

    game.screens.onChange((newScreen, data) => {
      setScreen(newScreen);
      setScreenData(data || {});
      setCoins(game.progress.data.coins);
      setLevel(game.progress.data.highestLevel);
    });

    game.start();

    // HUD update interval
    const hudInterval = setInterval(() => {
      if (game.screens.currentScreen === 'playing') {
        setUnitCount(game.getUnitCount());
        setCoins(game.progress.data.coins);
      }
    }, 100);

    return () => {
      clearInterval(hudInterval);
      game.destroy();
      gameRef.current = null;
    };
  }, []);

  const handleStartGame = useCallback(() => {
    gameRef.current?.startLevel();
  }, []);

  const handleNextLevel = useCallback(() => {
    gameRef.current?.nextLevel();
  }, []);

  const handleRetry = useCallback(() => {
    gameRef.current?.retryLevel();
  }, []);

  const handleGoToUpgrades = useCallback(() => {
    gameRef.current?.goToUpgrades();
  }, []);

  const handleGoToTitle = useCallback(() => {
    gameRef.current?.goToTitle();
  }, []);

  const handlePurchaseUpgrade = useCallback((key: string) => {
    const game = gameRef.current;
    if (!game) return false;
    const result = game.progress.purchaseUpgrade(key as 'startingUnits' | 'unitPower' | 'speed' | 'income');
    setCoins(game.progress.data.coins);
    return result;
  }, []);

  return (
    <div className="fixed inset-0 w-full h-[100dvh] overflow-hidden" style={{ touchAction: 'none' }}>
      <canvas
        ref={canvasRef}
        className="absolute inset-0 w-full h-full"
        style={{ touchAction: 'none' }}
      />

      {/* UI Overlay */}
      {screen === 'playing' && (
        <GameHUD
          unitCount={unitCount}
          level={level}
          coins={coins}
        />
      )}

      {screen === 'levelComplete' && (
        <LevelComplete
          coinsEarned={(screenData.coins as number) || 0}
          level={(screenData.level as number) || level}
          onNextLevel={handleNextLevel}
          onUpgrades={handleGoToUpgrades}
        />
      )}

      {screen === 'gameOver' && (
        <GameOver
          onRetry={handleRetry}
          onUpgrades={handleGoToUpgrades}
        />
      )}

      {screen === 'upgrades' && progressManager && (
        <UpgradeShop
          progress={progressManager}
          coins={coins}
          onPurchase={handlePurchaseUpgrade}
          onPlay={handleStartGame}
          onBack={handleGoToTitle}
        />
      )}
    </div>
  );
}
