// Nivel 1: La gasolinera (12:00 a 2:00 AM). Sobrevivir tres oleadas defendiendo la tienda.
import { ANCHO, ALTO, MOSAICO, PROFUNDIDAD, ARMAS, OLEADAS_NIVEL1, PESOS, TIEMPO_OBJETIVO_NIVEL1 } from '../config.js';
import { bus, EV } from '../systems/Eventos.js';
import { Audio } from '../systems/Audio.js';
import { Inventario } from '../systems/Inventario.js';
import { Vidas } from '../systems/Vidas.js';
import { Puntaje } from '../systems/Puntaje.js';
import { Tienda } from '../systems/Tienda.js';
import { Oleadas, ESTADO } from '../systems/Oleadas.js';
import { Navegacion } from '../systems/Navegacion.js';
import { Jugador } from '../entities/Jugador.js';
import { Caminante } from '../entities/Caminante.js';
import { Corredor } from '../entities/Corredor.js';
import { Hinchado } from '../entities/Hinchado.js';
import { Bala } from '../entities/Bala.js';
import { Barril } from '../entities/Barril.js';
import { Recogible } from '../entities/Recogible.js';
import { FUENTE } from './estilos.js';

const CLASES = { caminante: Caminante, corredor: Corredor, hinchado: Hinchado };
const DISTANCIA_LUPE = 90;

export class Nivel1 extends Phaser.Scene {
  constructor() { super('Nivel1'); }

  init(data) {
    this.puntajePrevio = data?.puntajePrevio ?? 0;
  }

  create() {
    this.estado = { barreraPendiente: false };
    this.inventario = new Inventario();
    this.vidas = new Vidas();
    this.puntaje = new Puntaje(this.puntajePrevio);
    this.tiendaSistema = new Tienda(this.inventario, this.estado);
    this.tiempoNivel = 0;
    this.terminado = false;
    this.mouseSobreHUD = false;

    this.crearMapa();
    this.crearObjetos();
    this.jugador = new Jugador(this, this.inicio.x, this.inicio.y, this.inventario, this.vidas);
    this.crearGrupos();
    this.crearColisiones();
    this.crearIluminacion();

    this.cameras.main.setBounds(0, 0, this.mapa.widthInPixels, this.mapa.heightInPixels);
    this.cameras.main.startFollow(this.jugador, true, 0.12, 0.12);
    this.cameras.main.setRoundPixels(true);
    this.cameras.main.setZoom(1.25);
    this.cameras.main.fadeIn(500);

    this.oleadas = new Oleadas(OLEADAS_NIVEL1, (tipo, entrada) => this.crearEnemigo(tipo, entrada), () => this.contarVivos());
    this.oleadas.alPrepararOleada = (n, def) => this.colocarBarrera(def);

    this.registrarEventos();
    this.crearTeclas();

    this.scene.launch('HUD', { nivel: this });
    this.scene.bringToTop('HUD');
    this.musica = Audio.musica(this, 'musica_nivel1', 0.3);
    bus.emit(EV.MENSAJE, 'Aguanta hasta el amanecer', 'grande');
  }

  // ---------------------------------------------------------------- mapa
  crearMapa() {
    this.mapa = this.make.tilemap({ key: 'nivel1' });
    const ts = this.mapa.addTilesetImage('tileset', 'tileset');
    this.capaSuelo = this.mapa.createLayer('suelo', ts, 0, 0).setDepth(PROFUNDIDAD.suelo);
    this.capaMuros = this.mapa.createLayer('muros', ts, 0, 0).setDepth(PROFUNDIDAD.objetos);
    this.capaMuros.setCollisionByProperty({ colisiona: true });
    this.physics.world.setBounds(0, 0, this.mapa.widthInPixels, this.mapa.heightInPixels);

    this.navegacion = new Navegacion(this.mapa.width, this.mapa.height);
    this.capaMuros.forEachTile(t => { if (t.collides) this.navegacion.marcarCasilla(t.x, t.y); });
  }

