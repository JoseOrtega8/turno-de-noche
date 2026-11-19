// HUD e inventario en pantalla (GDD 4.5.7): vidas, salud, oleada y hora, puntaje, pesos,
// armas con munición, botiquines, avisos y mensajes. Corre encima del nivel en su propia escena.
import { ANCHO, ALTO, JUGADOR, ARMAS } from '../config.js';
import { bus, EV } from '../systems/Eventos.js';
import { ESTADO } from '../systems/Oleadas.js';
import { T, FUENTE } from './estilos.js';

export class HUD extends Phaser.Scene {
  constructor() { super('HUD'); }

  init(data) { this.nivel = data.nivel; }

  create() {
    // destello rojo suave al recibir daño
    this.destello = this.add.rectangle(0, 0, ANCHO, ALTO, 0xd02020, 1).setOrigin(0).setAlpha(0);
    // franja superior semitransparente para que se lea sobre el mapa
    this.add.rectangle(0, 0, ANCHO, 64, 0x0d0a14, 0.55).setOrigin(0);

    // A: vidas
    this.circulosVida = [];
    for (let i = 0; i < JUGADOR.vidasMax; i++) {
      this.circulosVida.push(this.add.circle(24 + i * 26, 20, 9, 0xd23030).setStrokeStyle(2, 0x000000));
    }
    this.txtVidas = this.add.text(24 + JUGADOR.vidasMax * 26 - 4, 10, '', T.hud);
    // B: salud
    this.add.rectangle(16, 38, 204, 18, 0x000000).setOrigin(0, 0);
    this.barraFondo = this.add.rectangle(18, 40, 200, 14, 0x3a3340).setOrigin(0, 0);
    this.barraSalud = this.add.rectangle(18, 40, 200, 14, 0x5abf5a).setOrigin(0, 0);
    this.txtSalud = this.add.text(228, 36, '', { ...T.hud, fontSize: '16px' });
    // C: oleada y hora
    this.txtOleada = this.add.text(ANCHO / 2, 18, '', { ...T.hudAmarillo, fontSize: '20px' }).setOrigin(0.5);
    this.txtCuenta = this.add.text(ANCHO / 2, 44, '', { ...T.hud, fontSize: '15px', color: '#7fe9ff' }).setOrigin(0.5);
    // D y E: puntos y pesos
    this.txtPuntos = this.add.text(ANCHO - 16, 10, '', { ...T.hud, fontSize: '20px' }).setOrigin(1, 0);
    this.txtPesos = this.add.text(ANCHO - 16, 36, '', { ...T.hudAmarillo, fontSize: '18px' }).setOrigin(1, 0);
    this.txtSilencio = this.add.text(ANCHO - 16, 66, 'SILENCIO (M)', { ...T.hud, fontSize: '12px', color: '#ff9a9a' }).setOrigin(1, 0).setVisible(this.sound.mute);

    // F: armas
    this.ranuras = ['llave', 'pistola', 'escopeta'].map((arma, i) => {
      const x = 16 + i * 112, y = ALTO - 66;
      const fondo = this.add.rectangle(x, y, 104, 54, 0x231a33, 0.88).setOrigin(0).setStrokeStyle(2, 0xffffff);
      const ico = this.add.image(x + 18, y + 18, `ico_${arma}`);
      const nombre = this.add.text(x + 34, y + 6, `${i + 1} ${ARMAS[arma].nombre}`, { fontFamily: FUENTE, fontSize: '13px', fontStyle: 'bold', color: '#ffffff' });
      const muni = this.add.text(x + 8, y + 32, '', { fontFamily: FUENTE, fontSize: '15px', fontStyle: 'bold', color: '#ffd447' });
      return { arma, fondo, ico, nombre, muni };
    });
    // G: botiquines
    this.add.rectangle(ANCHO - 76, ALTO - 66, 60, 54, 0x231a33, 0.88).setOrigin(0).setStrokeStyle(2, 0xffffff);
    this.add.image(ANCHO - 46, ALTO - 48, 'botiquin').setScale(1.4);
    this.txtBotiquin = this.add.text(ANCHO - 46, ALTO - 28, '', { fontFamily: FUENTE, fontSize: '13px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5, 0);
    this.txtInfectados = this.add.text(ANCHO - 90, ALTO - 40, '', { ...T.hud, fontSize: '15px', color: '#ff8a8a' }).setOrigin(1, 0.5);

    // I: aviso de interacción
    this.aviso = this.add.text(ANCHO / 2, ALTO - 96, '', { fontFamily: FUENTE, fontSize: '16px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#000000', padding: { x: 10, y: 5 } }).setOrigin(0.5).setVisible(false);

    // mensajes
    this.msgGrande = this.add.text(ANCHO / 2, ALTO / 2 - 90, '', { ...T.titulo, fontSize: '40px', align: 'center' }).setOrigin(0.5).setAlpha(0);
    this.msgChico = this.add.text(ANCHO / 2, ALTO - 130, '', { fontFamily: FUENTE, fontSize: '17px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 4, align: 'center', wordWrap: { width: 760 } }).setOrigin(0.5).setAlpha(0);

    this.suscripciones = [];
    const on = (ev, fn) => { bus.on(ev, fn, this); this.suscripciones.push([ev, fn]); };
    on(EV.HUD_ACTUALIZAR, this.refrescar);
    on(EV.MENSAJE, this.mensaje);
    on(EV.AVISO_INTERACCION, (t) => { this.aviso.setText(t ?? '').setVisible(!!t); });
    on(EV.CUENTA_REGRESIVA, (s, n) => { this.cuenta = { s, n }; this.refrescar(); });
    on(EV.INICIO_OLEADA, () => { this.cuenta = null; this.refrescar(); });
    on(EV.SILENCIO, (m) => this.txtSilencio.setVisible(m));
    on(EV.JUGADOR_DANADO, () => {
      this.tweens.killTweensOf(this.destello);
      this.destello.setAlpha(0.22);
      this.tweens.add({ targets: this.destello, alpha: 0, duration: 250 });
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [ev, fn] of this.suscripciones) bus.off(ev, fn, this);
    });
    this.time.addEvent({ delay: 250, loop: true, callback: () => this.refrescar() });
    this.refrescar();
  }

  refrescar() {
    const n = this.nivel;
    if (!n || !n.vidas) return;
    const { vidas, inventario: inv, puntaje, oleadas } = n;

    this.circulosVida.forEach((c, i) => {
      c.setVisible(i < Math.max(JUGADOR.vidas, vidas.vidas));
      c.setFillStyle(i < vidas.vidas ? 0xd23030 : 0x3a3340);
    });
    this.txtVidas.setText(`x${vidas.vidas}`).setX(24 + Math.max(JUGADOR.vidas, vidas.vidas) * 26 - 4);
    const pct = vidas.salud / JUGADOR.salud;
    this.barraSalud.width = 200 * pct;
    this.barraSalud.setFillStyle(pct > 0.5 ? 0x5abf5a : pct > 0.25 ? 0xe3b52c : 0xd23030);
    this.txtSalud.setText(`${vidas.salud}/${JUGADOR.salud}`);

    if (oleadas) {
      const num = Math.max(1, oleadas.numero);
      this.txtOleada.setText(`OLEADA ${num}/${oleadas.total}  ·  ${n.horaNoche}`);
      const vivos = n.contarVivos();
      const pendientes = oleadas.estado === ESTADO.ACTIVA ? vivos + oleadas.cola.length : 0;
      this.txtInfectados.setText(pendientes > 0 ? `Infectados: ${pendientes}` : '');
      if ((oleadas.estado === ESTADO.ESPERA || oleadas.estado === ESTADO.DESCANSO) && oleadas.cuenta > 0) {
        this.txtCuenta.setText(`Oleada ${oleadas.numero + 1} en ${Math.ceil(oleadas.cuenta)} s`);
      } else if (oleadas.estado === ESTADO.TERMINADO) {
        this.txtCuenta.setText('¡Nivel completado!');
      } else this.txtCuenta.setText('');
    }
    this.txtPuntos.setText(`PUNTOS ${puntaje.total.toLocaleString('es-MX')}`);
    this.txtPesos.setText(`$ ${inv.pesos}`);

    for (const r of this.ranuras) {
      const desbloq = inv.desbloqueadas[r.arma];
      const actual = inv.armaActual === r.arma;
      r.fondo.setStrokeStyle(actual ? 3 : 2, actual ? 0xffd447 : (desbloq ? 0xffffff : 0x666070));
      r.ico.setAlpha(desbloq ? 1 : 0.3);
      r.nombre.setColor(desbloq ? '#ffffff' : '#777080');
      if (!desbloq) r.muni.setText('bloqueada').setColor('#777080');
      else if (r.arma === 'llave') r.muni.setText('∞').setColor('#ffd447');
      else if (actual && n.jugador.recargando) r.muni.setText('recargando…').setColor('#7fe9ff');
      else {
        const m = inv.municion[r.arma];
        r.muni.setText(`${m.cargador} / ${m.reserva}`).setColor(m.cargador === 0 ? '#ff6b6b' : '#ffd447');
      }
    }
    this.txtBotiquin.setText(`Q x${inv.botiquines}`);
  }

  /** @param {'grande'|'aviso'|'info'|'bien'|'dialogo'} tipo */
  mensaje(texto, tipo = 'info') {
    if (tipo === 'grande') {
      this.tweens.killTweensOf(this.msgGrande);
      this.msgGrande.setText(texto).setAlpha(1).setScale(0.8);
      this.tweens.add({ targets: this.msgGrande, scale: 1, duration: 180, ease: 'Back.easeOut' });
      this.tweens.add({ targets: this.msgGrande, alpha: 0, delay: 1700, duration: 500 });
      return;
    }
    const colores = { aviso: '#ffb347', info: '#ffffff', bien: '#8af08a', dialogo: '#ffe9a8' };
    this.tweens.killTweensOf(this.msgChico);
    this.msgChico.setText(texto).setColor(colores[tipo] ?? '#ffffff').setAlpha(1);
    this.tweens.add({ targets: this.msgChico, alpha: 0, delay: tipo === 'dialogo' ? 3500 : 1400, duration: 400 });
  }
}
