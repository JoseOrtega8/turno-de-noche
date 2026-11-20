// Envoltura del audio: nunca truena si el navegador bloquea la reproducción automática (CA-10)
// y permite silenciar todo con M (CA-10, P-13).
import { bus, EV } from './Eventos.js';

export const SONIDOS = ['disparo', 'clic', 'llave', 'impacto', 'grunido', 'explosion', 'recoger',
  'compra', 'error', 'dano', 'vidaPerdida', 'sirena', 'aviso'];
export const MUSICAS = ['musica_menu', 'musica_nivel1', 'musica_tienda', 'musica_victoria', 'musica_derrota'];

const VOL = { disparo: 0.5, explosion: 0.8, grunido: 0.5, sirena: 0.5, clic: 0.6 };

export class Audio {
  static cargar(scene) {
    for (const s of [...SONIDOS, ...MUSICAS]) {
      scene.load.audio(s, [`assets/audio/${s}.ogg`, `assets/audio/${s}.mp3`]);
    }
  }

  static efecto(scene, clave, config = {}) {
    try {
      if (!scene.cache.audio.exists(clave)) return;
      scene.sound.play(clave, { volume: VOL[clave] ?? 0.6, ...config });
    } catch (e) { /* audio bloqueado o no soportado: el juego sigue */ }
  }

  static musica(scene, clave, volumen = 0.35) {
    try {
      const actual = scene.registry.get('musicaActual');
      if (actual && actual.key === clave && actual.isPlaying) return actual;
      if (actual) actual.stop();
      if (!scene.cache.audio.exists(clave)) return null;
      const m = scene.sound.add(clave, { loop: !clave.includes('victoria') && !clave.includes('derrota'), volume: volumen });
      m.play();
      scene.registry.set('musicaActual', m);
      return m;
    } catch (e) { return null; }
  }

  static detenerMusica(scene) {
    const actual = scene.registry.get('musicaActual');
    if (actual) { actual.stop(); scene.registry.set('musicaActual', null); }
  }

  static alternarSilencio(game) {
    game.sound.mute = !game.sound.mute;
    bus.emit(EV.SILENCIO, game.sound.mute);
    return game.sound.mute;
  }
}
