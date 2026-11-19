// Sistema de oleadas (sección 4.6). Usa el delta del update, así que al pausar
// la escena o abrir la tienda la cuenta regresiva y las apariciones se detienen solas.
import { ESPERA_PRIMERA_OLEADA, DESCANSO_ENTRE_OLEADAS, CUENTA_AL_CERRAR_TIENDA, INTERVALO_APARICION } from '../config.js';
import { bus, EV } from './Eventos.js';

export const ESTADO = { ESPERA: 'espera', ACTIVA: 'activa', DESCANSO: 'descanso', TERMINADO: 'terminado' };

export class Oleadas {
  /**
   * @param {Array} definicion lista de oleadas { entradas, enemigos }
   * @param {(tipo: string, entrada: string) => any} crearEnemigo callback de la escena
   * @param {() => number} contarVivos callback que regresa los infectados vivos
   */
  constructor(definicion, crearEnemigo, contarVivos) {
    this.def = definicion;
    this.crearEnemigo = crearEnemigo;
    this.contarVivos = contarVivos;
    this.numero = 0;              // oleada actual (1..n); 0 = todavía no empieza
    this.estado = ESTADO.ESPERA;
    this.cuenta = ESPERA_PRIMERA_OLEADA;
    this.cola = [];
    this.porAparecer = 0;
    this.siguienteAparicion = 0;
    this.entradasBloqueadas = new Set();
    this.recibioDanio = false;
  }

  get total() { return this.def.length; }

  /** Mezcla la composición de la oleada y reparte las entradas en orden. */
  _armarCola(n) {
    const d = this.def[n - 1];
    const tipos = [];
    for (const [tipo, cant] of Object.entries(d.enemigos)) {
      for (let i = 0; i < cant; i++) tipos.push(tipo);
    }
    // los hinchados salen al final para que la oleada vaya subiendo de tono
    const normales = Phaser.Utils.Array.Shuffle(tipos.filter(t => t !== 'hinchado'));
    const orden = [...normales, ...tipos.filter(t => t === 'hinchado')];
    let entradas = d.entradas.filter(e => !this.entradasBloqueadas.has(e));
    if (entradas.length === 0) entradas = d.entradas;
    return orden.map((tipo, i) => ({ tipo, entrada: entradas[i % entradas.length] }));
  }

  iniciarOleada() {
    this.numero += 1;
    this.alPrepararOleada?.(this.numero, this.def[this.numero - 1]);
    this.cola = this._armarCola(this.numero);
    this.porAparecer = this.cola.length;
    this.siguienteAparicion = 600;
    this.estado = ESTADO.ACTIVA;
    this.recibioDanio = false;
    bus.emit(EV.INICIO_OLEADA, this.numero, this.def[this.numero - 1]);
  }

  /** Reinicia la oleada actual (se usa al perder una vida). */
  reiniciarOleadaActual() {
    if (this.numero === 0) return;
    this.numero -= 1;
    this.estado = ESTADO.ESPERA;
    this.cuenta = 3;
    this.cola = [];
  }

  /** Al cerrar la tienda la siguiente oleada empieza en 5 s. */
  tiendaCerrada() {
    if (this.estado === ESTADO.DESCANSO) this.cuenta = Math.min(this.cuenta, CUENTA_AL_CERRAR_TIENDA);
  }

  update(deltaMs) {
    if (this.estado === ESTADO.ESPERA || this.estado === ESTADO.DESCANSO) {
      const antes = Math.ceil(this.cuenta);
      this.cuenta -= deltaMs / 1000;
      const ahora = Math.ceil(this.cuenta);
      if (ahora !== antes) bus.emit(EV.CUENTA_REGRESIVA, Math.max(0, ahora), this.numero + 1);
      if (this.cuenta <= 0) this.iniciarOleada();
      return;
    }
    if (this.estado !== ESTADO.ACTIVA) return;

    // aparición escalonada
    if (this.cola.length > 0) {
      this.siguienteAparicion -= deltaMs;
      if (this.siguienteAparicion <= 0) {
        const { tipo, entrada } = this.cola.shift();
        this.crearEnemigo(tipo, entrada);
        this.porAparecer = this.cola.length;
        this.siguienteAparicion = INTERVALO_APARICION;
      }
      return;
    }
    // la siguiente oleada no inicia hasta eliminar la actual (CA-04)
    if (this.contarVivos() === 0) {
      this.entradasBloqueadas.clear();
      const ultima = this.numero >= this.total;
      bus.emit(EV.FIN_OLEADA, this.numero, !this.recibioDanio, ultima);
      if (ultima) {
        this.estado = ESTADO.TERMINADO;
      } else {
        this.estado = ESTADO.DESCANSO;
        this.cuenta = DESCANSO_ENTRE_OLEADAS;
      }
    }
  }
}
