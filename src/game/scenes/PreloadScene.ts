import * as Phaser from 'phaser';
import { AudioManager } from '../systems/AudioManager';

export class PreloadScene extends Phaser.Scene {
  constructor() {
    super('preload');
  }

  create() {
    this.createAnimations();
    this.scene.start('world', { zone: 'forest' });
    this.scene.launch('ui');

    this.input.once('pointerdown', () => {
      AudioManager.getInstance().playAmbience();
    });
  }

  private createAnimations() {
    const anims = this.anims;

    anims.create({
      key: 'hero-walk-down',
      frames: [
        { key: 'hero-walk-down-1' },
        { key: 'hero-walk-down-2' }
      ],
      frameRate: 6,
      repeat: -1
    });

    anims.create({
      key: 'hero-walk-side',
      frames: [
        { key: 'hero-walk-side-1' },
        { key: 'hero-walk-side-2' }
      ],
      frameRate: 6,
      repeat: -1
    });

    anims.create({ key: 'hero-idle-down', frames: [{ key: 'hero-idle-down' }], frameRate: 2, repeat: -1 });
    anims.create({ key: 'hero-idle-up', frames: [{ key: 'hero-idle-up' }], frameRate: 2, repeat: -1 });
    anims.create({ key: 'hero-attack', frames: [{ key: 'hero-attack' }], frameRate: 12, repeat: 0 });

    anims.create({
      key: 'enemy-wraith-idle',
      frames: [
        { key: 'enemy-wraith' },
        { key: 'enemy-wraith-glow' }
      ],
      frameRate: 3,
      yoyo: true,
      repeat: -1
    });

    anims.create({
      key: 'weapon-slash',
      frames: [{ key: 'slash-0' }, { key: 'slash-1' }, { key: 'slash-2' }],
      frameRate: 18,
      repeat: 0
    });
  }
}
