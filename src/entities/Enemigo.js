// Clase base de los infectados (GDD 4.4 y 4.5.4).
// Caminante, Corredor e Hinchado heredan de aquí y solo cambian lo que los hace distintos.
import { ENEMIGOS, PROFUNDIDAD } from '../config.js';
import { Audio } from '../systems/Audio.js';

export class Enemigo extends Phaser.Physics.Arcade.Sprite {
  /**
   * @param {Phaser.Scene} scene escena Nivel
   * @param {string} tipo 'caminante' | 'corredor' | 'hinchado'
   */
  constructor(scene, x, y, tipo) {
    super(scene, x, y, tipo, 0);
    this.tipo = tipo;
    this.datos = ENEMIGOS[tipo];
    this.salud = this.datos.salud;
    this.vivo = true;
    this.puntuado = false;          // el puntaje se suma una sola vez (CA-09)
    this.causaMuerte = null;
    this.siguienteAtaque = 0;
    this.pausadoHasta = 0;
    this.atascadoMs = 0;
    this.desvio = null;             // dirección de escape cuando se atora en un borde
    this.desvioHasta = 0;
    this.retrocesoHasta = 0;

    scene.add.existing(this);
    scene.physics.add.existing(this);
    this.setDepth(PROFUNDIDAD.personajes);
    this.body.setCircle(10, 6, 6);
    this.body.setCollideWorldBounds(true);
    this.body.setBounce(0);
    this.play(`${tipo}-caminar`);
    this.anims.setProgress(Math.random());
  }

  /** Velocidad en px/s; las subclases la pueden cambiar según su estado. */
  velocidadActual() { return this.datos.velocidad; }

  /** Comportamiento por cuadro: perseguir al jugador. */
  update(time, delta) {
    if (!this.vivo) return;
    if (time < this.retrocesoHasta) return;   // dejarse empujar por el golpe
    const jugador = this.scene.jugador;
    if (!jugador || !jugador.activoEnJuego || time < this.pausadoHasta) {
      this.setVelocity(0, 0);
      this.anims.pause();
      return;
    }
    if (this.anims.isPaused) this.anims.resume();

    const destino = this.elegirDestino(jugador);
    let ang = Phaser.Math.Angle.Between(this.x, this.y, destino.x, destino.y);

    // si choca con un obstáculo se desliza por su borde
    if (this.desvio !== null && time < this.desvioHasta) {
      ang = this.desvio;
    } else {
      this.desvio = null;
      const b = this.body;
      const frenado = b.speed < this.velocidadActual() * 0.35;
      const tocando = !b.blocked.none || !b.touching.none;
      this.atascadoMs = (frenado && tocando) ? this.atascadoMs + delta : 0;
      if (this.atascadoMs > 250) {
        // gira 90° hacia el lado que acerque más al jugador
        const a1 = ang + Math.PI / 2, a2 = ang - Math.PI / 2;
        const d1 = Phaser.Math.Distance.Between(this.x + Math.cos(a1) * 32, this.y + Math.sin(a1) * 32, jugador.x, jugador.y);
        const d2 = Phaser.Math.Distance.Between(this.x + Math.cos(a2) * 32, this.y + Math.sin(a2) * 32, jugador.x, jugador.y);
        this.desvio = d1 < d2 ? a1 : a2;
        this.desvioHasta = time + 400;
        this.atascadoMs = 0;
      }
    }

    const v = this.velocidadActual();
    this.setVelocity(Math.cos(ang) * v, Math.sin(ang) * v);
    this.rotation = Phaser.Math.Angle.RotateTo(this.rotation, ang, 0.15);
  }

  /** Línea recta si ve al jugador; si no, el siguiente paso del campo de flujo. */
  elegirDestino(jugador) {
    const nav = this.scene.navegacion;
    if (!nav || nav.hayLineaDeVista(this.x, this.y, jugador.x, jugador.y)) return jugador;
    return nav.siguientePaso(this.x, this.y) ?? jugador;
  }

  /** Se llama mientras el infectado toca a Marco. Ataca una vez por segundo. */
  intentarAtacar(jugador, time) {
    if (!this.vivo || time < this.siguienteAtaque || time < this.pausadoHasta) return;
    this.siguienteAtaque = time + 1000;
    const recibio = this.scene.danarJugador(this.datos.danio, this);
    if (recibio) this.alGolpear(time);
  }

  /** Gancho para las subclases (el corredor se detiene después de golpear). */
  alGolpear(time) {}

  /**
   * Aplica daño una sola vez por impacto (CA-03).
   * @param {number} cantidad
   * @param {'llave'|'bala'|'barril'|'hinchado'} causa
   * @param {number} [angulo] dirección del golpe para el retroceso
   */
  recibirDanio(cantidad, causa, angulo) {
    if (!this.vivo) return false;
    this.salud -= cantidad;
    this.setTint(0xffffff).setTintMode(Phaser.TintModes.FILL);
    this.scene.time.delayedCall(70, () => { if (this.active) this.clearTint().setTintMode(Phaser.TintModes.MULTIPLY); });
    if (angulo !== undefined && this.body) {
      this.setVelocity(Math.cos(angulo) * 160, Math.sin(angulo) * 160);
      this.retrocesoHasta = this.scene.time.now + 90;
    }
    if (this.salud <= 0) this.morir(causa);
    else Audio.efecto(this.scene, 'impacto', { volume: 0.4 });
    return true;
  }

  morir(causa) {
    if (!this.vivo) return;
    this.vivo = false;
    this.causaMuerte = causa;
    this.body.enable = false;
    this.setVelocity(0, 0);
    this.scene.alEliminarEnemigo(this);
    this.animacionMuerte();
  }

  /** Animación de desaparición: cae, queda un charco y se desvanece. */
  animacionMuerte() {
    Audio.efecto(this.scene, 'grunido', { detune: Phaser.Math.Between(-300, 300), volume: 0.35 });
    this.setDepth(PROFUNDIDAD.charcos);
    this.play(`${this.tipo}-morir`);
    this.once(Phaser.Animations.Events.ANIMATION_COMPLETE, () => {
      this.scene.tweens.add({ targets: this, alpha: 0, delay: 2500, duration: 1200, onComplete: () => this.destroy() });
    });
  }
}
