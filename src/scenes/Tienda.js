// Pantalla de la tienda de Doña Lupe (GDD 4.5.6). Mientras está abierta el nivel queda en pausa.
// La lógica de la transacción vive en systems/Tienda.js; esta escena solo la muestra.
import { ANCHO, ALTO, TIENDA } from '../config.js';
import { Audio } from '../systems/Audio.js';
import { T, FUENTE } from './estilos.js';

export class Tienda extends Phaser.Scene {
  constructor() { super('TiendaEscena'); }

  init(data) { this.nivel = data.nivel; }

  create() {
    this.sistema = this.nivel.tiendaSistema;
    this.inv = this.nivel.inventario;
    this.abiertaEn = this.time.now;

    this.add.rectangle(0, 0, ANCHO, ALTO, 0x000000, 0.55).setOrigin(0).setInteractive();
    this.add.rectangle(ANCHO / 2, ALTO / 2, 600, 400, 0x1a1326, 0.97).setStrokeStyle(3, 0xffd447);
    this.add.image(ANCHO / 2 - 250, ALTO / 2 - 160, 'lupe', 0).setScale(2).setRotation(Math.PI / 2);
    this.add.text(ANCHO / 2 - 215, ALTO / 2 - 178, 'Tienda de Doña Lupe', { ...T.subtitulo, color: '#ffd447' });
    this.add.text(ANCHO / 2 - 215, ALTO / 2 - 148, '«Llévate lo que ocupes, mijo. Pero se paga.»', T.chico);
    this.txtPesos = this.add.text(ANCHO / 2 + 280, ALTO / 2 - 176, '', { ...T.hudAmarillo, fontSize: '24px' }).setOrigin(1, 0);

    this.filas = TIENDA.map((art, i) => {
      const y = ALTO / 2 - 90 + i * 62;
      const fondo = this.add.rectangle(ANCHO / 2, y, 560, 54, 0x2a2140, 1).setStrokeStyle(1, 0x5a4a78);
      const nombre = this.add.text(ANCHO / 2 - 266, y - 18, `[${art.tecla}] ${art.nombre}`, { fontFamily: FUENTE, fontSize: '17px', fontStyle: 'bold', color: '#ffffff' });
      const motivo = this.add.text(ANCHO / 2 - 266, y + 4, '', { fontFamily: FUENTE, fontSize: '13px', color: '#ff9a9a' });
      const precio = this.add.text(ANCHO / 2 + 110, y, `$${art.precio}`, { ...T.hudAmarillo, fontSize: '20px' }).setOrigin(0.5);
      const btn = this.add.rectangle(ANCHO / 2 + 210, y, 120, 38, 0x3d8a46).setStrokeStyle(2, 0x000000).setInteractive({ useHandCursor: true });
      const btnTxt = this.add.text(ANCHO / 2 + 210, y, 'Comprar', { fontFamily: FUENTE, fontSize: '16px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
      btn.on('pointerup', () => this.comprar(art.id));
      return { art, fondo, nombre, motivo, precio, btn, btnTxt };
    });

    this.txtResultado = this.add.text(ANCHO / 2, ALTO / 2 + 158, '', { fontFamily: FUENTE, fontSize: '18px', fontStyle: 'bold', color: '#8af08a' }).setOrigin(0.5);
    const cerrar = this.add.text(ANCHO / 2 + 280, ALTO / 2 + 182, 'Cerrar  [E / Esc]', { ...T.normal, fontSize: '15px', color: '#d8d0e8' }).setOrigin(1, 0.5).setInteractive({ useHandCursor: true });
    cerrar.on('pointerup', () => this.cerrar());

    const k = this.input.keyboard;
    TIENDA.forEach(a => k.on(`keydown-${['ONE', 'TWO', 'THREE', 'FOUR'][a.tecla - 1]}`, () => this.comprar(a.id)));
    k.on('keydown-E', () => this.cerrar());
    k.on('keydown-ESC', () => this.cerrar());
    this.refrescar();
  }

  refrescar() {
    this.txtPesos.setText(`$ ${this.inv.pesos}`);
    for (const f of this.filas) {
      const v = this.sistema.validar(f.art.id);
      // si los pesos no alcanzan, el botón aparece gris
      f.btn.setFillStyle(v.ok ? 0x3d8a46 : 0x55505e);
      f.btnTxt.setColor(v.ok ? '#ffffff' : '#a8a2b4');
      f.motivo.setText(v.ok ? '' : v.motivo);
      f.nombre.setColor(v.ok ? '#ffffff' : '#b8b0c8');
    }
  }

  comprar(id) {
    const r = this.sistema.comprar(id);
    if (r.ok) {
      Audio.efecto(this, 'compra');
      this.txtResultado.setText('¡Comprado!').setColor('#8af08a');
    } else {
      Audio.efecto(this, 'error');
      this.txtResultado.setText(r.motivo).setColor('#ff8a8a');
      this.cameras.main.shake(80, 0.003);
    }
    this.refrescar();
  }

  cerrar() {
    if (this.time.now - this.abiertaEn < 200) return; // evita cerrar con la misma tecla con que se abrió
    this.scene.stop();
    this.nivel.alCerrarTienda();
  }
}
