import * as Phaser from 'phaser';
import { Palette } from '../data/Palette';

type PixelArt = string[];

type PaletteMap = Record<string, string>;

function drawPixelArt(
  scene: Phaser.Scene,
  key: string,
  art: PixelArt,
  palette: PaletteMap,
  scale = 2
) {
  const size = art[0]?.length ?? 0;
  const canvas = scene.textures.createCanvas(key, size * scale, art.length * scale);
  if (!canvas) {
    return;
  }
  const ctx = canvas.context;
  if (!ctx) {
    return;
  }
  ctx.imageSmoothingEnabled = false;

  art.forEach((row, y) => {
    [...row].forEach((char, x) => {
      if (char === '.' || !palette[char]) {
        return;
      }
      ctx.fillStyle = palette[char];
      ctx.fillRect(x * scale, y * scale, scale, scale);
    });
  });

  canvas.refresh();
}

function createHeroTextures(scene: Phaser.Scene) {
  const palette: PaletteMap = {
    X: Palette.cloud,
    O: Palette.blush,
    B: '#0f274b',
    b: '#19345d',
    A: Palette.aqua,
    S: '#1b2b47',
    L: '#304b7a',
    H: '#f6d06f',
    G: '#233c64',
    T: '#825d38'
  };

  const frames: Record<string, PixelArt> = {
    'hero-idle-down': [
      '................',
      '......OOO........',
      '.....OOOOO.......',
      '.....OXXXO.......',
      '.....OXXXO.......',
      '......OOO........',
      '....BBBBBBB......',
      '...BbbSbbbB.....',
      '...BbbSbbbB.....',
      '....BBBBBBB......',
      '..LLLGGGGGLL.....',
      '..LLLGGGGGLL.....',
      '..LLLLGGGLLL.....',
      '..LLLLGGGLLL.....',
      '...TT.....TT.....',
      '...TT.....TT.....'
    ],
    'hero-walk-down-1': [
      '................',
      '......OOO........',
      '.....OOOOO.......',
      '.....OXXXO.......',
      '.....OXXXO.......',
      '......OOO........',
      '....BBBBBBB......',
      '...BbbSbbbB.....',
      '...BbbSbbbB.....',
      '....BBBBBBB......',
      '..LLLGGGGGLL.....',
      '..LLLGGGGGLL.....',
      '..LLLLGGGLLL.....',
      '...LLGGGGLL......',
      '...TT.....TT.....',
      '...TT.....TT.....'
    ],
    'hero-walk-down-2': [
      '................',
      '......OOO........',
      '.....OOOOO.......',
      '.....OXXXO.......',
      '.....OXXXO.......',
      '......OOO........',
      '....BBBBBBB......',
      '...BbbSbbbB.....',
      '...BbbSbbbB.....',
      '....BBBBBBB......',
      '..LLLGGGGGLL.....',
      '..LLLGGGGGLL.....',
      '...LLGGGGLL......',
      '..LLLLGGGLLL.....',
      '...TT.....TT.....',
      '...TT.....TT.....'
    ],
    'hero-idle-up': [
      '................',
      '......OOO........',
      '.....OOOOO.......',
      '.....OXXXO.......',
      '.....OXXXO.......',
      '......OOO........',
      '....BBBBBBB......',
      '...BBBBBBB......',
      '...LLLLLLL......',
      '..LLLGGGGGLL.....',
      '..LLLGGGGGLL.....',
      '..LLLLGGGLLL.....',
      '..LLLLGGGLLL.....',
      '..LLLLGGGLLL.....',
      '...TT.....TT.....',
      '...TT.....TT.....'
    ],
    'hero-walk-side-1': [
      '................',
      '......OOO........',
      '.....OOOOO.......',
      '.TTT.OXXXO.......',
      '.TTT.OXXXO.......',
      '......OOO........',
      '....BBBBBBB......',
      '...BbbSbbbB.....',
      '...BbbSbbbB.....',
      '....BBBBBBB......',
      '...GGGGGGGGG.....',
      '...GGGGGGGGG.....',
      '....GGGGGGG......',
      '...GGGGGGGG......',
      '...TT.....TT.....',
      '..TT.......TT....'
    ],
    'hero-walk-side-2': [
      '................',
      '......OOO........',
      '.....OOOOO.......',
      '.TTT.OXXXO.......',
      '.TTT.OXXXO.......',
      '......OOO........',
      '....BBBBBBB......',
      '...BbbSbbbB.....',
      '...BbbSbbbB.....',
      '....BBBBBBB......',
      '...GGGGGGGGG.....',
      '...GGGGGGGGG.....',
      '...GGGGGGGG......',
      '....GGGGGGG......',
      '..TT.......TT....',
      '...TT.....TT.....'
    ],
    'hero-attack': [
      '................',
      '......OOO........',
      '.....OOOOO.......',
      '.....OXXXO.......',
      '.....OXXXO.......',
      '......OOO........',
      '....BBBBBBB......',
      '...BbbSbbbB.....',
      '...BbbSbbbB.....',
      '....BBBBBBB......',
      '..LLLGGGGGLL.....',
      '..LLLGGGGGLL.....',
      '..LLLLGGGLLL.....',
      '.TTTTTTTTTTTT....',
      '...TT.....TT.....',
      '...TT.....TT.....'
    ]
  };

  Object.entries(frames).forEach(([key, art]) => {
    drawPixelArt(scene, key, art, palette, 2);
  });
}

