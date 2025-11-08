import * as Phaser from 'phaser';
import { WorldZones, WorldZone, WorldEntityConfig, ZoneTransition, TileType } from '../data/worldMaps';
import type { Choice } from '../data/story';
import { GameState } from '../systems/GameState';
import { DialogueEngine } from '../systems/DialogueEngine';
import { AudioManager } from '../systems/AudioManager';

interface EnemyData {
  maxHealth: number;
  health: number;
  subtype: string;
  meta?: Record<string, unknown>;
}

export class WorldScene extends Phaser.Scene {
  private state = GameState.getInstance();
  private dialogue = new DialogueEngine();

  private currentZone!: WorldZone;
  private tileSprites: Phaser.GameObjects.Image[] = [];
  private parallaxLayers: Phaser.GameObjects.Rectangle[] = [];

  private player!: Phaser.Physics.Arcade.Sprite;
  private playerSpeed = 140;
  private invulnerableTimer = 0;

  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private keyW!: Phaser.Input.Keyboard.Key;
  private keyA!: Phaser.Input.Keyboard.Key;
  private keyS!: Phaser.Input.Keyboard.Key;
  private keyD!: Phaser.Input.Keyboard.Key;
  private keyInteract!: Phaser.Input.Keyboard.Key;
  private keyAttack!: Phaser.Input.Keyboard.Key;

  private npcGroup!: Phaser.Physics.Arcade.Group;
  private enemyGroup!: Phaser.Physics.Arcade.Group;
  private itemGroup!: Phaser.Physics.Arcade.Group;
  private propGroup!: Phaser.GameObjects.Group;

  private blockedTiles: Set<TileType> = new Set(['tile-water']);
  private transitionCooldown = 0;
  private attacking = false;
  private onDialogueChoiceBound = (choice: Choice) => this.dialogue.choose(choice);

  constructor() {
    super('world');
  }

  init(data: { zone?: string }) {
    const zoneKey = data.zone ?? this.state.currentZone;
    this.currentZone = WorldZones[zoneKey];
    this.state.setZone(zoneKey, this.state.playerPosition);
  }

