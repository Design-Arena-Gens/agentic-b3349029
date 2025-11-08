import * as Phaser from 'phaser';
import { generateProceduralTextures } from '../systems/ProceduralArt';

export class BootScene extends Phaser.Scene {
  constructor() {
    super('boot');
  }

  preload() {
    generateProceduralTextures(this);
  }

  create() {
    this.scene.start('preload');
  }
}