function createNpcTextures(scene: Phaser.Scene) {
  const palette: PaletteMap = {
    X: '#f0e4d7',
    O: '#dfb194',
    C: '#7f4c4c',
    R: '#c74d4d',
    B: '#404f8f',
    b: '#323f79',
    Y: '#f9f871',
    '.': '#00000000'
  };

  const elder: PixelArt = [
    '................',
    '......OOO........',
    '.....OOOOO.......',
    '.....OXXXO.......',
    '.....OXXXO.......',
    '......OOO........',
    '....CCCCCCC......',
    '...CRRRRRRC.....',
    '...CRRRRRRC.....',
    '....CCCCCCC......',
    '..BBBBBBBBB......',
    '..BBBBBBBBB......',
    '..BbBBBBbBB......',
    '..BbBBBBbBB......',
    '..YY.....YY......',
    '..YY.....YY......'
  ];

  drawPixelArt(scene, 'npc-elder', elder, palette, 2);
}

function createEnemyTextures(scene: Phaser.Scene) {
  const palette: PaletteMap = {
    S: '#2e1d3a',
    s: '#472552',
    C: '#8c3f7a',
    T: '#f7eea1',
    E: '#f2994a',
    '.': '#00000000'
  };

  const wraithIdle: PixelArt = [
    '................',
    '......ssss......',
    '.....sCCCCs.....',
    '....sCCCCCCs....',
    '....sCCCCCCs....',
    '...sCCCCCCCCs...',
    '...sCCCCCCCCs...',
    '....sCCCCCCs....',
    '.....sCCCCs.....',
    '......sCCs......',
    '.......ss.......',
    '.....TssssT.....',
    '....TTssssTT....',
    '....EE....EE....',
    '....EE....EE....',
    '................'
  ];

  drawPixelArt(scene, 'enemy-wraith', wraithIdle, palette, 2);

  const glowPalette: PaletteMap = {
    ...palette,
    C: '#a54b91',
    s: '#5b2e61',
    T: '#ffeea8',
    E: '#ffbf6e'
  };
  drawPixelArt(scene, 'enemy-wraith-glow', wraithIdle, glowPalette, 2);
}

