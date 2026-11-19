// Hinchado: lento y resistente. Al morir parpadea 0.5 s y explota,
// dañando al jugador y a otros infectados en 80 px (GDD 4.5.4).
import { Enemigo } from './Enemigo.js';
import { PROFUNDIDAD } from '../config.js';

export class Hinchado extends Enemigo {
  constructor(scene, x, y) {
    super(scene, x, y, 'hinchado');
    this.setScale(1.25);
    this.body.setCircle(11, 5, 5);
  }

  animacionMuerte() {
    this.anims.pause();
    this.setDepth(PROFUNDIDAD.personajes);
    // parpadea y se infla antes de explotar
    this.scene.tweens.add({ targets: this, scale: 1.55, duration: this.datos.parpadeo, ease: 'Quad.easeIn' });
    let n = 0;
    this.scene.time.addEvent({
      delay: 70, repeat: Math.floor(this.datos.parpadeo / 70) - 1,
      callback: () => {
        n++;
        if (n % 2) this.setTint(0xffff66).setTintMode(Phaser.TintModes.FILL);
        else this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY);
      },
    });
    this.scene.time.delayedCall(this.datos.parpadeo, () => {
      if (!this.scene) return;
      this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY).setScale(1.25);
      this.scene.explosion(this.x, this.y, {
        radio: this.datos.radioExplosion,
        danioInfectados: this.datos.danioExplosion,
        danioJugador: this.datos.danioExplosion,
        causa: 'hinchado',
      });
      super.animacionMuerte();
    });
  }
}
