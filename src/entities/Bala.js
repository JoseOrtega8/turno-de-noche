// Bala de pistola o perdigón de escopeta. Se reutilizan desde un grupo (pool) para no crear basura.
import { PROFUNDIDAD } from '../config.js';

export class Bala extends Phaser.Physics.Arcade.Image {
  constructor(scene, x, y) {
    super(scene, x, y, 'bala');
    this.danio = 0;
    this.vidaMs = 0;
  }

  disparar(x, y, angulo, velocidad, danio) {
    this.enableBody(true, x, y, true, true);
    this.setDepth(PROFUNDIDAD.balas);
    this.body.setSize(6, 6);
    this.setRotation(angulo);
    this.danio = danio;
    this.vidaMs = 1100;
    this.scene.physics.velocityFromRotation(angulo, velocidad, this.body.velocity);
  }

  /** Desactiva la bala; así un mismo disparo nunca daña dos veces (CA-03). */
  apagar() {
    this.disableBody(true, true);
  }

  preUpdate(time, delta) {
    super.preUpdate?.(time, delta);
    this.vidaMs -= delta;
    if (this.vidaMs <= 0) this.apagar();
  }
}
