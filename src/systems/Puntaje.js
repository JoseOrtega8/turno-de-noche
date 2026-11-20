// Puntaje del nivel según la fórmula de la sección 4.14.
// Cada concepto se cuenta por separado para poder mostrar el desglose y comprobar la fórmula (P-14).
import { ENEMIGOS, PUNTOS, JUGADOR } from '../config.js';
import { bus, EV } from './Eventos.js';

export class Puntaje {
  constructor(acumuladoPrevio = 0) {
    this.previo = acumuladoPrevio;   // puntos de niveles anteriores (se conservan al reintentar)
    this.reiniciar();
  }

  reiniciar() {
    this.bajas = { caminante: 0, corredor: 0, hinchado: 0, trailero: 0 };
    this.puntosBajas = 0;
    this.oleadas = [];          // números de oleada superadas
    this.bajasPorBarril = 0;
    this.oleadasSinDanio = 0;
    this.objetosMision = 0;
    this.nivelesCompletados = 0;
    this.bonoTiempo = 0;
    this.golpes = 0;
    this.vidasPerdidas = 0;
    this.siguienteVidaExtra = JUGADOR.vidaExtraCada;
  }

  get totalNivel() {
    return this.puntosBajas
      + this.oleadas.reduce((s, n) => s + PUNTOS.oleadaSuperada * n, 0)
      + PUNTOS.bajaPorBarril * this.bajasPorBarril
      + PUNTOS.oleadaSinDanio * this.oleadasSinDanio
      + PUNTOS.objetoMision * this.objetosMision
      + PUNTOS.nivelCompletado * this.nivelesCompletados
      + this.bonoTiempo
      + PUNTOS.golpeRecibido * this.golpes
      + PUNTOS.vidaPerdida * this.vidasPerdidas;
  }

  // El puntaje mostrado nunca baja de 0
  get total() {
    return Math.max(0, this.previo + this.totalNivel);
  }

  /** Suma la baja una sola vez por enemigo (CA-09). Devuelve los puntos sumados. */
  registrarBaja(enemigo) {
    if (enemigo.puntuado) return 0;
    enemigo.puntuado = true;
    const base = ENEMIGOS[enemigo.tipo]?.puntos ?? 0;
    this.bajas[enemigo.tipo] = (this.bajas[enemigo.tipo] ?? 0) + 1;
    this.puntosBajas += base;
    let extra = 0;
    if (enemigo.causaMuerte === 'barril') {
      this.bajasPorBarril += 1;
      extra = PUNTOS.bajaPorBarril;
    }
    this._cambio();
    return base + extra;
  }

  oleadaSuperada(n, sinDanio) {
    if (this.oleadas.includes(n)) return 0;
    this.oleadas.push(n);
    let p = PUNTOS.oleadaSuperada * n;
    if (sinDanio) { this.oleadasSinDanio += 1; p += PUNTOS.oleadaSinDanio; }
    this._cambio();
    return p;
  }

  golpeRecibido() { this.golpes += 1; this._cambio(); }
  vidaPerdida() { this.vidasPerdidas += 1; this._cambio(); }

  nivelCompletado(tiempoObjetivo, tiempoReal) {
    this.nivelesCompletados += 1;
    this.bonoTiempo = PUNTOS.bonoTiempoPorSegundo * Math.max(0, Math.floor(tiempoObjetivo - tiempoReal));
    this._cambio();
  }

  desglose() {
    const filas = [
      ['Caminantes', `${this.bajas.caminante} × ${ENEMIGOS.caminante.puntos}`, this.bajas.caminante * ENEMIGOS.caminante.puntos],
      ['Corredores', `${this.bajas.corredor} × ${ENEMIGOS.corredor.puntos}`, this.bajas.corredor * ENEMIGOS.corredor.puntos],
      ['Hinchados', `${this.bajas.hinchado} × ${ENEMIGOS.hinchado.puntos}`, this.bajas.hinchado * ENEMIGOS.hinchado.puntos],
      ['Bajas por barril', `${this.bajasPorBarril} × ${PUNTOS.bajaPorBarril}`, this.bajasPorBarril * PUNTOS.bajaPorBarril],
      ['Oleadas superadas', this.oleadas.length ? this.oleadas.map(n => `200×${n}`).join(' + ') : '0', this.oleadas.reduce((s, n) => s + 200 * n, 0)],
      ['Oleadas sin daño', `${this.oleadasSinDanio} × ${PUNTOS.oleadaSinDanio}`, this.oleadasSinDanio * PUNTOS.oleadaSinDanio],
      ['Nivel completado', `${this.nivelesCompletados} × ${PUNTOS.nivelCompletado}`, this.nivelesCompletados * PUNTOS.nivelCompletado],
      ['Bono de tiempo', '', this.bonoTiempo],
      ['Golpes recibidos', `${this.golpes} × (−50)`, this.golpes * PUNTOS.golpeRecibido],
      ['Vidas perdidas', `${this.vidasPerdidas} × (−500)`, this.vidasPerdidas * PUNTOS.vidaPerdida],
    ];
    return filas;
  }

  /** Revisa si se cruzó un múltiplo de 10 000 para dar vida extra. */
  revisarVidaExtra() {
    if (this.total >= this.siguienteVidaExtra) {
      this.siguienteVidaExtra += JUGADOR.vidaExtraCada;
      return true;
    }
    return false;
  }

  _cambio() { bus.emit(EV.HUD_ACTUALIZAR); }
}