function createPropTextures(scene: Phaser.Scene) {
  const treePalette: PaletteMap = {
    L: Palette.leafLight,
    l: Palette.leafDark,
    B: Palette.barkDark,
    b: Palette.barkLight
  };

  const treeArt: PixelArt = [
    '......lll.......',
    '.....lLLLl......',
    '....lLLLLLl.....',
    '...lLLLLLLl.....',
    '..lLLLLLLLLl....',
    '..lLLLLLLLLl....',
    '.lLLLLLLLLLLl...',
    '.lLLLLLLLLLLl...',
    '..lLLLLLLLLl....',
    '...lLLLLLLl.....',
    '....lLLLLl......',
    '......bBb.......',
    '......bBb.......',
    '......BBB.......',
    '......BBB.......',
    '......BBB.......'
  ];

  drawPixelArt(scene, 'prop-tree', treeArt, treePalette, 2);

  const shrinePalette: PaletteMap = {
    S: Palette.ruinStone,
    M: Palette.ruinMoss,
    G: Palette.gold,
    '.': '#00000000'
  };

  const shrineArt: PixelArt = [
    '................',
    '.....MMMMM......',
    '....MSSSSM.....',
    '...MSSGGSSM....',
    '...MSSGGSSM....',
    '...MSSSSSM.....',
    '....MSSSM......',
    '....MSSSM......',
    '....MSSSM......',
    '....MSSSM......',
    '...SSSSSSS.....',
    '...SSSSSSS.....',
    '...SSSSSSS.....',
    '...SS...SS.....',
    '...SS...SS.....',
    '................'
  ];

  drawPixelArt(scene, 'prop-shrine', shrineArt, shrinePalette, 2);
}

function createTileTextures(scene: Phaser.Scene) {
  const tiles = [
    {
      key: 'tile-grass',
      palette: {
        A: Palette.leafLight,
        B: Palette.leafDark,
        C: '#3c7a4b',
        '.': '#00000000'
      },
      art: [
        'ABBAABBBAABBBAAB',
        'BABBAABBBAABBBAB',
        'AABBBAABBBAABBBA',
        'BBBAABBBAABBBAAB',
        'AABBBAABBBAABBBA',
        'BAABBBAABBBAABBB',
        'ABBAABBBAABBBAAB',
        'BABBAABBBAABBBAB',
        'AABBBAABBBAABBBA',
        'BBBAABBBAABBBAAB',
        'AABBBAABBBAABBBA',
        'BAABBBAABBBAABBB',
        'ABBAABBBAABBBAAB',
        'BABBAABBBAABBBAB',
        'AABBBAABBBAABBBA',
        'BBBAABBBAABBBAAB'
      ] as PixelArt,
      scale: 2
    },
    {
      key: 'tile-path',
      palette: {
        A: '#c4a76d',
        B: '#ad8b4d',
        C: '#d7b97e',
        '.': '#00000000'
      },
      art: [
        'BBBBBBBBBBABBBBB',
        'BBAAAAABBBBABBBB',
        'BBAAAAABAAABBBBB',
        'BBBAAAAABBBBBBBB',
        'BBBBBAAABBBBBBBB',
        'BBBBBAAABBBBBBBB',
        'BBBBBBAAABBBBBBB',
        'BBBBBBAAABBBBBBB',
        'BBBBBBAAABBBBBBB',
        'BBBBBAAABBBBBBBB',
        'BBBBAAABBBBBBBBB',
        'BBBBAAABBBBBBBBB',
        'BBBBAAAABBBBBBBB',
        'BBBBBAAABBBBBBBB',
        'BBBBBBAAABBBBBBB',
        'BBBBBBBAAABBBBBB'
      ] as PixelArt,
      scale: 2
    },
    {
      key: 'tile-water',
      palette: {
        A: '#1a6fa3',
        B: '#0c4870',
        C: '#2389c6',
        '.': '#00000000'
      },
      art: [
        'AAABBBBAAABBBBA',
        'AABBBBBAAABBBBA',
        'AABBBBAAABBBBAA',
        'BBBBBBAABBBBBAA',
        'BBBBBAAABBBBBAA',
        'BBBAAABBBBAAABB',
        'BAAABBBBBAAABBB',
        'AAABBBBBAAABBBB',
        'AAABBBBBAAABBBB',
        'AAABBBBAAABBBBA',
        'AABBBBAAABBBBAA',
        'AABBBBBAABBBBAA',
        'BBBBBBAABBBBAAA',
        'BBBBBAAABBBBAAA',
        'BBBBAAABBBBAAAB',
        'BBAAABBBBBAAABB'
      ] as PixelArt,
      scale: 2
    },
    {
      key: 'tile-ruin',
      palette: {
        A: Palette.ruinStone,
        B: '#6f758c',
        C: Palette.ruinMoss,
        '.': '#00000000'
      },
      art: [
        'ABABABABABABABA',
        'BABABABABABABAB',
        'ABABACABABABABA',
        'BABABABABABABAB',
        'ABABABABACABABA',
        'BABABABABABABAB',
        'ABABABABABABACA',
        'BABABABAACABABA',
        'ABABABABABABABA',
        'BABACABABABABAB',
        'ABABABABABACABA',
        'BABABABABABABAB',
        'ABABABACABABABA',
        'BABABABABABABAB',
        'ABABABABABABABA',
        'BABABABABABABAB'
      ] as PixelArt,
      scale: 2
    },
    {
      key: 'tile-village',
      palette: {
        A: '#5d3b21',
        B: '#7c4f2a',
        C: '#9a6336',
        '.': '#00000000'
      },
      art: [
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBCCBBBBBBCCBBBB',
        'BBCCBBBBBBCCBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBCCBBBBBBCCBBBB',
        'BBCCBBBBBBCCBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBCCBBBBBBCCBBBB',
        'BBCCBBBBBBCCBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB',
        'BBBBBBBBBBBBBBBB'
      ] as PixelArt,
      scale: 2
    }
  ];

  tiles.forEach(tile => drawPixelArt(scene, tile.key, tile.art, tile.palette, tile.scale));
}

