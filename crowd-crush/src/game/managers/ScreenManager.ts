export type Screen = 'title' | 'playing' | 'levelComplete' | 'gameOver' | 'upgrades' | 'bossClash' | 'clash';

export type ScreenChangeCallback = (screen: Screen, data?: Record<string, unknown>) => void;

export class ScreenManager {
  currentScreen: Screen = 'title';
  private listeners: ScreenChangeCallback[] = [];
  screenData: Record<string, unknown> = {};

  onChange(cb: ScreenChangeCallback) {
    this.listeners.push(cb);
  }

  removeListener(cb: ScreenChangeCallback) {
    this.listeners = this.listeners.filter(l => l !== cb);
  }

  setScreen(screen: Screen, data?: Record<string, unknown>) {
    this.currentScreen = screen;
    this.screenData = data || {};
    for (const cb of this.listeners) {
      cb(screen, data);
    }
  }
}
