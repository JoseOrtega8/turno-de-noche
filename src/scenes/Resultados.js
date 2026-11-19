// Pantallas finales: Game Over y Victoria. Muestran el desglose del puntaje (sección 4.14) y el rango.
import { ANCHO, ALTO, RANGOS } from '../config.js';
import { Audio } from '../systems/Audio.js';
import { T, FUENTE, boton } from './estilos.js';

export function rango(total) {
  return RANGOS.find(r => total >= r.min).rango;
}

function tablaDesglose(scene, x, y, desglose, total) {
  const filas = desglose.filter(f => f[2] !== 0 || ['Caminantes', 'Oleadas superadas'].includes(f[0]));
  filas.forEach(([concepto, calculo, puntos], i) => {
    const yy = y + i * 22;
    scene.add.text(x - 230, yy, concepto, { fontFamily: FUENTE, fontSize: '15px', color: '#d8d0e8' });
    scene.add.text(x + 40, yy, calculo, { fontFamily: FUENTE, fontSize: '14px', color: '#8f84a8' }).setOrigin(0.5, 0);
    scene.add.text(x + 230, yy, puntos.toLocaleString('es-MX'), { fontFamily: FUENTE, fontSize: '15px', fontStyle: 'bold', color: puntos < 0 ? '#ff8a8a' : '#ffffff' }).setOrigin(1, 0);
  });
  const yt = y + filas.length * 22 + 8;
  scene.add.rectangle(x, yt, 460, 2, 0xffd447).setOrigin(0.5, 0);
  scene.add.text(x - 230, yt + 8, 'TOTAL', { ...T.hudAmarillo, fontSize: '20px' });
  scene.add.text(x + 230, yt + 8, total.toLocaleString('es-MX'), { ...T.hudAmarillo, fontSize: '20px' }).setOrigin(1, 0);
  return yt + 40;
}

export class GameOver extends Phaser.Scene {
  constructor() { super('GameOver'); }

  create(data) {
    this.cameras.main.fadeIn(500);
    Audio.musica(this, 'musica_derrota', 0.4);
    this.add.image(ANCHO / 2, ALTO / 2, 'portada').setDisplaySize(ANCHO, ALTO).setTint(0x442222);
    this.add.rectangle(ANCHO / 2, ALTO / 2, 560, 500, 0x0d0a14, 0.9).setStrokeStyle(3, 0xd23030);
    this.add.text(ANCHO / 2, 50, 'GAME OVER', { ...T.titulo, color: '#ff5050', stroke: '#2a0000' }).setOrigin(0.5);
    this.add.text(ANCHO / 2, 92, `Marco no aguantó el turno · ${data.tiempo} s · rango ${rango(data.total)}`, T.chico).setOrigin(0.5);
    tablaDesglose(this, ANCHO / 2, 116, data.desglose, data.total);
    boton(this, ANCHO / 2 - 140, ALTO - 44, 'REINTENTAR NIVEL', () => this.scene.start('Nivel1', { puntajePrevio: data.puntajePrevio }), 250);
    boton(this, ANCHO / 2 + 140, ALTO - 44, 'VOLVER AL MENÚ', () => this.scene.start('Menu'), 250);
    this.input.keyboard.once('keydown-ENTER', () => this.scene.start('Nivel1', { puntajePrevio: data.puntajePrevio }));
  }
}

export class Victoria extends Phaser.Scene {
  constructor() { super('Victoria'); }

  create(data) {
    this.cameras.main.fadeIn(800);
    Audio.musica(this, 'musica_victoria', 0.45);
    this.add.image(ANCHO / 2, ALTO / 2, 'portada').setDisplaySize(ANCHO, ALTO).setTint(0x8877aa);
    this.add.rectangle(ANCHO / 2, ALTO / 2, 560, 510, 0x0d0a14, 0.9).setStrokeStyle(3, 0xffd447);
    this.add.text(ANCHO / 2, 46, '¡NIVEL 1 COMPLETADO!', { ...T.titulo, fontSize: '40px' }).setOrigin(0.5);
    this.add.text(ANCHO / 2, 84, `Aguantaste hasta las 2:00 AM · ${data.tiempo} s · ${data.vidas} vidas · rango ${rango(data.total)}`, T.chico).setOrigin(0.5);
    const y = tablaDesglose(this, ANCHO / 2, 108, data.desglose, data.total);
    this.add.text(ANCHO / 2, Math.min(y + 4, ALTO - 84), 'Continuará: Nivel 2 «La carretera» y Nivel 3 «La pipa» (versión completa)', { ...T.chico, color: '#7fe9ff' }).setOrigin(0.5);
    boton(this, ANCHO / 2 - 140, ALTO - 44, 'JUGAR DE NUEVO', () => this.scene.start('Nivel1'), 250);
    boton(this, ANCHO / 2 + 140, ALTO - 44, 'VOLVER AL MENÚ', () => this.scene.start('Menu'), 250);
  }
}
