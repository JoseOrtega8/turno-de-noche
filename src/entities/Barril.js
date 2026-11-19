// Barril explosivo (GDD 4.9): explota al recibir un disparo y daña todo lo que esté a 80 px.
import { BARRIL, PROFUNDIDAD } from '../config.js';

export class Barril extends Phaser.Physics.Arcade.Sprite {
  constructor(scene, x, y) {
    super(scene, x, y, 'barril');
    this.explotado = false;
    scene.add.existing(this);
    scene.physics.add.existing(this, true); // cuerpo estático
    this.body.setCircle(13, 3, 3);
    this.setDepth(PROFUNDIDAD.objetos);
  }

  explotar() {
    if (this.explotado) return;
    this.explotado = true;
    const { x, y, scene } = this;   // se guardan antes de destruir el objeto
    scene.navegacion.marcarRect(x - 16, y - 16, 32, 32, 0);
    this.destroy();
    scene.explosion(x, y, {
      radio: BARRIL.radio,
      danioInfectados: BARRIL.danioInfectados,
      danioJugador: BARRIL.danioJugador,
      causa: 'barril',
    });
  }
}
