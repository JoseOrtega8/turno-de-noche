// Animaciones por cuadros de los personajes (hojas de 32×32 px en assets/img).
// marco.png:      0-3 caminar con llave · 4-5 golpe de llave · 6-9 caminar con pistola · 10 disparo
// infectados:     0-3 caminar · 4-6 morir
// lupe.png:       0 quieta · 1 con la pistola
export function crearAnimaciones(scene) {
  const a = scene.anims;
  const rango = (key, start, end) => a.generateFrameNumbers(key, { start, end });

  a.create({ key: 'marco-caminar-llave', frames: rango('marco', 0, 3), frameRate: 9, repeat: -1 });
  a.create({ key: 'marco-caminar-pistola', frames: rango('marco', 6, 9), frameRate: 9, repeat: -1 });
  a.create({ key: 'marco-llave', frames: rango('marco', 4, 5), frameRate: 14, repeat: 0 });

  const velocidades = { caminante: 5, corredor: 12, hinchado: 4 };
  for (const tipo of ['caminante', 'corredor', 'hinchado']) {
    a.create({ key: `${tipo}-caminar`, frames: rango(tipo, 0, 3), frameRate: velocidades[tipo], repeat: -1 });
    a.create({ key: `${tipo}-morir`, frames: rango(tipo, 4, 6), frameRate: 7, repeat: 0 });
  }

  a.create({ key: 'explosion', frames: rango('explosion', 0, 5), frameRate: 16, repeat: 0, hideOnComplete: true });
}
