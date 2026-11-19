// Configuración del juego. Phaser 4.2.1 se carga desde lib/phaser.min.js (versión fija).
import { ANCHO, ALTO } from './config.js';
import { Audio } from './systems/Audio.js';
import { Boot } from './scenes/Boot.js';
import { Menu } from './scenes/Menu.js';
import { Intro } from './scenes/Intro.js';
import { Nivel1 } from './scenes/Nivel1.js';
import { HUD } from './scenes/HUD.js';
import { Tienda } from './scenes/Tienda.js';
import { Pausa } from './scenes/Pausa.js';
import { GameOver, Victoria } from './scenes/Resultados.js';

const debug = new URLSearchParams(location.search).has('debug');

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'juego',
  width: ANCHO,
  height: ALTO,
  backgroundColor: '#0d0a14',
  pixelArt: true,
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  physics: { default: 'arcade', arcade: { debug } },
  audio: { disableWebAudio: false },
  scene: [Boot, Menu, Intro, Nivel1, HUD, Tienda, Pausa, GameOver, Victoria],
});

// M silencia música y efectos desde cualquier pantalla (CA-10)
window.addEventListener('keydown', (e) => {
  if (e.code === 'KeyM' && !e.repeat) Audio.alternarSilencio(game);
});

// para depurar desde la consola del navegador y para las pruebas automáticas
window.__juego = game;