  crearObjetos() {
    this.obstaculos = this.physics.add.staticGroup();
    this.barriles = this.physics.add.staticGroup();
    this.recogibles = [];
    this.entradas = {};
    this.luces = [];

    for (const o of this.mapa.getObjectLayer('objetos').objects) {
      const cx = o.x + o.width / 2, cy = o.y + o.height / 2;
      const prop = (n) => o.properties?.find(p => p.name === n)?.value;
      switch (o.name) {
        case 'jugador': this.inicio = { x: cx, y: cy }; break;
        case 'zonaSegura': this.zonaSegura = new Phaser.Geom.Rectangle(o.x, o.y, o.width, o.height); break;
        case 'entrada': this.entradas[prop('id')] = { x: cx, y: cy }; break;
        case 'lupe':
          this.lupe = this.add.sprite(cx, cy, 'lupe', 0).setRotation(Math.PI / 2).setDepth(PROFUNDIDAD.personajes);
          break;
        case 'neon': {
          const n = this.add.image(cx, cy, 'neon').setDepth(PROFUNDIDAD.objetos);
          this.tweens.add({ targets: n, alpha: 0.75, yoyo: true, repeat: -1, duration: 120, repeatDelay: 2600, hold: 60 });
          this.luces.push({ x: cx, y: cy + 10, escala: 1.6, color: 0xff7ad0 });
          break;
        }
        case 'bomba': {
          const b = this.obstaculos.create(cx, cy, 'bomba').setDepth(PROFUNDIDAD.objetos);
          b.body.setSize(24, 26).setOffset(4, 3);
          this.navegacion.marcarRect(o.x, o.y, o.width, o.height);
          this.luces.push({ x: cx, y: cy, escala: 2.2 });
          break;
        }
        case 'auto': {
          const a = this.obstaculos.create(cx, cy, 'auto').setDepth(PROFUNDIDAD.objetos);
          a.body.setSize(88, 40).setOffset(4, 4);
          this.navegacion.marcarRect(o.x, o.y, o.width, o.height);
          break;
        }
        case 'cactus': {
          const c = this.obstaculos.create(cx, cy, 'cactus').setDepth(PROFUNDIDAD.objetos + 1);
          c.body.setSize(14, 14).setOffset(9, 32);
          this.navegacion.marcarRect(cx - 7, o.y + 32, 14, 14);
          break;
        }
        case 'barril': {
          this.barriles.add(new Barril(this, cx, cy));
          this.navegacion.marcarRect(o.x, o.y, 32, 32);
          break;
        }
        case 'municion':
        case 'botiquin':
          this.recogibles.push(new Recogible(this, cx, cy, o.name));
          break;
      }
    }
    // ventanas iluminadas de la tienda
    this.capaMuros.forEachTile(t => { if (t.index === 11) this.luces.push({ x: t.pixelX + 16, y: t.pixelY + 40, escala: 1.3 }); });

    this.marcasEntrada = {};
    for (const [id, p] of Object.entries(this.entradas)) {
      const m = this.add.text(p.x, p.y, id, { fontFamily: FUENTE, fontSize: '16px', fontStyle: 'bold', color: '#ffffff', backgroundColor: '#b51f1f', padding: { x: 5, y: 2 } })
        .setOrigin(0.5).setDepth(PROFUNDIDAD.efectos).setAlpha(0);
      this.marcasEntrada[id] = m;
    }
  }

  crearGrupos() {
    this.enemigos = this.physics.add.group();
    this.balas = this.physics.add.group({ classType: Bala, maxSize: 80, runChildUpdate: false });
    this.barreras = this.physics.add.staticGroup();
  }

  crearColisiones() {
    const f = this.physics;
    const solidos = [this.capaMuros, this.obstaculos, this.barriles, this.barreras];
    for (const s of solidos) {
      f.add.collider(this.jugador, s);
      f.add.collider(this.enemigos, s);
    }
    // los infectados se separan para no amontonarse (bloqueo suave)
    f.add.collider(this.enemigos, this.enemigos);

    const apagar = (bala) => bala.apagar();
    f.add.collider(this.balas, this.capaMuros, apagar);
    f.add.overlap(this.balas, this.obstaculos, apagar);
    f.add.overlap(this.balas, this.barreras, apagar);
    f.add.overlap(this.balas, this.barriles, (bala, barril) => {
      if (!bala.active) return;
      bala.apagar();
      barril.explotar();
    });
    f.add.overlap(this.balas, this.enemigos, (bala, enemigo) => {
      if (!bala.active || !enemigo.vivo) return;
      bala.apagar();                        // la bala desaparece: daño una sola vez
      enemigo.recibirDanio(bala.danio, 'bala', bala.rotation);
    });
    f.add.overlap(this.jugador, this.enemigos, (j, enemigo) => enemigo.intentarAtacar(j, this.time.now));
    for (const r of this.recogibles) f.add.overlap(this.jugador, r, () => this.recoger(r));
  }

