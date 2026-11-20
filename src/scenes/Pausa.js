// Pausa (Esc o P): detiene movimiento, enemigos, temporizadores y la aparición de oleadas,
// porque la escena del nivel deja de actualizarse mientras esta está abierta (P-12).
import { ANCHO, ALTO } from '../config.js';
import { Audio } from '../systems/Audio.js';
import { T, boton } from './estilos.js';

export class Pausa extends Phaser.Scene {
  constructor() { super('Pausa'); }

  create() {
    this.abiertaEn = this.time.now;
    this.add.rectangle(0, 0, ANCHO, ALTO, 0x000000, 0.6).setOrigin(0).setInteractive();
    this.add.text(ANCHO / 2, ALTO / 2 - 130, 'PAUSA', T.titulo).setOrigin(0.5);
    boton(this, ANCHO / 2, ALTO / 2 - 40, 'CONTINUAR', () => this.continuar());
    boton(this, ANCHO / 2, ALTO / 2 + 16, 'REINICIAR NIVEL', () => this.salir('Nivel1'));
    boton(this, ANCHO / 2, ALTO / 2 + 72, 'VOLVER AL MENÚ', () => this.salir('Menu'));
    this.add.text(ANCHO / 2, ALTO / 2 + 140, 'WASD moverse · Clic atacar · R recargar · 1-2-3 armas · Q botiquín · E tienda · M silenciar', T.chico).setOrigin(0.5);
    const k = this.input.keyboard;
    k.on('keydown-ESC', () => this.continuar());
    k.on('keydown-P', () => this.continuar());
    this.sound.pauseAll?.();
  }

  continuar() {
    if (this.time.now - this.abiertaEn < 150) return;
    this.sound.resumeAll?.();
    this.scene.stop();
    this.scene.resume('Nivel1');
  }

  salir(destino) {
    this.sound.resumeAll?.();
    Audio.detenerMusica(this);
    this.scene.stop('HUD');
    this.scene.stop('Nivel1');
    this.scene.start(destino);
  }
}
