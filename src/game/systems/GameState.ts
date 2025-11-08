import * as Phaser from 'phaser';
import { Choice, Quests } from '../data/story';
import { WorldZones } from '../data/worldMaps';

export type InventoryItem = {
  id: string;
  name: string;
  description: string;
};

export interface QuestProgress {
  id: string;
  stageIndex: number;
  completed: boolean;
}

type GameEventMap = {
  'quest-updated': QuestProgress;
  'inventory-updated': InventoryItem[];
  'dialogue': { speaker: string; text: string; mood?: string };
  'dialogue-choices': { choices: Choice[] };
  'dialogue-choice-selected': Choice;
  'zone-changed': { zone: string };
  'combat-state': { engaged: boolean };
  'player-health': { current: number; max: number };
};

export class GameState {
  private static instance: GameState;
  private emitter = new Phaser.Events.EventEmitter();

  currentZone = 'forest';
  playerPosition = { x: 18 * 32, y: 18 * 32 };
  health = 100;
  maxHealth = 100;
  inventory: InventoryItem[] = [];
  quests: Record<string, QuestProgress> = {};
  defeatedEnemies: Record<string, number> = {};

  private constructor() {}

  static getInstance() {
    if (!GameState.instance) {
      GameState.instance = new GameState();
    }
    return GameState.instance;
  }

  on<T extends keyof GameEventMap>(event: T, callback: (payload: GameEventMap[T]) => void, context?: unknown) {
    this.emitter.on(event, callback, context);
  }

  off<T extends keyof GameEventMap>(event: T, callback: (payload: GameEventMap[T]) => void, context?: unknown) {
    this.emitter.off(event, callback, context);
  }

  emit<T extends keyof GameEventMap>(event: T, payload: GameEventMap[T]) {
    this.emitter.emit(event, payload);
  }

  setZone(zone: string, position?: { x: number; y: number }) {
    if (!WorldZones[zone]) {
      return;
    }
    this.currentZone = zone;
    if (position) {
      this.playerPosition = position;
    }
    this.emit('zone-changed', { zone });
    this.checkQuestRequirements({ type: 'location', value: zone });
  }

  damage(amount: number) {
    this.health = Math.max(0, this.health - amount);
    this.emit('player-health', { current: this.health, max: this.maxHealth });
  }

  heal(amount: number) {
    this.health = Math.min(this.maxHealth, this.health + amount);
    this.emit('player-health', { current: this.health, max: this.maxHealth });
  }

  addItem(item: InventoryItem) {
    if (this.inventory.find(i => i.id === item.id)) {
      return;
    }
    this.inventory.push(item);
    this.emit('inventory-updated', [...this.inventory]);
    this.checkQuestRequirements({ type: 'item', value: item.id });
  }

  defeatEnemy(enemyType: string) {
    this.defeatedEnemies[enemyType] = (this.defeatedEnemies[enemyType] ?? 0) + 1;
    this.checkQuestRequirements({ type: 'defeat', value: enemyType });
  }

  startQuest(id: string) {
    if (this.quests[id]) {
      return;
    }
    this.quests[id] = { id, stageIndex: 0, completed: false };
    this.emit('quest-updated', this.quests[id]);
  }

  advanceQuest(id: string) {
    const quest = Quests[id];
    const progress = this.quests[id];
    if (!quest || !progress || progress.completed) {
      return;
    }
    progress.stageIndex += 1;
    if (progress.stageIndex >= quest.stages.length) {
      progress.completed = true;
    }
    this.emit('quest-updated', { ...progress });
  }

  checkQuestRequirements(requirement: { type: 'item' | 'location' | 'defeat'; value: string }) {
    Object.values(this.quests).forEach(progress => {
      const quest = Quests[progress.id];
      if (!quest) {
        return;
      }
      const stage = quest.stages[progress.stageIndex];
      if (!stage || !stage.requirement) {
        return;
      }
      if (stage.requirement.type === requirement.type && stage.requirement.value === requirement.value) {
        this.advanceQuest(progress.id);
      }
    });
  }
}
