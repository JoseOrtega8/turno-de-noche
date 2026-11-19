// Marco Ruiz, el jugador (GDD 4.4 y 4.5.1).
import { JUGADOR, ARMAS, PROFUNDIDAD } from '../config.js';
import { Audio } from '../systems/Audio.js';
import { bus, EV } from '../systems/Eventos.js';

export class Jugador extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene
   * @param {import('../systems/Inventario.js').Inventario} inventario
   * @param {import('../systems/Vidas.js').Vidas} vidas
   */
  constructor(scene, x, y, inventario, vidas) {
    super(scene, x, y, 'marco', 0);
    this.inv = inventario;
    this.vidas = vidas;
    this.activoEnJuego = true;
    this.siguienteAtaque = 0;
    this.recargando = false;
    this.timerRecarga = null;
    this.atacandoHasta = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(PROFUNDIDAD.personajes + 1);
    this.body.setCircle(10, 5, 6);
    this.body.setCollideWorldBounds(true);

    const k = scene.input.keyboard;
    this.teclas = k.addKeys({ arriba: 'W', abajo: 'S', izq: 'A', der: 'D', recargar: 'R', botiquin: 'Q', uno: 'ONE', dos: 'TWO', tres: 'THREE' });
    this.teclas.recargar.on('down', () => this.recargar());
    this.teclas.botiquin.on('down', () => this.usarBotiquin());
    this.teclas.uno.on('down', () => this.cambiarArma('llave'));
    this.teclas.dos.on('down', () => this.cambiarArma('pistola'));
    this.teclas.tres.on('down', () => this.cambiarArma('escopeta'));
    scene.input.on('wheel', (p, objs, dx, dy) => {
      if (!this.activoEnJuego) return;
      if (this.inv.ciclarArma(dy > 0 ? 1 : -1)) this.alCambiarArma();
    });
  }

  get puntaMira() {
    // punta del arma, para que la bala salga de la mano y no del centro
    const a = this.rotation;
    return { x: this.x + Math.cos(a) * 16 - Math.sin(a) * 6, y: this.y + Math.sin(a) * 16 + Math.cos(a) * 6 };
  }

  update(time) {
    if (!this.activoEnJuego) { this.setVelocity(0, 0); return; }
    const t = this.teclas;
    const v = new Phaser.Math.Vector2(
      (t.der.isDown ? 1 : 0) - (t.izq.isDown ? 1 : 0),
      (t.abajo.isDown ? 1 : 0) - (t.arriba.isDown ? 1 : 0),
    );
    // en diagonal se normaliza para no ir más rápido
    v.normalize().scale(JUGADOR.velocidad);
    this.setVelocity(v.x, v.y);

    // gira hacia el cursor
    const p = this.scene.input.activePointer;
    const mundo = this.scene.cameras.main.getWorldPoint(p.x, p.y);
    this.rotation = Phaser.Math.Angle.Between(this.x, this.y, mundo.x, mundo.y);

    if (p.isDown && p.button === 0 && !this.scene.mouseSobreHUD) this.atacar(time);

    // animación
    if (time > this.atacandoHasta) {
      const arma = this.inv.armaActual === 'llave' ? 'llave' : 'pistola';
      if (v.lengthSq() > 0) this.anims.play(`marco-caminar-${arma}`, true);
      else { this.anims.stop(); this.setFrame(arma === 'llave' ? 1 : 7); }
    }

    // parpadea mientras es invulnerable
    this.setAlpha(this.vidas.esInvulnerable(time) ? (Math.floor(time / 80) % 2 ? 0.35 : 1) : 1);
  }

  atacar(time) {
    if (time < this.siguienteAtaque) return;
    const arma = this.inv.armaActual;
    const datos = ARMAS[arma];
    if (arma === 'llave') {
      this.siguienteAtaque = time + 1000 / datos.cadencia;
      this.atacandoHasta = time + 220;
      this.anims.play('marco-llave', true);
      Audio.efecto(this.scene, 'llave');
      this.scene.time.delayedCall(90, () => this.scene.golpeLlave(this));
      return;
    }
    if (this.recargando) return;
    if (!this.inv.gastarBala(arma)) {
      // sin munición: suena un clic y no dispara
      this.siguienteAtaque = time + 300;
      Audio.efecto(this.scene, 'clic');
      bus.emit(EV.MENSAJE, this.inv.puedeRecargar() ? 'Sin balas · R para recargar' : 'Sin munición', 'aviso');
      return;
    }
    this.siguienteAtaque = time + 1000 / datos.cadencia;
    this.atacandoHasta = time + 90;
    this.setFrame(10);
    const p = this.puntaMira;
    if (arma === 'escopeta') {
      for (let i = 0; i < datos.perdigones; i++) {
        this.scene.disparar(p.x, p.y, this.rotation + Phaser.Math.DegToRad(-16 + i * 8), datos.danio);
      }
    } else {
      this.scene.disparar(p.x, p.y, this.rotation + Phaser.Math.FloatBetween(-0.03, 0.03), datos.danio);
    }
    this.scene.fogonazo(p.x, p.y, this.rotation);
    Audio.efecto(this.scene, 'disparo', { detune: Phaser.Math.Between(-100, 100) });
    bus.emit(EV.HUD_ACTUALIZAR);
  }

  recargar() {
    const arma = this.inv.armaActual;
    if (!this.activoEnJuego || this.recargando || !this.inv.puedeRecargar(arma)) return;
    this.recargando = true;
    bus.emit(EV.MENSAJE, 'Recargando…', 'info');
    bus.emit(EV.HUD_ACTUALIZAR);
    this.timerRecarga = this.scene.time.delayedCall(ARMAS[arma].recarga, () => {
      this.inv.recargar(arma);
      this.recargando = false;
      Audio.efecto(this.scene, 'clic', { detune: -600 });
      bus.emit(EV.HUD_ACTUALIZAR);
    });
  }

  cambiarArma(arma) {
    if (!this.activoEnJuego) return;
    if (!this.inv.desbloqueadas[arma]) {
      bus.emit(EV.MENSAJE, `${ARMAS[arma].nombre}: bloqueada`, 'aviso');
      return;
    }
    if (this.inv.cambiarArma(arma)) this.alCambiarArma();
  }

  alCambiarArma() {
    // cambiar de arma cancela la recarga en curso
    if (this.timerRecarga) { this.timerRecarga.remove(); this.timerRecarga = null; }
    this.recargando = false;
    this.siguienteAtaque = this.scene.time.now + 150;
    bus.emit(EV.HUD_ACTUALIZAR);
  }

  usarBotiquin() {
    if (!this.activoEnJuego) return;
    if (this.vidas.salud >= JUGADOR.salud) { bus.emit(EV.MENSAJE, 'Salud completa', 'aviso'); return; }
    if (!this.inv.usarBotiquin()) { bus.emit(EV.MENSAJE, 'No tienes botiquines', 'aviso'); return; }
    this.vidas.curar(JUGADOR.botiquinCura);
    Audio.efecto(this.scene, 'recoger', { detune: 300 });
    bus.emit(EV.MENSAJE, `+${JUGADOR.botiquinCura} de salud`, 'bien');
    bus.emit(EV.HUD_ACTUALIZAR);
  }
}
