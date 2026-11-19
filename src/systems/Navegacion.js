// Navegación de los infectados sobre la cuadrícula del mapa.
// Si ven al jugador van en línea recta (GDD 4.5.4). Si un muro o un auto se los tapa,
// siguen un "campo de flujo": un recorrido en anchura (BFS) desde la casilla del jugador
// que le dice a cada casilla hacia dónde queda el camino más corto. Así rodean la tienda
// en lugar de quedarse pegados a la pared.
import { MOSAICO } from '../config.js';

const VECINOS = [
  [1, 0], [-1, 0], [0, 1], [0, -1],
  [1, 1], [1, -1], [-1, 1], [-1, -1],
];

export class Navegacion {
  constructor(anchoCasillas, altoCasillas) {
    this.w = anchoCasillas;
    this.h = altoCasillas;
    this.bloqueado = new Uint8Array(this.w * this.h);
    this.distancia = new Int32Array(this.w * this.h).fill(-1);
    this.origen = -1;
    this.recalcularEn = 0;
  }

  idx(cx, cy) { return cy * this.w + cx; }
  dentro(cx, cy) { return cx >= 0 && cy >= 0 && cx < this.w && cy < this.h; }
  casilla(px) { return Math.floor(px / MOSAICO); }

  estaBloqueada(cx, cy) {
    return !this.dentro(cx, cy) || this.bloqueado[this.idx(cx, cy)] === 1;
  }

  marcarCasilla(cx, cy, valor = 1) {
    if (this.dentro(cx, cy)) this.bloqueado[this.idx(cx, cy)] = valor;
    this.origen = -1; // obliga a recalcular
  }

  /** Marca las casillas que toca un rectángulo en pixeles (props como bombas, autos o barriles). */
  marcarRect(x, y, ancho, alto, valor = 1) {
    const x0 = this.casilla(x + 2), y0 = this.casilla(y + 2);
    const x1 = this.casilla(x + ancho - 3), y1 = this.casilla(y + alto - 3);
    for (let cy = y0; cy <= y1; cy++) {
      for (let cx = x0; cx <= x1; cx++) this.marcarCasilla(cx, cy, valor);
    }
  }

  /** Recorrido en anchura desde la casilla del jugador. */
  calcular(px, py) {
    let cx = this.casilla(px), cy = this.casilla(py);
    if (!this.dentro(cx, cy)) return;
    const inicio = this.idx(cx, cy);
    this.origen = inicio;
    this.distancia.fill(-1);
    const cola = new Int32Array(this.w * this.h);
    let cabeza = 0, fin = 0;
    this.distancia[inicio] = 0;
    cola[fin++] = inicio;
    while (cabeza < fin) {
      const actual = cola[cabeza++];
      const ax = actual % this.w, ay = (actual / this.w) | 0;
      for (const [dx, dy] of VECINOS) {
        const nx = ax + dx, ny = ay + dy;
        if (this.estaBloqueada(nx, ny)) continue;
        // sin cortar esquinas en diagonal
        if (dx !== 0 && dy !== 0 && (this.estaBloqueada(ax + dx, ay) || this.estaBloqueada(ax, ay + dy))) continue;
        const ni = this.idx(nx, ny);
        if (this.distancia[ni] !== -1) continue;
        this.distancia[ni] = this.distancia[actual] + 1;
        cola[fin++] = ni;
      }
    }
  }

  /** Recalcula como máximo cada 200 ms o cuando el jugador cambia de casilla. */
  actualizar(px, py, ahora) {
    const i = this.idx(this.casilla(px), this.casilla(py));
    if (i !== this.origen || ahora >= this.recalcularEn) {
      this.calcular(px, py);
      this.recalcularEn = ahora + 200;
    }
  }

  /** Punto (centro de casilla) al que debe ir un infectado parado en (x, y). */
  siguientePaso(x, y) {
    const cx = this.casilla(x), cy = this.casilla(y);
    if (!this.dentro(cx, cy)) return null;
    let mejor = null, mejorDist = this.distancia[this.idx(cx, cy)];
    if (mejorDist === -1) mejorDist = Infinity;
    for (const [dx, dy] of VECINOS) {
      const nx = cx + dx, ny = cy + dy;
      if (this.estaBloqueada(nx, ny)) continue;
      if (dx !== 0 && dy !== 0 && (this.estaBloqueada(cx + dx, cy) || this.estaBloqueada(cx, cy + dy))) continue;
      const d = this.distancia[this.idx(nx, ny)];
      if (d !== -1 && d < mejorDist) { mejorDist = d; mejor = [nx, ny]; }
    }
    if (!mejor) return null;
    return { x: mejor[0] * MOSAICO + MOSAICO / 2, y: mejor[1] * MOSAICO + MOSAICO / 2 };
  }

  /** ¿Hay línea de vista libre entre dos puntos? Revisa tres líneas paralelas por el ancho del cuerpo. */
  hayLineaDeVista(ax, ay, bx, by, radio = 10) {
    const dx = bx - ax, dy = by - ay;
    const largo = Math.hypot(dx, dy);
    if (largo < 1) return true;
    const nx = -dy / largo * radio, ny = dx / largo * radio;
    for (const off of [0, 1, -1]) {
      const ox = nx * off, oy = ny * off;
      for (let t = 0; t <= largo; t += 8) {
        const x = ax + ox + dx * t / largo, y = ay + oy + dy * t / largo;
        if (this.estaBloqueada(this.casilla(x), this.casilla(y))) return false;
      }
    }
    return true;
  }
}
