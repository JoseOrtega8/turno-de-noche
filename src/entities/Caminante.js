// Caminante: persigue en línea recta, se desliza por los obstáculos y ataca al tocar (1 vez por segundo).
// Todo eso ya lo hace la clase base, así que solo fija su tipo.
import { Enemigo } from './Enemigo.js';

export class Caminante extends Enemigo {
  constructor(scene, x, y) {
    super(scene, x, y, 'caminante');
  }
}