function createWeaponTextures(scene: Phaser.Scene) {
  const palette: PaletteMap = {
    L: Palette.ice,
    G: Palette.gold,
    '.': '#00000000'
  };

  const slashFrames: Record<string, PixelArt> = {
    'slash-0': [
      '........',
      '....L...',
      '...LLL..',
      '..LLLLL.',
      '...LLL..',
      '....L...',
      '........',
      '........'
    ],
    'slash-1': [
      '........',
      '..L.....',
      '...LL...',
      '...LLL..',
      '....LL..',
      '.....L..',
      '........',
      '........'
    ],
    'slash-2': [
      '........',
      '........',
      '..L.....',
      '..LL....',
      '...LL...',
      '....L...',
      '........',
      '........'
    ]
  };

  Object.entries(slashFrames).forEach(([key, art]) => drawPixelArt(scene, key, art, palette, 4));

  drawPixelArt(
    scene,
    'item-herb',
    [
      '....GG....',
      '...GGGG...',
      '..GGGGGG..',
      '..GGGGGG..',
      '...GGGG...',
      '....GG....',
      '....GG....',
      '....GG....'
    ],
    {
      G: Palette.leafLight
    },
    2
  );

  drawPixelArt(
    scene,
    'item-gem',
    [
      '....GG....',
      '...GLLG...',
      '..GLAALG..',
      '..GLAALG..',
      '...GLLG...',
      '....GG....',
      '....GG....',
      '....GG....'
    ],
    {
      G: Palette.aqua,
      L: Palette.ice,
      A: Palette.gold
    },
    2
  );
}

export function generateProceduralTextures(scene: Phaser.Scene) {
  createTileTextures(scene);
  createHeroTextures(scene);
  createNpcTextures(scene);
  createEnemyTextures(scene);
  createPropTextures(scene);
  createWeaponTextures(scene);
}
