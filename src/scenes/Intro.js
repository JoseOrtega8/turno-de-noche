// Escenas 1 a 4 del guion (GDD 4.11) en cuadros de diálogo. Clic o Espacio avanza; Esc salta.
import { ANCHO, ALTO } from '../config.js';
import { T, FUENTE } from './estilos.js';
import { Audio } from '../systems/Audio.js';

const DIALOGOS = [
  { hora: '11:58 PM', quien: 'MARCO', texto: 'Qué larga noche… Todavía faltan seis horas.' },
  { hora: '11:58 PM', quien: 'DOÑA LUPE', texto: 'Marquitos, ¿ya cerraste la caja?' },
  { hora: '12:00 AM', quien: '', texto: 'En la carretera, una pipa se voltea. Una nube verde avanza hacia la gasolinera…' },
  { hora: '12:05 AM', quien: 'MARCO', texto: '¿Hay alguien ahí? ¿Necesita ayuda?… Esto no está bien.' },
  { hora: '12:10 AM', quien: 'DOÑA LUPE', texto: '¡Cierra la puerta, hijo! Tengo la pistola de mi viejo, pero no encuentro las balas. Aguanta con la llave mientras las busco.' },
];

export class Intro extends Phaser.Scene {
  constructor() { super('Intro'); }

  create() {
    this.cameras.main.fadeIn(400);
    this.add.image(ANCHO / 2, ALTO / 2, 'portada').setDisplaySize(ANCHO, ALTO).setTint(0x554466);
    this.caja = this.add.rectangle(ANCHO / 2, ALTO - 110, ANCHO - 80, 150, 0x0d0a14, 0.92).setStrokeStyle(3, 0xffd447);
    this.hora = this.add.text(60, ALTO - 176, '', { ...T.chico, color: '#7fe9ff' });
    this.quien = this.add.text(60, ALTO - 154, '', { fontFamily: FUENTE, fontSize: '20px', fontStyle: 'bold', color: '#ffd447' });
    this.texto = this.add.text(60, ALTO - 124, '', { ...T.normal, fontSize: '20px', wordWrap: { width: ANCHO - 130 } });
    this.add.text(ANCHO - 60, ALTO - 50, 'Clic / Espacio: siguiente  ·  Esc: saltar', T.chico).setOrigin(1, 0.5);
    this.i = -1;
    this.siguiente();
    this.input.on('pointerup', () => this.siguiente());
    this.input.keyboard.on('keydown-SPACE', () => this.siguiente());
    this.input.keyboard.on('keydown-ENTER', () => this.siguiente());
    this.input.keyboard.once('keydown-ESC', () => this.empezar());
  }

  siguiente() {
    this.i++;
    if (this.i >= DIALOGOS.length) return this.empezar();
    const d = DIALOGOS[this.i];
    this.hora.setText(d.hora);
    this.quien.setText(d.quien);
    this.texto.setText(d.texto);
    Audio.efecto(this, 'clic', { volume: 0.3, detune: 800 });
  }

  empezar() {
    if (this.saliendo) return;
    this.saliendo = true;
    this.cameras.main.fadeOut(400);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Nivel1'));
  }
}
