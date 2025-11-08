import { Howl } from 'howler';
import { synthToneBase64 } from './AudioSynth';

const backgroundLoop = synthToneBase64({ frequency: 110, duration: 2, type: 'sine', volume: 0.2 });
const dangerLoop = synthToneBase64({ frequency: 180, duration: 1.5, type: 'sawtooth', volume: 0.15 });
const attackSfx = synthToneBase64({ frequency: 420, duration: 0.2, type: 'square', volume: 0.3 });
const pickupSfx = synthToneBase64({ frequency: 720, duration: 0.25, type: 'square', volume: 0.2 });

export class AudioManager {
  private static instance: AudioManager;
  private ambience: Howl;
  private battle: Howl;
  private attack: Howl;
  private pickup: Howl;

  private constructor() {
    this.ambience = new Howl({ src: [backgroundLoop], loop: true, volume: 0.45 });
    this.battle = new Howl({ src: [dangerLoop], loop: true, volume: 0.0 });
    this.attack = new Howl({ src: [attackSfx], loop: false, volume: 0.7 });
    this.pickup = new Howl({ src: [pickupSfx], loop: false, volume: 0.5 });
  }

  static getInstance() {
    if (!AudioManager.instance) {
      AudioManager.instance = new AudioManager();
    }
    return AudioManager.instance;
  }

  playAmbience() {
    if (!this.ambience.playing()) {
      this.ambience.play();
    }
  }

  enterBattle() {
    if (!this.battle.playing()) {
      this.battle.play();
    }
    this.battle.fade(this.battle.volume(), 0.6, 600);
  }

  exitBattle() {
    this.battle.fade(this.battle.volume(), 0.0, 600);
  }

  playAttack() {
    this.attack.play();
  }

  playPickup() {
    this.pickup.play();
  }
}