  create() {
    const keyboard = this.input.keyboard;
    if (!keyboard) {
      throw new Error('Keyboard manager unavailable.');
    }
    this.cursors = keyboard.createCursorKeys();
    this.keyW = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keyA = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keyS = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keyD = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);
    this.keyInteract = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.E);
    this.keyAttack = keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

    this.npcGroup = this.physics.add.group();
    this.enemyGroup = this.physics.add.group();
    this.itemGroup = this.physics.add.group();
    this.propGroup = this.add.group();

    this.loadZone(this.currentZone.key);

    this.createPlayer();

    this.physics.add.overlap(this.player, this.itemGroup, this.onItemPickup, undefined, this);
    this.physics.add.collider(this.player, this.enemyGroup, this.onEnemyCollide, undefined, this);

    this.state.emit('inventory-updated', [...this.state.inventory]);
    this.state.emit('player-health', { current: this.state.health, max: this.state.maxHealth });

    this.state.on('dialogue-choice-selected', this.onDialogueChoiceBound, this);

    this.events.on(Phaser.Scenes.Events.SHUTDOWN, () => {
      this.tileSprites.forEach(sprite => sprite.destroy());
      this.parallaxLayers.forEach(layer => layer.destroy());
      this.npcGroup.destroy(true);
      this.enemyGroup.destroy(true);
      this.itemGroup.destroy(true);
      this.propGroup.destroy(true);
      this.state.off('dialogue-choice-selected', this.onDialogueChoiceBound, this);
    });
  }

  update(_time: number, delta: number) {
    if (!this.player) {
      return;
    }

    this.transitionCooldown = Math.max(0, this.transitionCooldown - delta);
    this.invulnerableTimer = Math.max(0, this.invulnerableTimer - delta);

    this.handleMovement(delta);
    this.handleZoneTransitions();
    this.updateEnemies(delta);
  }

  private loadZone(zoneKey: string) {
    const zone = WorldZones[zoneKey];
    if (!zone) {
      return;
    }

    this.currentZone = zone;

    this.tileSprites.forEach(tile => tile.destroy());
    this.tileSprites = [];
    this.parallaxLayers.forEach(layer => layer.destroy());
    this.parallaxLayers = [];
    this.npcGroup.clear(true, true);
    this.enemyGroup.clear(true, true);
    this.itemGroup.clear(true, true);
    this.propGroup.clear(true, true);

    const worldWidth = zone.tiles[0].length * 32;
    const worldHeight = zone.tiles.length * 32;
    this.physics.world.setBounds(0, 0, worldWidth, worldHeight);

    zone.parallaxColors.forEach((color, index) => {
      const rect = this.add.rectangle(0, 0, worldWidth * 1.5, worldHeight * 1.5, Phaser.Display.Color.HexStringToColor(color).color);
      rect.setOrigin(0, 0);
      rect.setScrollFactor(0.2 + index * 0.2);
      rect.setDepth(-10 + index);
      rect.setAlpha(0.5 - index * 0.08);
      this.parallaxLayers.push(rect);
    });

    zone.tiles.forEach((row, y) => {
      row.forEach((tile, x) => {
        const sprite = this.add.image(x * 32 + 16, y * 32 + 16, tile);
        sprite.setDepth(y * 0.5);
        this.tileSprites.push(sprite);
      });
    });

    zone.entities.forEach(entity => this.spawnEntity(entity));
  }

  private createPlayer() {
    const position = this.state.playerPosition;
    this.player = this.physics.add.sprite(position.x, position.y, 'hero-idle-down');
    this.player.setSize(24, 28);
    this.player.setOffset(4, 4);
    this.player.setDepth(999);
    this.player.setCollideWorldBounds(true);

    this.cameras.main.startFollow(this.player, true, 0.08, 0.08);
    const bounds = this.physics.world.bounds;
    this.cameras.main.setBounds(bounds.left, bounds.top, bounds.width, bounds.height);
  }

  private handleMovement(delta: number) {
    const inputVector = new Phaser.Math.Vector2(0, 0);
    if (this.keyA.isDown || this.cursors.left?.isDown) {
      inputVector.x -= 1;
    }
    if (this.keyD.isDown || this.cursors.right?.isDown) {
      inputVector.x += 1;
    }
    if (this.keyW.isDown || this.cursors.up?.isDown) {
      inputVector.y -= 1;
    }
    if (this.keyS.isDown || this.cursors.down?.isDown) {
      inputVector.y += 1;
    }

    inputVector.normalize();

    const speed = this.playerSpeed;
    let vx = inputVector.x * speed;
    let vy = inputVector.y * speed;

    const dt = delta / 1000;
    const nextX = this.player.x + vx * dt;
    const nextY = this.player.y + vy * dt;

    if (this.isBlocked(nextX, this.player.y)) {
      vx = 0;
    }
    if (this.isBlocked(this.player.x, nextY)) {
      vy = 0;
    }

    this.player.setVelocity(vx, vy);

    if (vx !== 0 || vy !== 0) {
      this.state.playerPosition = { x: this.player.x, y: this.player.y };
    }

    if (this.attacking) {
      return;
    }

    if (vy > 0) {
      this.player.play('hero-walk-down', true);
    } else if (vy < 0) {
      this.player.play('hero-idle-up', true);
    } else if (vx !== 0) {
      this.player.play('hero-walk-side', true);
      this.player.setFlipX(vx < 0);
    } else {
      this.player.play('hero-idle-down', true);
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyInteract)) {
      this.handleInteraction();
    }

    if (Phaser.Input.Keyboard.JustDown(this.keyAttack)) {
      this.performAttack();
    }
  }

  private spawnEntity(entity: WorldEntityConfig) {
    switch (entity.type) {
      case 'npc': {
        const npc = this.npcGroup.create(entity.x, entity.y, 'npc-elder') as Phaser.Physics.Arcade.Sprite;
        npc.setImmovable(true);
        npc.setData('id', entity.meta?.id ?? 'npc');
        npc.setDepth(entity.y * 0.5 + 1);
        return;
      }
      case 'enemy': {
        const enemy = this.enemyGroup.create(entity.x, entity.y, 'enemy-wraith') as Phaser.Physics.Arcade.Sprite;
        enemy.play('enemy-wraith-idle');
        enemy.setCircle(14, 4, 4);
        enemy.setCollideWorldBounds(true);
        enemy.setBounce(1, 1);
        enemy.setData('info', {
          subtype: entity.subtype,
          health: 60,
          maxHealth: 60,
          meta: entity.meta
        } satisfies EnemyData);
        enemy.setDepth(entity.y * 0.5 + 1);
        return;
      }
      case 'item': {
        const key = entity.subtype === 'gem' ? 'item-gem' : 'item-herb';
        const item = this.itemGroup.create(entity.x, entity.y, key) as Phaser.Physics.Arcade.Sprite;
        item.setData('id', entity.meta?.id ?? entity.subtype);
        item.setImmovable(true);
        item.setDepth(entity.y * 0.5);
        return;
      }
      case 'prop': {
        const key = entity.subtype === 'shrine' ? 'prop-shrine' : 'prop-tree';
        const sprite = this.add.image(entity.x, entity.y, key);
        sprite.setDepth(entity.y * 0.5);
        sprite.setData('type', entity.subtype);
        this.propGroup.add(sprite);
        return;
      }
      default:
        return;
    }
  }

  private handleInteraction() {
    if (this.dialogue.isActive()) {
      this.dialogue.progress();
      return;
    }

    let closestNpc: Phaser.GameObjects.GameObject | null = null;
    let closestDistance = 64;
    for (const child of this.npcGroup.getChildren() as Phaser.GameObjects.GameObject[]) {
      const sprite = child as Phaser.Physics.Arcade.Sprite;
      const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestNpc = sprite;
      }
    }

    if (closestNpc) {
      const npcId = (closestNpc as Phaser.Physics.Arcade.Sprite).getData('id') as string;
      const treeId = `${npcId}:intro`;
      this.dialogue.start(treeId);
      this.applyNpcRewards(npcId);
      return;
    }

    let closestProp: Phaser.GameObjects.GameObject | null = null;
    closestDistance = 48;
    for (const child of this.propGroup.getChildren() as Phaser.GameObjects.GameObject[]) {
      const sprite = child as Phaser.GameObjects.Sprite;
      const dist = Phaser.Math.Distance.Between(sprite.x, sprite.y, this.player.x, this.player.y);
      if (dist < closestDistance) {
        closestDistance = dist;
        closestProp = sprite;
      }
    }
    if (closestProp) {
      const type = closestProp.getData('type');
      if (type === 'shrine') {
        this.state.heal(20);
        this.state.emit('dialogue', {
          speaker: 'Shrine',
          text: 'The rune warms beneath your palm. A hush sweeps the grove.'
        });
      }
    }
  }

  private applyNpcRewards(npcId: string) {
    if (npcId === 'blacksmith-tarin') {
      const hasItem = this.state.inventory.some(item => item.id === 'heartstone-splinter');
      if (!hasItem) {
        this.state.addItem({
          id: 'heartstone-splinter',
          name: 'Heartstone Splinter',
          description: 'A shard gifted by Tarin, glimmering with protective warmth.'
        });
      }
    }
  }

  private performAttack() {
    if (this.attacking) {
      return;
    }
    this.attacking = true;
    this.player.play('hero-attack');
    AudioManager.getInstance().playAttack();

    const slash = this.add.sprite(this.player.x + (this.player.flipX ? -24 : 24), this.player.y, 'slash-0');
    slash.play('weapon-slash');
    slash.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => slash.destroy());

    this.time.delayedCall(180, () => {
      this.enemyGroup.getChildren().forEach(child => {
        const enemy = child as Phaser.Physics.Arcade.Sprite;
        const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        if (distance < 64) {
          this.damageEnemy(enemy, 35);
        }
      });
    });

    this.time.delayedCall(320, () => {
      this.attacking = false;
    });
  }

  private damageEnemy(enemy: Phaser.Physics.Arcade.Sprite, amount: number) {
    const info = enemy.getData('info') as EnemyData;
    if (!info) {
      return;
    }
    info.health -= amount;
    enemy.setTintFill(0xffffff);
    this.tweens.add({
      targets: enemy,
      alpha: { from: 1, to: 0.6 },
      duration: 80,
      yoyo: true,
      repeat: 2,
      onComplete: () => enemy.clearTint()
    });

    if (info.health <= 0) {
      this.state.defeatEnemy(info.subtype);
      this.tweens.add({
        targets: enemy,
        alpha: 0,
        duration: 200,
        onComplete: () => enemy.destroy()
      });
      AudioManager.getInstance().exitBattle();
    } else {
      enemy.setData('info', info);
      AudioManager.getInstance().enterBattle();
    }
  }

  private updateEnemies(delta: number) {
    let engaged = false;
    this.enemyGroup.getChildren().forEach(child => {
      const enemy = child as Phaser.Physics.Arcade.Sprite;
      const info = enemy.getData('info') as EnemyData;
      if (!info) {
        return;
      }
      const distance = Phaser.Math.Distance.Between(enemy.x, enemy.y, this.player.x, this.player.y);
      if (distance < 160) {
        engaged = true;
        const angle = Phaser.Math.Angle.Between(enemy.x, enemy.y, this.player.x, this.player.y);
        const body = enemy.body as Phaser.Physics.Arcade.Body;
        if (body) {
          this.physics.velocityFromRotation(angle, 40, body.velocity);
        }
      } else {
        engaged = engaged || false;
        const meta = info.meta ?? {};
        if (meta.patrol === 'circle') {
          const speed = 20;
          const t = this.time.now / 1000;
          enemy.setVelocity(Math.cos(t) * speed, Math.sin(t) * speed);
        } else if (meta.patrol === 'line') {
          const speed = 30;
          const direction = Math.sin(this.time.now / 600) >= 0 ? 1 : -1;
          enemy.setVelocity(speed * direction, 0);
        } else {
          enemy.setVelocity(0, 0);
        }
      }
    });

    if (engaged) {
      AudioManager.getInstance().enterBattle();
    } else {
      AudioManager.getInstance().exitBattle();
    }
  }

  private onEnemyCollide: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_, enemyObj) => {
    if (this.invulnerableTimer > 0) {
      return;
    }
    this.invulnerableTimer = 800;
    this.cameras.main.shake(120, 0.008);
    this.player.setTint(0xff8888);
    this.time.delayedCall(220, () => this.player.clearTint());
    this.state.damage(12);

    if (this.state.health <= 0) {
      this.handlePlayerDefeat();
    }

    const enemy = enemyObj as Phaser.Physics.Arcade.Sprite;
    if (enemy) {
      const body = enemy.body as Phaser.Physics.Arcade.Body;
      if (body) {
        body.velocity.scale(-0.6);
      }
    }
  };

  private handlePlayerDefeat() {
    this.state.health = this.state.maxHealth;
    this.state.emit('player-health', { current: this.state.health, max: this.state.maxHealth });
    this.player.setPosition(18 * 32, 18 * 32);
    this.state.emit('dialogue', {
      speaker: 'Narrator',
      text: 'The grove refuses to let you fall. You awaken beneath the heartwood.'
    });
  }

  private onItemPickup: Phaser.Types.Physics.Arcade.ArcadePhysicsCallback = (_, itemObj) => {
    const item = itemObj as Phaser.Physics.Arcade.Sprite;
    const id = item.getData('id') as string;
    if (!id) {
      return;
    }
    AudioManager.getInstance().playPickup();
    const inventoryItem = this.describeItem(id);
    this.state.addItem(inventoryItem);
    item.disableBody(true, true);
    item.destroy();
  };

  private describeItem(id: string) {
    switch (id) {
      case 'dawnblossom':
        return { id, name: 'Dawnblossom', description: 'A luminous flower that hums with morning light.' };
      case 'heartstone-splinter':
        return { id, name: 'Heartstone Splinter', description: 'A shard of the village heartstone, warm to the touch.' };
      case 'ancient-rune':
        return { id, name: 'Ancient Rune', description: 'An etched rune fragment whispering lost songs.' };
      case 'cavern-heart':
        return { id, name: 'Cavern Heart', description: 'A crystal pulsing with subterranean tides.' };
      default:
        return { id, name: id, description: 'An enigmatic relic of Eldergrove.' };
    }
  }

  private isBlocked(x: number, y: number) {
    const tile = this.getTileAt(x, y);
    return tile ? this.blockedTiles.has(tile) : false;
  }

  private getTileAt(x: number, y: number): TileType | null {
    const col = Math.floor(x / 32);
    const row = Math.floor(y / 32);
    const tiles = this.currentZone.tiles[row];
    if (!tiles) {
      return null;
    }
    return tiles[col] ?? null;
  }

  private handleZoneTransitions() {
    if (this.transitionCooldown > 0) {
      return;
    }

    for (const transition of this.currentZone.transitions) {
      const bounds = new Phaser.Geom.Rectangle(transition.x, transition.y, transition.width, transition.height);
      if (bounds.contains(this.player.x, this.player.y)) {
        this.transitionCooldown = 500;
        this.switchZone(transition);
        return;
      }
    }
  }

  private switchZone(transition: ZoneTransition) {
    this.loadZone(transition.to);
    this.player.setPosition(transition.targetX, transition.targetY);
    this.state.setZone(transition.to, { x: transition.targetX, y: transition.targetY });
    this.state.emit('dialogue', {
      speaker: 'Narrator',
      text: `You cross into ${WorldZones[transition.to].name}.`
    });
  }
}
