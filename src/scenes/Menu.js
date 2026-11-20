// Menú principal: portada, jugar y controles (CA-01).
import { ANCHO, ALTO } from '../config.js';
import { Audio } from '../systems/Audio.js';
import { T, FUENTE, boton } from './estilos.js';

export class Menu extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.add.image(ANCHO / 2, ALTO / 2, 'portada').setDisplaySize(ANCHO, ALTO);
    this.add.rectangle(ANCHO / 2, ALTO - 38, ANCHO, 76, 0x0d0a14, 0.8);
    boton(this, ANCHO / 2 - 300, ALTO - 44, 'JUGAR', () => this.jugar(), 200);
    boton(this, ANCHO / 2 - 85, ALTO - 44, 'CONTROLES', () => this.mostrarControles(), 200);
    this.add.text(ANCHO / 2 + 20, ALTO - 56, 'Enter para jugar  ·  M silencia el audio', T.chico);
    this.add.text(ANCHO / 2 + 20, ALTO - 34, 'Versión beta · Nivel 1: La gasolinera', { ...T.chico, fontSize: '12px', color: '#a89bc0' });

    this.input.keyboard.once('keydown-ENTER', () => this.jugar());
    // la música arranca con la primera interacción si el navegador bloquea el audio (CA-10)
    if (this.sound.locked) this.sound.once('unlocked', () => Audio.musica(this, 'musica_menu'));
    else Audio.musica(this, 'musica_menu');
  }

  jugar() {
    if (this.saliendo) return;
    this.saliendo = true;
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Intro'));
  }

  mostrarControles() {
    if (this.panel) return;
    const filas = [
      ['W A S D', 'Moverse'], ['Mouse', 'Apuntar'], ['Clic izquierdo', 'Atacar / disparar'],
      ['R', 'Recargar'], ['1 · 2 · 3 o rueda', 'Cambiar arma'], ['Q', 'Usar botiquín'],
      ['E', 'Interactuar (tienda)'], ['Esc o P', 'Pausa'], ['M', 'Silenciar'],
    ];
    const g = this.add.container(ANCHO / 2, ALTO / 2);
    const fondo = this.add.rectangle(0, 0, 520, 400, 0x140f1f, 0.96).setStrokeStyle(3, 0xffd447).setInteractive();
    g.add(fondo);
    g.add(this.add.text(0, -170, 'CONTROLES', { ...T.subtitulo, color: '#ffd447' }).setOrigin(0.5));
    filas.forEach(([tecla, accion], i) => {
      g.add(this.add.text(-40, -125 + i * 30, tecla, { fontFamily: FUENTE, fontSize: '18px', fontStyle: 'bold', color: '#ffd447' }).setOrigin(1, 0));
      g.add(this.add.text(-10, -125 + i * 30, accion, T.normal));
    });
    g.add(this.add.text(0, 172, 'Clic para cerrar', T.chico).setOrigin(0.5));
    fondo.on('pointerup', () => { g.destroy(); this.panel = null; });
    this.panel = g;
  }
}
