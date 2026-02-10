import { UPGRADE_BASE_COST, UPGRADE_COST_MULTIPLIER, COINS_PER_UNIT } from '../utils/constants';

const STORAGE_KEY = 'crowd_crush_save';

export interface UpgradeState {
  startingUnits: number;
  unitPower: number;
  speed: number;
  income: number;
}

export interface SaveData {
  coins: number;
  highestLevel: number;
  upgrades: UpgradeState;
}

const DEFAULT_SAVE: SaveData = {
  coins: 0,
  highestLevel: 1,
  upgrades: {
    startingUnits: 0,
    unitPower: 0,
    speed: 0,
    income: 0,
  },
};

export class ProgressManager {
  data: SaveData;

  constructor() {
    this.data = this.load();
  }

  private load(): SaveData {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed = JSON.parse(raw);
        return { ...DEFAULT_SAVE, ...parsed, upgrades: { ...DEFAULT_SAVE.upgrades, ...parsed.upgrades } };
      }
    } catch {
      // ignore
    }
    return { ...DEFAULT_SAVE, upgrades: { ...DEFAULT_SAVE.upgrades } };
  }

  save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch {
      // ignore
    }
  }

  getStartingUnits(): number {
    return 10 + this.data.upgrades.startingUnits * 5;
  }

  getUnitPower(): number {
    return 1.0 + this.data.upgrades.unitPower * 0.2;
  }

  getSpeedBonus(): number {
    return 1.0 + this.data.upgrades.speed * 0.1;
  }

  getIncomeMultiplier(): number {
    return 1.0 + this.data.upgrades.income * 0.3;
  }

  getUpgradeCost(upgradeKey: keyof UpgradeState): number {
    const level = this.data.upgrades[upgradeKey];
    return Math.floor(UPGRADE_BASE_COST * Math.pow(UPGRADE_COST_MULTIPLIER, level));
  }

  canAffordUpgrade(upgradeKey: keyof UpgradeState): boolean {
    return this.data.coins >= this.getUpgradeCost(upgradeKey);
  }

  purchaseUpgrade(upgradeKey: keyof UpgradeState): boolean {
    const cost = this.getUpgradeCost(upgradeKey);
    if (this.data.coins < cost) return false;
    this.data.coins -= cost;
    this.data.upgrades[upgradeKey]++;
    this.save();
    return true;
  }

  awardCoins(remainingUnits: number): number {
    const earned = Math.floor(remainingUnits * COINS_PER_UNIT * this.getIncomeMultiplier());
    this.data.coins += earned;
    this.save();
    return earned;
  }

  advanceLevel() {
    this.data.highestLevel++;
    this.save();
  }

  reset() {
    this.data = { ...DEFAULT_SAVE, upgrades: { ...DEFAULT_SAVE.upgrades } };
    this.save();
  }
}