  crearIluminacion() {
    // noche: un velo azul que multiplica y luces que suman encima
    this.add.rectangle(0, 0, this.mapa.widthInPixels, this.mapa.heightInPixels, 0x5a5a96)
      .setOrigin(0).setBlendMode(Phaser.BlendModes.MULTIPLY).setDepth(PROFUNDIDAD.techo);
    for (const l of this.luces) {
      const img = this.add.image(l.x, l.y, 'luz').setScale(l.escala).setBlendMode(Phaser.BlendModes.ADD).setDepth(PROFUNDIDAD.techo + 1);
      if (l.color) img.setTint(l.color);
    }
    this.luzJugador = this.add.image(0, 0, 'luz').setScale(2.6).setAlpha(0.8).setBlendMode(Phaser.BlendModes.ADD).setDepth(PROFUNDIDAD.techo + 1);
  }

  crearTeclas() {
    // al volver de la tienda o de la pausa, la misma tecla que la cerró no debe reabrirla
    this.teclasBloqueadasHasta = 0;
    this.events.on(Phaser.Scenes.Events.RESUME, () => { this.teclasBloqueadasHasta = performance.now() + 250; });
    const k = this.input.keyboard;
    k.on('keydown-E', () => this.interactuar());
    k.on('keydown-ESC', () => this.pausar());
    k.on('keydown-P', () => this.pausar());
    this.input.mouse?.disableContextMenu();
  }

