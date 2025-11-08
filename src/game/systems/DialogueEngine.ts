import { Dialogues, Choice } from '../data/story';
import { GameState } from './GameState';
import { Quests } from '../data/story';

export class DialogueEngine {
  private state = GameState.getInstance();
  private currentNode: string | null = null;
  private lineIndex = 0;

  isActive() {
    return this.currentNode !== null;
  }

  start(treeId: string) {
    if (!Dialogues[treeId]) {
      return;
    }
    this.currentNode = treeId;
    this.lineIndex = 0;
    this.presentLine();
  }

  next() {
    if (!this.currentNode) {
      return;
    }
    const dialogue = Dialogues[this.currentNode];
    if (!dialogue) {
      return;
    }
    const line = dialogue.lines[this.lineIndex];
    if (line?.choices) {
      this.state.emit('dialogue-choices', { choices: line.choices });
      return;
    }
    this.lineIndex += 1;
    if (this.lineIndex >= dialogue.lines.length) {
      this.endDialogue();
    } else {
      this.presentLine();
    }
  }

  choose(choice: Choice) {
    if (choice.effects?.quest) {
      const questId = choice.effects.quest as string;
      if (Quests[questId]) {
        this.state.startQuest(questId);
      }
    }
    if (choice.next) {
      this.start(choice.next);
    } else {
      this.endDialogue();
    }
  }

  private presentLine() {
    if (!this.currentNode) {
      return;
    }
    const dialogue = Dialogues[this.currentNode];
    const line = dialogue?.lines[this.lineIndex];
    if (!line) {
      this.endDialogue();
      return;
    }
    this.state.emit('dialogue', { speaker: line.speaker, text: line.text, mood: line.mood });
    if (line.choices) {
      this.state.emit('dialogue-choices', { choices: line.choices });
    } else {
      this.state.emit('dialogue-choices', { choices: [] });
    }
  }

  private endDialogue() {
    this.state.emit('dialogue', { speaker: '', text: '', mood: undefined });
    this.state.emit('dialogue-choices', { choices: [] });
    this.currentNode = null;
    this.lineIndex = 0;
  }

  progress() {
    this.next();
  }
}
