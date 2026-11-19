// Estilos de texto compartidos por las pantallas.
export const FUENTE = '"Trebuchet MS", "Segoe UI", Verdana, sans-serif';

export const T = {
  titulo: { fontFamily: FUENTE, fontSize: '52px', fontStyle: 'bold', color: '#ffd447', stroke: '#6b1515', strokeThickness: 8 },
  subtitulo: { fontFamily: FUENTE, fontSize: '22px', color: '#ffffff', stroke: '#000000', strokeThickness: 4 },
  normal: { fontFamily: FUENTE, fontSize: '18px', color: '#ffffff' },
  chico: { fontFamily: FUENTE, fontSize: '14px', color: '#d8d0e8' },
  hud: { fontFamily: FUENTE, fontSize: '18px', fontStyle: 'bold', color: '#ffffff', stroke: '#000000', strokeThickness: 3 },
  hudAmarillo: { fontFamily: FUENTE, fontSize: '18px', fontStyle: 'bold', color: '#ffd447', stroke: '#000000', strokeThickness: 3 },
};

/** Botón de texto con fondo; se activa con clic. */
export function boton(scene, x, y, texto, alPresionar, ancho = 260) {
  const fondo = scene.add.rectangle(x, y, ancho, 44, 0x231a33, 0.92).setStrokeStyle(2, 0xffd447).setInteractive({ useHandCursor: true });
  const label = scene.add.text(x, y, texto, { fontFamily: FUENTE, fontSize: '20px', fontStyle: 'bold', color: '#ffffff' }).setOrigin(0.5);
  fondo.on('pointerover', () => { fondo.setFillStyle(0x3d2c57, 1); label.setColor('#ffd447'); });
  fondo.on('pointerout', () => { fondo.setFillStyle(0x231a33, 0.92); label.setColor('#ffffff'); });
  fondo.on('pointerup', () => alPresionar());
  return { fondo, label, setDestruir() { fondo.destroy(); label.destroy(); } };
}
