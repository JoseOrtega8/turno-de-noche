// Valores de diseño tomados del GDD (secciones 4.4 a 4.14).
// Si se quiere balancear el juego después de las pruebas beta, se cambia aquí y en ningún otro lado.

export const ANCHO = 960;
export const ALTO = 540;
export const MOSAICO = 32;

export const JUGADOR = {
  salud: 100,
  vidas: 3,
  vidasMax: 5,
  velocidad: 150,              // px/s
  invulnerableGolpe: 1000,     // ms después de recibir daño
  invulnerableReaparecer: 2000,
  vidaExtraCada: 10000,        // puntos
  botiquinCura: 30,
  botiquinesMax: 2,
};

export const ARMAS = {
  llave:    { nombre: 'Llave',    tecla: 1, danio: 15, cadencia: 1.5, alcance: 46, arco: 110 },
  pistola:  { nombre: 'Pistola',  tecla: 2, danio: 10, cadencia: 3, cargador: 12, reservaMax: 60, velocidadBala: 520, recarga: 1000 },
  escopeta: { nombre: 'Escopeta', tecla: 3, danio: 8,  cadencia: 1, cargador: 6,  reservaMax: 24, perdigones: 5, recarga: 1000 },
};

export const ENEMIGOS = {
  caminante: { salud: 30, danio: 10, velocidad: 60,  pesos: 5,  puntos: 100 },
  corredor:  { salud: 15, danio: 8,  velocidad: 160, pesos: 8,  puntos: 150, pausaTrasGolpe: 500 },
  hinchado:  { salud: 60, danio: 10, velocidad: 40,  pesos: 15, puntos: 250, radioExplosion: 80, danioExplosion: 15, parpadeo: 500 },
};

export const BARRIL = { radio: 80, danioInfectados: 40, danioJugador: 20 };

// Oleadas del Nivel 1 (sección 4.6)
export const OLEADAS_NIVEL1 = [
  { entradas: ['E1'],             enemigos: { caminante: 6 } },
  { entradas: ['E1', 'E2'],       enemigos: { caminante: 5, corredor: 3 } },
  { entradas: ['E1', 'E2', 'E3'], enemigos: { caminante: 6, corredor: 3, hinchado: 1 } },
];
export const ESPERA_PRIMERA_OLEADA = 5;   // s de cuenta regresiva
export const DESCANSO_ENTRE_OLEADAS = 15; // s para ir a la tienda
export const CUENTA_AL_CERRAR_TIENDA = 5; // s
export const INTERVALO_APARICION = 1100;  // ms entre cada infectado

// Puntaje (sección 4.14)
export const PUNTOS = {
  oleadaSuperada: 200,      // × número de oleada
  oleadaSinDanio: 300,
  bajaPorBarril: 50,
  objetoMision: 250,
  nivelCompletado: 500,
  bonoTiempoPorSegundo: 2,
  golpeRecibido: -50,
  vidaPerdida: -500,
};
export const TIEMPO_OBJETIVO_NIVEL1 = 300; // s

export const PESOS = { oleadaSuperada: 10, nivelCompletado: 25, inicial: 0 };

// Tienda de Doña Lupe (sección 4.5.6)
export const TIENDA = [
  { id: 'balas',     nombre: 'Balas de pistola (12)',  precio: 20, tecla: 1 },
  { id: 'cartuchos', nombre: 'Cartuchos de escopeta (6)', precio: 30, tecla: 2 },
  { id: 'botiquin',  nombre: 'Botiquín (+30 de salud)', precio: 25, tecla: 3 },
  { id: 'barrera',   nombre: 'Barrera de tablas',       precio: 40, tecla: 4 },
];

export const RANGOS = [
  { rango: 'S', min: 12000 },
  { rango: 'A', min: 9000 },
  { rango: 'B', min: 6000 },
  { rango: 'C', min: 3000 },
  { rango: 'D', min: 0 },
];

export const PROFUNDIDAD = { suelo: 0, charcos: 1, objetos: 5, personajes: 10, balas: 12, efectos: 20, techo: 30 };
