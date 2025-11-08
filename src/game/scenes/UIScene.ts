import * as Phaser from 'phaser';
import gsap from 'gsap';
import { GameState, QuestProgress } from '../systems/GameState';
import { Quests } from '../data/story';
import type { Choice } from '../data/story';

export class UIScene extends Phaser.Scene {
  private state = GameState.getInstance();

  private dialogueContainer: HTMLElement | null = null;
  private dialogueChoices: HTMLElement | null = null;
  private questList: HTMLElement | null = null;
  private inventoryList: HTMLElement | null = null;
  private healthLabel: HTMLElement | null = null;

  private subscriptions: Array<{ event: string; handler: (payload: any) => void }> = [];

  constructor() {
    super('ui');
  }

  create() {
    this.dialogueContainer = document.getElementById('ui-dialogue-text');
    this.dialogueChoices = document.getElementById('ui-dialogue-choices');
    this.questList = document.getElementById('ui-quest-log');
    this.inventoryList = document.getElementById('ui-inventory');
    this.healthLabel = document.getElementById('ui-health');

    const listeners = {
      dialogue: (payload: { speaker: string; text: string; mood?: string }) => this.onDialogue(payload),
      'dialogue-choices': (payload: { choices: Choice[] }) => this.onDialogueChoices(payload.choices),
      'inventory-updated': (payload: { name: string; description: string; id: string }[]) =>
        this.renderInventory(payload),
      'quest-updated': (payload: QuestProgress) => this.renderQuest(payload),
      'player-health': (payload: { current: number; max: number }) => this.renderHealth(payload)
    } as const;

    (Object.keys(listeners) as Array<keyof typeof listeners>).forEach(event => {
      const handler = listeners[event];
      this.state.on(event as any, handler, this);
      this.subscriptions.push({ event, handler });
    });

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, this.shutdown, this);
  }

  private onDialogue({ speaker, text, mood }: { speaker: string; text: string; mood?: string }) {
    if (!this.dialogueContainer) {
      return;
    }
    const moodColor = mood === 'urgent' ? '#ff5f5f' : mood === 'tender' ? '#ffd1dc' : '#f8fdda';
    const formatted = speaker ? `<strong style="color:${moodColor}">${speaker}:</strong> ${text}` : text;
    gsap.to(this.dialogueContainer, {
      duration: 0.18,
      opacity: 0,
      onComplete: () => {
        this.dialogueContainer!.innerHTML = formatted;
        gsap.to(this.dialogueContainer, { duration: 0.25, opacity: 1 });
      }
    });
  }

  private onDialogueChoices(choices: Choice[]) {
    if (!this.dialogueChoices) {
      return;
    }
    this.dialogueChoices.innerHTML = '';
    choices.forEach(choice => {
      const button = document.createElement('button');
      button.textContent = choice.text;
      button.onclick = () => {
        this.state.emit('dialogue-choice-selected', choice);
      };
      this.dialogueChoices!.appendChild(button);
    });
    gsap.fromTo(
      this.dialogueChoices,
      { opacity: 0, y: 8 },
      { opacity: 1, y: 0, duration: 0.3, ease: 'power2.out' }
    );
  }

  private renderInventory(items: { name: string; description: string; id: string }[]) {
    if (!this.inventoryList) {
      return;
    }
    this.inventoryList.innerHTML = '';
    items.forEach(item => {
      const li = document.createElement('li');
      li.innerHTML = `<strong>${item.name}</strong><br/><small>${item.description}</small>`;
      this.inventoryList!.appendChild(li);
    });
  }

  private renderQuest(progress: QuestProgress) {
    if (!this.questList) {
      return;
    }
    const quest = Quests[progress.id];
    if (!quest) {
      return;
    }

    const completed = progress.completed || progress.stageIndex >= quest.stages.length;
    const stage = quest.stages[Math.min(progress.stageIndex, quest.stages.length - 1)];
    const existing = this.questList.querySelector(`[data-quest="${quest.id}"]`) as HTMLLIElement | null;

    const content = `<strong>${quest.title}</strong><br/><small>${
      completed ? 'Quest complete!' : stage?.description ?? ''
    }</small>`;
    if (existing) {
      existing.innerHTML = content;
    } else {
      const li = document.createElement('li');
      li.dataset.quest = quest.id;
      li.innerHTML = content;
      this.questList.appendChild(li);
    }

    gsap.fromTo(
      this.questList,
      { borderColor: 'rgba(248,255,206,0.3)' },
      { borderColor: 'rgba(248,255,206,0.8)', duration: 0.35, yoyo: true, repeat: 1 }
    );
  }

  private renderHealth({ current, max }: { current: number; max: number }) {
    if (!this.healthLabel) {
      return;
    }
    this.healthLabel.textContent = `Health: ${current} / ${max}`;
    gsap.fromTo(this.healthLabel, { scale: 1.05 }, { scale: 1, duration: 0.2, ease: 'power1.out' });
  }

  shutdown() {
    this.subscriptions.forEach(({ event, handler }) => {
      this.state.off(event as any, handler, this);
    });
    this.subscriptions = [];
  }
}
