// Transacciones de la tienda de Doña Lupe (sección 4.5.6).
// Regla: primero se valida y solo después se aplica, para que nunca queden pesos negativos ni artículos de más (CA-06).
import { TIENDA } from '../config.js';
import { bus, EV } from './Eventos.js';

export class Tienda {
  /**
   * @param {import('./Inventario.js').Inventario} inventario
   * @param {{ barreraPendiente: boolean }} estadoNivel
   */
  constructor(inventario, estadoNivel) {
    this.inv = inventario;
    this.estado = estadoNivel;
  }

  articulo(id) { return TIENDA.find(a => a.id === id); }

  /** @returns {{ ok: boolean, motivo?: string }} */
  validar(id) {
    const a = this.articulo(id);
    if (!a) return { ok: false, motivo: 'No existe' };
    switch (id) {
      case 'balas':
        if (!this.inv.desbloqueadas.pistola) return { ok: false, motivo: 'Requiere pistola' };
        if (this.inv.espacioReserva('pistola') < 12) return { ok: false, motivo: 'Reserva llena (máx. 60)' };
        break;
      case 'cartuchos':
        if (!this.inv.desbloqueadas.escopeta) return { ok: false, motivo: 'Requiere escopeta' };
        if (this.inv.espacioReserva('escopeta') < 6) return { ok: false, motivo: 'Reserva llena (máx. 24)' };
        break;
      case 'botiquin':
        if (this.inv.botiquines >= 2) return { ok: false, motivo: 'Máximo 2 guardados' };
        break;
      case 'barrera':
        if (this.estado.barreraPendiente) return { ok: false, motivo: 'Ya compraste una' };
        break;
    }
    if (this.inv.pesos < a.precio) return { ok: false, motivo: 'Pesos insuficientes' };
    return { ok: true };
  }

  /** @returns {{ ok: boolean, motivo?: string }} */
  comprar(id) {
    const v = this.validar(id);
    if (!v.ok) return v;
    const a = this.articulo(id);
    if (!this.inv.gastarPesos(a.precio)) return { ok: false, motivo: 'Pesos insuficientes' };
    switch (id) {
      case 'balas': this.inv.agregarMunicion('pistola', 12); break;
      case 'cartuchos': this.inv.agregarMunicion('escopeta', 6); break;
      case 'botiquin': this.inv.agregarBotiquin(); break;
      case 'barrera': this.estado.barreraPendiente = true; break;
    }
    bus.emit(EV.COMPRA, a);
    bus.emit(EV.HUD_ACTUALIZAR);
    return { ok: true };
  }
}
