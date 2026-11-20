// Carga todos los recursos con barra de progreso y crea las animaciones.
import { ANCHO, ALTO } from '../config.js';
import { Audio } from '../systems/Audio.js';
import { crearAnimaciones } from '../animaciones.js';

export class Boot extends Phaser.Scene {
  constructor() { super('Boot'); }

  preload() {
    const barra = this.add.rectangle(ANCHO / 2 - 200, ALTO / 2, 0, 16, 0xffd447).setOrigin(0, 0.5);
    this.add.rectangle(ANCHO / 2, ALTO / 2, 404, 20).setStrokeStyle(2, 0xffffff);
    this.add.text(ANCHO / 2, ALTO / 2 - 34, 'Cargando el turno…', { fontFamily: 'monospace', fontSize: '18px', color: '#ffffff' }).setOrigin(0.5);
    this.load.on('progress', v => { barra.width = 400 * v; });

    const img = 'assets/img/';
    for (const s of ['marco', 'caminante', 'corredor', 'hinchado', 'lupe']) {
      this.load.spritesheet(s, `${img}${s}.png`, { frameWidth: 32, frameHeight: 32 });
    }
    this.load.spritesheet('explosion', `${img}explosion.png`, { frameWidth: 96, frameHeight: 96 });
    for (const s of ['tileset', 'bomba', 'barril', 'cactus', 'auto', 'neon', 'municion', 'botiquin', 'peso', 'bala',
      'barrera', 'fogonazo', 'luz', 'portada', 'ico_llave', 'ico_pistola', 'ico_escopeta']) {
      this.load.image(s, `${img}${s}.png`);
    }
    this.load.tilemapTiledJSON('nivel1', 'assets/maps/nivel1.json');
    Audio.cargar(this);
  }

  create() {
    crearAnimaciones(this);
    this.scene.start('Menu');
  }
}
