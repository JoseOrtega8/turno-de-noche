// Corredor: persigue directo a alta velocidad. Después de golpear se detiene 0.5 s,
// lo que le da tiempo al jugador de responder (GDD 4.5.4).
import { Enemigo } from './Enemigo.js';

export class Corredor extends Enemigo {
  constructor(scene, x, y) {
    super(scene, x, y, 'corredor');
  }

  alGolpear(time) {
    this.pausadoHasta = time + this.datos.pausaTrasGolpe;
    this.setVelocity(0, 0);
  }
}
