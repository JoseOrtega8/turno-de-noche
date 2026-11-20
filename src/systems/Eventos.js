// Nombres de los eventos del juego (sección 4.5.3) y un bus compartido entre escenas.
// Nivel1 emite; HUD, Puntaje y Audio escuchan.

export const EV = {
  INICIO_OLEADA: 'inicioOleada',
  FIN_OLEADA: 'finOleada',
  ENEMIGO_ELIMINADO: 'enemigoEliminado',
  EXPLOSION_BARRIL: 'explosionBarril',
  JUGADOR_DANADO: 'jugadorDañado',
  VIDA_PERDIDA: 'vidaPerdida',
  VIDA_EXTRA: 'vidaExtra',
  OBJETO_RECOGIDO: 'objetoRecogido',
  COMPRA: 'compra',
  NIVEL_COMPLETADO: 'nivelCompletado',
  GAME_OVER: 'gameOver',
  // eventos de interfaz
  HUD_ACTUALIZAR: 'hudActualizar',
  MENSAJE: 'mensaje',
  AVISO_INTERACCION: 'avisoInteraccion',
  CUENTA_REGRESIVA: 'cuentaRegresiva',
  SILENCIO: 'silencio',
};

export const bus = new Phaser.Events.EventEmitter();
