// Caja de munición y botiquín del mapa (GDD 4.9). Se vuelven a poner al iniciar cada oleada.
import { PROFUNDIDAD } from '../config.js';

export class Recogible extends Phaser.Physics.Arcade.Image {
  /** @param {'municion'|'botiquin'} tipo */
  constructor(scene, x, y, tipo) {
    super(scene, x, y, tipo);
    this.tipo = tipo;
    this.inicio = { x, y };
    scene.add.existing(this);
    scene.physics.add.existing(this, true);
    this.setDepth(PROFUNDIDAD.objetos);
    this.flotar = scene.tweens.add({ targets: this, y: y - 3, yoyo: true, repeat: -1, duration: 700, ease: 'Sine.easeInOut' });
  }

  get disponible() { return this.active && this.visible; }

  recoger() {
    this.disableBody(true, true);
  }

  reponer() {
    if (this.disponible) return;
    this.enableBody(true, this.inicio.x, this.inicio.y, true, true);
  }
}