  // ---------------------------------------------------------------- eventos
  registrarEventos() {
    this.suscripciones = [];
    const on = (ev, fn) => { bus.on(ev, fn, this); this.suscripciones.push([ev, fn]); };
    on(EV.INICIO_OLEADA, this.alIniciarOleada);
    on(EV.FIN_OLEADA, this.alTerminarOleada);
    on(EV.CUENTA_REGRESIVA, (s) => {
      if (s > 0 && s <= 5) Audio.efecto(this, 'clic', { volume: 0.3, detune: 1200 });
    });
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      for (const [ev, fn] of this.suscripciones) bus.off(ev, fn, this);
    });
  }

  alIniciarOleada(n, def) {
    Audio.efecto(this, 'sirena');
    bus.emit(EV.MENSAJE, `Oleada ${n}`, 'grande');
    this.recogibles.forEach(r => r.reponer());
    for (const id of def.entradas) {
      const m = this.marcasEntrada[id];
      if (!m || this.oleadas.entradasBloqueadas.has(id)) continue;
      this.tweens.add({ targets: m, alpha: { from: 1, to: 0.25 }, yoyo: true, repeat: 5, duration: 300, onComplete: () => m.setAlpha(0) });
    }
    this.musica?.setRate?.(1 + (n - 1) * 0.05);  // la música sube con cada oleada
    bus.emit(EV.HUD_ACTUALIZAR);
  }

  alTerminarOleada(n, sinDanio, ultima) {
    const pts = this.puntaje.oleadaSuperada(n, sinDanio);
    this.inventario.agregarPesos(PESOS.oleadaSuperada);
    this.quitarBarreras();
    bus.emit(EV.MENSAJE, `¡Oleada ${n} superada!  +${pts}${sinDanio ? ' (sin daño)' : ''}  +$${PESOS.oleadaSuperada}`, 'grande');
    Audio.efecto(this, 'compra');

    if (n === 1 && !this.inventario.desbloqueadas.pistola) {
      this.inventario.desbloquear('pistola', ARMAS.pistola.cargador, 24);
      this.inventario.cambiarArma('pistola');
      this.time.delayedCall(1800, () => {
        bus.emit(EV.MENSAJE, 'Doña Lupe: «¡Ya las encontré! Tenla, y no la desperdicies.»  [2] Pistola', 'dialogo');
        this.lupe.setFrame(1);
        this.time.delayedCall(2500, () => this.lupe.setFrame(0));
      });
    } else if (!ultima) {
      this.time.delayedCall(1800, () => bus.emit(EV.MENSAJE, 'Ve con Doña Lupe a la tienda [E] antes de la siguiente oleada', 'dialogo'));
    }
    if (ultima) this.completarNivel();
    bus.emit(EV.HUD_ACTUALIZAR);
  }

  completarNivel() {
    if (this.terminado) return;
    this.terminado = true;
    this.puntaje.nivelCompletado(TIEMPO_OBJETIVO_NIVEL1, this.tiempoNivel);
    this.inventario.agregarPesos(PESOS.nivelCompletado);
    bus.emit(EV.NIVEL_COMPLETADO, this.puntaje.total);
    this.time.delayedCall(2600, () => {
      bus.emit(EV.MENSAJE, 'Más tarde… 3:00 AM', 'grande');
      this.cameras.main.fadeOut(1800, 0, 0, 0);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        this.scene.stop('HUD');
        this.scene.start('Victoria', this.resumen());
      });
    });
  }

  resumen() {
    return {
      total: this.puntaje.total,
      desglose: this.puntaje.desglose(),
      tiempo: Math.round(this.tiempoNivel),
      vidas: this.vidas.vidas,
      puntajePrevio: this.puntajePrevio,
    };
  }

  // ---------------------------------------------------------------- enemigos
  crearEnemigo(tipo, entradaId) {
    const p = this.entradas[entradaId];
    const x = Phaser.Math.Clamp(p.x + Phaser.Math.Between(-14, 14), 16, this.mapa.widthInPixels - 16);
    const y = Phaser.Math.Clamp(p.y + Phaser.Math.Between(-14, 14), 16, this.mapa.heightInPixels - 16);
    const e = new CLASES[tipo](this, x, y);
    this.enemigos.add(e);
    e.body.setCollideWorldBounds(true);
    e.rotation = Phaser.Math.Angle.Between(x, y, this.jugador.x, this.jugador.y);
    return e;
  }

  contarVivos() {
    return this.enemigos.getChildren().filter(e => e.vivo).length;
  }

  /** enemigoEliminado: suma puntos y pesos una sola vez. */
  alEliminarEnemigo(e) {
    const pts = this.puntaje.registrarBaja(e);
    if (pts <= 0) return;
    this.inventario.agregarPesos(e.datos.pesos);
    this.textoFlotante(e.x, e.y - 10, `+${pts}`, '#ffffff');
    this.textoFlotante(e.x, e.y + 8, `+$${e.datos.pesos}`, '#ffd447', 200);
    this.monedas(e.x, e.y);
    bus.emit(EV.ENEMIGO_ELIMINADO, e.tipo, pts);
    if (this.puntaje.revisarVidaExtra() && this.vidas.ganarVida()) {
      bus.emit(EV.VIDA_EXTRA);
      bus.emit(EV.MENSAJE, '¡Vida extra!', 'bien');
    }
    bus.emit(EV.HUD_ACTUALIZAR);
  }

  // ---------------------------------------------------------------- combate
  disparar(x, y, angulo, danio) {
    const b = this.balas.get(x, y);
    if (b) b.disparar(x, y, angulo, ARMAS.pistola.velocidadBala, danio);
  }

  golpeLlave(jugador) {
    if (!jugador.activoEnJuego) return;
    const d = ARMAS.llave;
    const golpeados = new Set();
    for (const e of this.enemigos.getChildren()) {
      if (!e.vivo || golpeados.has(e)) continue;
      const dist = Phaser.Math.Distance.Between(jugador.x, jugador.y, e.x, e.y);
      if (dist > d.alcance + 12) continue;
      const ang = Phaser.Math.Angle.Between(jugador.x, jugador.y, e.x, e.y);
      const dif = Math.abs(Phaser.Math.Angle.Wrap(ang - jugador.rotation));
      if (dif > Phaser.Math.DegToRad(d.arco / 2)) continue;
      golpeados.add(e);
      e.recibirDanio(d.danio, 'llave', ang);
    }
    // estela del golpe
    const g = this.add.graphics().setDepth(PROFUNDIDAD.efectos);
    g.lineStyle(3, 0xffffff, 0.7);
    g.beginPath();
    g.arc(jugador.x, jugador.y, d.alcance - 6, jugador.rotation - Phaser.Math.DegToRad(d.arco / 2), jugador.rotation + Phaser.Math.DegToRad(d.arco / 2));
    g.strokePath();
    this.tweens.add({ targets: g, alpha: 0, duration: 140, onComplete: () => g.destroy() });
  }

  fogonazo(x, y, ang) {
    const f = this.add.image(x + Math.cos(ang) * 6, y + Math.sin(ang) * 6, 'fogonazo').setRotation(ang).setDepth(PROFUNDIDAD.efectos).setBlendMode(Phaser.BlendModes.ADD);
    this.time.delayedCall(50, () => f.destroy());
  }

  /** Daño en área de barriles y del hinchado. */
  explosion(x, y, { radio, danioInfectados, danioJugador, causa }) {
    const ex = this.add.sprite(x, y, 'explosion').setDepth(PROFUNDIDAD.efectos).setScale(radio / 40);
    ex.play('explosion');
    ex.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => ex.destroy());
    const mancha = this.add.circle(x, y, radio * 0.45, 0x1a1414, 0.45).setDepth(PROFUNDIDAD.charcos);
    this.tweens.add({ targets: mancha, alpha: 0, delay: 6000, duration: 2000, onComplete: () => mancha.destroy() });
    Audio.efecto(this, 'explosion');
    this.cameras.main.shake(220, 0.008);
    if (causa === 'barril') bus.emit(EV.EXPLOSION_BARRIL, x, y);

    for (const e of [...this.enemigos.getChildren()]) {
      if (e.vivo && Phaser.Math.Distance.Between(x, y, e.x, e.y) <= radio) {
        e.recibirDanio(danioInfectados, causa, Phaser.Math.Angle.Between(x, y, e.x, e.y));
      }
    }
    if (this.jugador.activoEnJuego && Phaser.Math.Distance.Between(x, y, this.jugador.x, this.jugador.y) <= radio) {
      this.danarJugador(danioJugador, { tipo: causa });
    }
    // reacción en cadena con otros barriles
    for (const b of [...this.barriles.getChildren()]) {
      if (!b.explotado && Phaser.Math.Distance.Between(x, y, b.x, b.y) <= radio) {
        this.time.delayedCall(140, () => b.active && b.explotar());
      }
    }
  }

  /** jugadorDañado. Devuelve true si el golpe sí se aplicó. */
  danarJugador(cantidad, fuente) {
    if (!this.jugador.activoEnJuego || this.terminado) return false;
    const r = this.vidas.recibirDanio(cantidad, this.time.now);
    if (r === 'ignorado') return false;
    this.puntaje.golpeRecibido();
    this.oleadas.recibioDanio = true;
    Audio.efecto(this, 'dano');
    this.cameras.main.shake(120, 0.005);
    this.textoFlotante(this.jugador.x, this.jugador.y - 18, `-${cantidad}`, '#ff5050');
    bus.emit(EV.JUGADOR_DANADO, cantidad, fuente?.tipo);
    bus.emit(EV.HUD_ACTUALIZAR);
    if (r === 'muerto') this.perderVida();
    return true;
  }

  /** vidaPerdida: −500, reaparece en la tienda o Game Over. */
  perderVida() {
    const j = this.jugador;
    j.activoEnJuego = false;
    j.setVelocity(0, 0);
    this.puntaje.vidaPerdida();
    Audio.efecto(this, 'vidaPerdida');
    bus.emit(EV.MENSAJE, '¡Marco cayó!', 'grande');
    this.tweens.add({ targets: j, angle: j.angle + 90, alpha: 0.4, duration: 600 });

    this.time.delayedCall(1500, () => {
      const quedan = this.vidas.perderVida(this.time.now);
      bus.emit(EV.VIDA_PERDIDA, this.vidas.vidas);
      if (!quedan) return this.gameOver();
      // la oleada en curso se reinicia; se conservan armas, munición y pesos
      if (this.oleadas.estado === ESTADO.ACTIVA) {
        for (const e of this.enemigos.getChildren()) { e.vivo = false; e.puntuado = true; }
        this.enemigos.clear(true, true);
        this.oleadas.reiniciarOleadaActual();
        bus.emit(EV.MENSAJE, `Te quedan ${this.vidas.vidas} vidas · la oleada se reinicia`, 'grande');
      } else {
        bus.emit(EV.MENSAJE, `Te quedan ${this.vidas.vidas} vidas`, 'grande');
      }
      j.setPosition(this.inicio.x, this.inicio.y).setAlpha(1).setAngle(0);
      j.activoEnJuego = true;
      bus.emit(EV.HUD_ACTUALIZAR);
    });
  }

  gameOver() {
    this.terminado = true;
    bus.emit(EV.GAME_OVER, this.puntaje.total);
    this.cameras.main.fadeOut(900, 40, 0, 0);
    this.cameras.main.once('camerafadeoutcomplete', () => {
      this.scene.stop('HUD');
      this.scene.start('GameOver', this.resumen());
    });
  }

  // ---------------------------------------------------------------- objetos
  recoger(r) {
    if (!r.disponible || !this.jugador.activoEnJuego) return;
    if (r.tipo === 'municion') {
      if (!this.inventario.desbloqueadas.pistola) return this.avisoUnaVez(r, 'Todavía no tienes pistola');
      const entra = this.inventario.agregarMunicion('pistola', 12);
      if (entra === 0) return this.avisoUnaVez(r, 'Reserva llena (máx. 60)');
      this.textoFlotante(r.x, r.y - 10, `+${entra} balas`, '#ffd447');
    } else {
      if (this.inventario.agregarBotiquin()) {
        this.textoFlotante(r.x, r.y - 10, '+1 botiquín [Q]', '#ffffff');
      } else if (this.vidas.curar(30)) {
        this.textoFlotante(r.x, r.y - 10, '+30 salud', '#7fe07f');
      } else return this.avisoUnaVez(r, 'Botiquines llenos');
    }
    r.recoger();
    Audio.efecto(this, 'recoger');
    bus.emit(EV.OBJETO_RECOGIDO, r.tipo);
    bus.emit(EV.HUD_ACTUALIZAR);
  }

  avisoUnaVez(r, texto) {
    const ahora = this.time.now;
    if ((r.ultimoAviso ?? 0) + 2000 > ahora) return;
    r.ultimoAviso = ahora;
    bus.emit(EV.MENSAJE, texto, 'aviso');
  }

  // ---------------------------------------------------------------- barrera
  colocarBarrera(def) {
    if (!this.estado.barreraPendiente) return;
    // bloquea la entrada activa más cercana a Marco
    const candidatas = def.entradas.length > 1 ? def.entradas : [];
    if (candidatas.length === 0) return;
    const id = candidatas.reduce((a, b) => (
      Phaser.Math.Distance.BetweenPoints(this.entradas[a], this.jugador) <= Phaser.Math.Distance.BetweenPoints(this.entradas[b], this.jugador) ? a : b));
    const p = this.entradas[id];
    const vertical = p.x < 40 || p.x > this.mapa.widthInPixels - 40;
    const bx = vertical ? (p.x < 40 ? p.x + 16 : p.x - 16) : p.x;
    const by = vertical ? p.y : p.y + 16;
    const barrera = this.barreras.create(bx, by, 'barrera').setDepth(PROFUNDIDAD.objetos);
    if (vertical) { barrera.setAngle(90); barrera.body.setSize(32, 64); }
    barrera.refreshBody?.();
    if (vertical) barrera.body.setSize(32, 64).setOffset(16, -16);
    this.oleadas.entradasBloqueadas.add(id);
    bus.emit(EV.MENSAJE, `La barrera de tablas bloquea la entrada ${id}`, 'bien');
  }

  quitarBarreras() {
    if (this.barreras.getLength() > 0) {
      this.barreras.clear(true, true);
      this.estado.barreraPendiente = false;
    }
  }

  // ---------------------------------------------------------------- tienda y pausa
  puedeAbrirTienda() {
    return this.oleadas.estado === ESTADO.DESCANSO && this.jugador.activoEnJuego && !this.terminado
      && Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.lupe.x, this.lupe.y) <= DISTANCIA_LUPE;
  }

  interactuar() {
    if (performance.now() < this.teclasBloqueadasHasta || !this.puedeAbrirTienda()) return;
    this.jugador.setVelocity(0, 0);
    this.ultimoAviso = null;
    bus.emit(EV.AVISO_INTERACCION, null);
    this.scene.pause();
    this.scene.launch('TiendaEscena', { nivel: this });
    Audio.musica(this, 'musica_tienda', 0.3);
  }

  alCerrarTienda() {
    this.oleadas.tiendaCerrada();
    this.musica = Audio.musica(this, 'musica_nivel1', 0.3);
    this.musica?.setRate?.(1 + this.oleadas.numero * 0.05);
    this.scene.resume();
    bus.emit(EV.HUD_ACTUALIZAR);
  }

  pausar() {
    if (this.terminado || performance.now() < this.teclasBloqueadasHasta) return;
    this.scene.pause();
    this.scene.launch('Pausa');
  }

  // ---------------------------------------------------------------- utilidades visuales
  textoFlotante(x, y, texto, color, retraso = 0) {
    const t = this.add.text(x, y, texto, { fontFamily: FUENTE, fontSize: '15px', fontStyle: 'bold', color, stroke: '#000000', strokeThickness: 3 })
      .setOrigin(0.5).setDepth(PROFUNDIDAD.techo + 5);
    this.tweens.add({ targets: t, y: y - 26, alpha: 0, delay: retraso, duration: 900, onComplete: () => t.destroy() });
  }

  monedas(x, y) {
    for (let i = 0; i < 3; i++) {
      const m = this.add.image(x, y, 'peso').setDepth(PROFUNDIDAD.efectos);
      this.tweens.add({
        targets: m, x: x + Phaser.Math.Between(-18, 18), y: y + Phaser.Math.Between(-18, 18), duration: 200,
        onComplete: () => this.tweens.add({ targets: m, x: this.jugador.x, y: this.jugador.y, alpha: 0.2, duration: 300, delay: 100, onComplete: () => m.destroy() }),
      });
    }
    Audio.efecto(this, 'recoger', { volume: 0.25, detune: 600 });
  }

  /** Hora de la noche: el nivel va de 12:00 a 2:00 AM. */
  get horaNoche() {
    const min = Math.min(119, Math.floor(this.tiempoNivel / 3));  // 1 s real = 20 s de juego
    const h = Math.floor(min / 60), m = min % 60;
    return `${h === 0 ? 12 : h}:${String(m).padStart(2, '0')} AM`;
  }

  update(time, delta) {
    if (!this.terminado) this.tiempoNivel += delta / 1000;
    this.jugador.update(time);
    this.luzJugador.setPosition(this.jugador.x, this.jugador.y);
    if (this.jugador.activoEnJuego) this.navegacion.actualizar(this.jugador.x, this.jugador.y, time);
    for (const e of this.enemigos.getChildren()) e.update(time, delta);
    if (!this.terminado) this.oleadas.update(delta);

    // aviso de interacción con Doña Lupe
    const cerca = Phaser.Math.Distance.Between(this.jugador.x, this.jugador.y, this.lupe.x, this.lupe.y) <= DISTANCIA_LUPE;
    let aviso = null;
    if (cerca && this.puedeAbrirTienda()) aviso = '[E] Abrir tienda';
    else if (cerca && this.oleadas.estado === ESTADO.ACTIVA) aviso = 'Doña Lupe: «¡Primero acaba con esos!»';
    if (aviso !== this.ultimoAviso) { this.ultimoAviso = aviso; bus.emit(EV.AVISO_INTERACCION, aviso); }
  }
}
