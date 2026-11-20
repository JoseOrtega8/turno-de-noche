// Inventario fijo y siempre visible (sección 4.7): armas, munición, botiquines y pesos.
import { ARMAS, JUGADOR, PESOS } from '../config.js';

export class Inventario {
  constructor() {
    this.desbloqueadas = { llave: true, pistola: false, escopeta: false };
    this.municion = {
      pistola: { cargador: 0, reserva: 0 },
      escopeta: { cargador: 0, reserva: 0 },
    };
    this.armaActual = 'llave';
    this.botiquines = 0;
    this.pesos = PESOS.inicial;
  }

  get orden() { return ['llave', 'pistola', 'escopeta']; }

  desbloquear(arma, cargador = 0, reserva = 0) {
    this.desbloqueadas[arma] = true;
    if (this.municion[arma]) {
      this.municion[arma].cargador = Math.min(ARMAS[arma].cargador, cargador);
      this.municion[arma].reserva = Math.min(ARMAS[arma].reservaMax, reserva);
    }
  }

  cambiarArma(arma) {
    if (!this.desbloqueadas[arma] || this.armaActual === arma) return false;
    this.armaActual = arma;
    return true;
  }

  /** Rueda del mouse: siguiente arma desbloqueada. */
  ciclarArma(dir) {
    const lista = this.orden.filter(a => this.desbloqueadas[a]);
    const i = lista.indexOf(this.armaActual);
    return this.cambiarArma(lista[(i + dir + lista.length) % lista.length]);
  }

  /** Gasta una bala del cargador. Devuelve false si está vacío (suena clic). */
  gastarBala(arma = this.armaActual) {
    const m = this.municion[arma];
    if (!m) return true; // la llave no usa munición
    if (m.cargador <= 0) return false;
    m.cargador -= 1;
    return true;
  }

  puedeRecargar(arma = this.armaActual) {
    const m = this.municion[arma];
    return !!m && m.cargador < ARMAS[arma].cargador && m.reserva > 0;
  }

  /** Pasa balas de la reserva al cargador sin rebasar su capacidad (CA-03). */
  recargar(arma = this.armaActual) {
    if (!this.puedeRecargar(arma)) return 0;
    const m = this.municion[arma];
    const pasar = Math.min(ARMAS[arma].cargador - m.cargador, m.reserva);
    m.cargador += pasar;
    m.reserva -= pasar;
    return pasar;
  }

  espacioReserva(arma) {
    return ARMAS[arma].reservaMax - this.municion[arma].reserva;
  }

  /** Agrega munición a la reserva sin rebasar el máximo. Devuelve cuántas entraron. */
  agregarMunicion(arma, cantidad) {
    const entra = Math.max(0, Math.min(cantidad, this.espacioReserva(arma)));
    this.municion[arma].reserva += entra;
    return entra;
  }

  agregarBotiquin() {
    if (this.botiquines >= JUGADOR.botiquinesMax) return false;
    this.botiquines += 1;
    return true;
  }

  usarBotiquin() {
    if (this.botiquines <= 0) return false;
    this.botiquines -= 1;
    return true;
  }

  agregarPesos(n) { this.pesos += n; }

  /** Valida antes de aplicar: nunca quedan pesos negativos (CA-06). */
  gastarPesos(n) {
    if (n < 0 || this.pesos < n) return false;
    this.pesos -= n;
    return true;
  }
}
