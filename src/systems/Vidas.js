// Oportunidades e intentos del jugador (sección 4.5.2).
import { JUGADOR } from '../config.js';

export class Vidas {
  constructor() {
    this.vidas = JUGADOR.vidas;
    this.salud = JUGADOR.salud;
    this.invulnerableHasta = 0;
  }

  esInvulnerable(ahora) { return ahora < this.invulnerableHasta; }

  /**
   * Aplica daño respetando la invulnerabilidad.
   * @returns {'ignorado'|'danado'|'muerto'}
   */
  recibirDanio(cantidad, ahora) {
    if (this.salud <= 0 || this.esInvulnerable(ahora)) return 'ignorado';
    this.salud = Math.max(0, this.salud - cantidad);
    this.invulnerableHasta = ahora + JUGADOR.invulnerableGolpe;
    return this.salud === 0 ? 'muerto' : 'danado';
  }

  /** Quita una vida. Devuelve true si todavía quedan vidas (reaparece). */
  perderVida(ahora) {
    this.vidas = Math.max(0, this.vidas - 1);
    if (this.vidas > 0) {
      this.salud = JUGADOR.salud;
      this.invulnerableHasta = ahora + JUGADOR.invulnerableReaparecer;
      return true;
    }
    return false;
  }

  curar(cantidad) {
    if (this.salud >= JUGADOR.salud) return false;
    this.salud = Math.min(JUGADOR.salud, this.salud + cantidad);
    return true;
  }

  ganarVida() {
    if (this.vidas >= JUGADOR.vidasMax) return false;
    this.vidas += 1;
    return true;
  }
}
