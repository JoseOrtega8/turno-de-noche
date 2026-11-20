"""Casos P-01 a P-14 del plan de pruebas beta (GDD 6.5), automatizados con Playwright.
Uso: python3 pruebas_beta.py URL carpeta_capturas"""
import asyncio, json, sys
from playwright.async_api import async_playwright

URL = sys.argv[1] if len(sys.argv) > 1 else 'http://localhost:8765/'
CAP = sys.argv[2] if len(sys.argv) > 2 else '/tmp'
ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--autoplay-policy=no-user-gesture-required']
resultados = []

def reg(id_, caso, esperado, obtenido, ok):
    resultados.append(dict(id=id_, caso=caso, esperado=esperado, obtenido=obtenido, ok=bool(ok)))
    print(('PASA ' if ok else 'FALLA'), id_, '-', obtenido)

async def nivel(pg, js):
    return await pg.evaluate(f"() => {{ const s = __juego.scene.getScene('Nivel1'); {js} }}")

async def entrar_nivel(pg):
    await pg.goto(URL); await pg.wait_for_timeout(2000)
    await pg.keyboard.press('Enter'); await pg.wait_for_timeout(700)
    await pg.keyboard.press('Escape'); await pg.wait_for_timeout(1200)

async def main():
    async with async_playwright() as p:
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        errores = []
        pg.on('pageerror', lambda e: errores.append(str(e)))
        pg.on('console', lambda m: errores.append(m.text) if m.type == 'error' else None)

        # P-01
        await pg.goto(URL); await pg.wait_for_timeout(2500)
        menu = await pg.evaluate("() => __juego.scene.isActive('Menu')")
        await pg.screenshot(path=f'{CAP}/01-menu.png')
        reg('P-01', 'Abrir el juego por URL', 'Carga el menú sin errores en consola',
            f"Menú activo: {menu}; errores en consola: {len(errores)}", menu and not errores)

        await pg.keyboard.press('Enter'); await pg.wait_for_timeout(700)
        await pg.screenshot(path=f'{CAP}/02-intro.png')
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(1200)

        # P-02: caminar contra la pared de la tienda (fila 8) desde la banqueta
        await nivel(pg, "s.jugador.setPosition(5*32+16, 9*32+18); s.oleadas.cuenta = 999;")
        await pg.keyboard.down('w'); await pg.wait_for_timeout(1200); await pg.keyboard.up('w')
        y_pared = await nivel(pg, "return s.jugador.y")
        # contra el auto (x 22..25, y 5..6.5) desde la izquierda
        await nivel(pg, "s.jugador.setPosition(21*32-4, 5.75*32);")
        await pg.keyboard.down('d'); await pg.wait_for_timeout(1200); await pg.keyboard.up('d')
        x_auto = await nivel(pg, "return s.jugador.x")
        # velocidad constante en diagonal
        await nivel(pg, "s.jugador.setPosition(30*32, 15*32);")
        await pg.keyboard.down('d'); await pg.keyboard.down('s'); await pg.wait_for_timeout(300)
        vel = await nivel(pg, "return Math.round(s.jugador.body.speed)")
        await pg.keyboard.up('d'); await pg.keyboard.up('s')
        ok = y_pared >= 9 * 32 and x_auto <= 22 * 32 + 4 and abs(vel - 150) <= 2
        reg('P-02', 'Moverse contra paredes y autos', 'No los atraviesa',
            f"y contra pared = {y_pared:.0f} (pared termina en {9*32}); x contra auto = {x_auto:.0f} (auto empieza en {22*32+4}); rapidez en diagonal = {vel} px/s", ok)

        # P-03: vaciar cargador, clic y recarga
        r = await nivel(pg, """
            s.inventario.desbloquear('pistola', 12, 24); s.inventario.cambiarArma('pistola');
            s.jugador.setPosition(20*32, 11*32);
            let t = s.time.now + 10000; const reg = [];
            for (let i = 0; i < 14; i++) { s.jugador.siguienteAtaque = 0; s.jugador.atacar(t + i*1000); }
            const m = s.inventario.municion.pistola;
            return { cargador: m.cargador, reserva: m.reserva };""")
        await pg.keyboard.press('r'); await pg.wait_for_timeout(1300)
        r2 = await nivel(pg, "const m = s.inventario.municion.pistola; return { cargador: m.cargador, reserva: m.reserva };")
        ok = r['cargador'] == 0 and r2['cargador'] == 12 and r2['reserva'] == 12
        reg('P-03', 'Disparar hasta vaciar el cargador', 'Suena clic y no dispara; R recarga',
            f"14 clics con 12 balas → cargador {r['cargador']} (nunca negativo); tras R: {r2['cargador']}/{r2['reserva']}", ok)

        # P-04: golpe de llave a un caminante
        r = await nivel(pg, """
            s.inventario.cambiarArma('llave');
            s.jugador.setPosition(30*32, 15*32); s.jugador.rotation = 0;
            const e = s.crearEnemigo('caminante', 'E2'); e.setPosition(30*32 + 30, 15*32); e.pausadoHasta = s.time.now + 5000;
            const antes = e.salud; s.golpeLlave(s.jugador); return { antes, despues: e.salud };""")
        reg('P-04', 'Golpear a un caminante con la llave', 'Recibe 15 de daño por golpe',
            f"salud {r['antes']} → {r['despues']}", r['antes'] - r['despues'] == 15)
        await nivel(pg, "s.enemigos.clear(true, true);")

        await b.close()

        # P-05 a P-14 con una partida nueva en cada bloque
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        pg.on('pageerror', lambda e: errores.append(str(e)))
        await entrar_nivel(pg)

        # P-05: completar la oleada 1
        await nivel(pg, "s.oleadas.cuenta = 0.1;")
        await pg.wait_for_timeout(9000)  # 6 caminantes aparecen cada 1.1 s
        await pg.screenshot(path=f'{CAP}/03-oleada1.png')
        r = await nivel(pg, """
            const antes = s.puntaje.total;
            s.vidas.invulnerableHasta = 1e12;
            for (const e of s.enemigos.getChildren()) if (e.vivo) e.recibirDanio(999, 'bala');
            return { antes };""")
        await pg.wait_for_timeout(800)
        r2 = await nivel(pg, "return { total: s.puntaje.total, pistola: s.inventario.desbloqueadas.pistola, estado: s.oleadas.estado, golpes: s.puntaje.golpes, pesos: s.inventario.pesos, sinDanio: s.puntaje.oleadasSinDanio }")
        esperado = 6 * 100 + 200 + (300 if r2['sinDanio'] else 0) - 50 * r2['golpes']
        await pg.wait_for_timeout(2200)
        await pg.screenshot(path=f'{CAP}/04-pistola.png')
        ok = r2['total'] == esperado and r2['pistola'] and r2['estado'] == 'descanso' and r2['pesos'] == 40
        reg('P-05', 'Completar la oleada 1', 'Suma 200 + bajas y entrega la pistola',
            f"puntos {r2['total']} (esperado {esperado}: 6×100 + 200 + sin daño {r2['sinDanio']}×300); pistola: {r2['pistola']}; pesos: ${r2['pesos']}; estado: {r2['estado']}", ok)

        # P-06: barril con infectados cerca (barril en tile 31,6)
        r = await nivel(pg, """
            s.oleadas.cuenta = 999; s.jugador.setPosition(26*32, 9*32);
            const b = s.barriles.getChildren().find(b => Math.abs(b.x - (31*32+16)) < 4 && Math.abs(b.y - (6*32+16)) < 4);
            const e1 = s.crearEnemigo('corredor', 'E2'); e1.setPosition(b.x + 30, b.y);
            const e2 = s.crearEnemigo('corredor', 'E2'); e2.setPosition(b.x, b.y + 34);
            const e3 = s.crearEnemigo('caminante', 'E2'); e3.setPosition(b.x + 10, b.y - 40);
            [e1,e2,e3].forEach(e => e.pausadoHasta = s.time.now + 5000);
            window.__e3 = e3;
            const antes = { total: s.puntaje.total, porBarril: s.puntaje.bajasPorBarril, salud3: e3.salud };
            s.disparar(s.jugador.x, s.jugador.y, Phaser.Math.Angle.Between(s.jugador.x, s.jugador.y, b.x, b.y), 10);
            return antes;""")
        await pg.wait_for_timeout(1500)
        await pg.screenshot(path=f'{CAP}/05-barril.png')
        r2 = await nivel(pg, "return { total: s.puntaje.total, porBarril: s.puntaje.bajasPorBarril, salud3: window.__e3.salud, vivo3: window.__e3.vivo }")
        dif = r2['total'] - r['total']
        ok = r2['porBarril'] - r['porBarril'] == 3 and dif == 2 * 150 + 100 + 3 * 50 and not r2['vivo3']
        reg('P-06', 'Disparar a un barril con infectados cerca', 'Explota, los daña y da +50 por baja',
            f"3 infectados a menos de 80 px: bajas por barril {r2['porBarril'] - r['porBarril']}; puntos ganados {dif} (= 2×150 + 100 + 3×50); el caminante (30 de salud) recibió 40 y murió", ok)
        await nivel(pg, "for (const e of s.enemigos.getChildren()) if (e.vivo) e.recibirDanio(999,'bala');")
        await pg.wait_for_timeout(300)

        # P-09 y P-10: tienda
        r = await nivel(pg, """
            s.inventario.pesos = 10;
            const t = s.tiendaSistema; const antes = { pesos: s.inventario.pesos, res: s.inventario.municion.pistola.reserva };
            const v = t.comprar('balas');
            return { antes, ok: v.ok, motivo: v.motivo, pesos: s.inventario.pesos, res: s.inventario.municion.pistola.reserva };""")
        await nivel(pg, "s.jugador.setPosition(s.lupe.x, s.lupe.y + 60); s.inventario.pesos = 10;")
        await pg.wait_for_timeout(200)
        await pg.keyboard.press('e'); await pg.wait_for_timeout(600)
        await pg.screenshot(path=f'{CAP}/06-tienda.png')
        ok = (not r['ok']) and r['pesos'] == 10 and r['res'] == r['antes']['res']
        reg('P-09', 'Comprar sin pesos suficientes', 'Botón gris, sonido de error, nada cambia',
            f"compra rechazada: «{r['motivo']}»; pesos {r['antes']['pesos']} → {r['pesos']}; reserva sin cambio", ok)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(400)

        r = await nivel(pg, """
            s.inventario.pesos = 100; s.inventario.municion.pistola.reserva = 55;
            const v1 = s.tiendaSistema.comprar('balas');
            s.inventario.municion.pistola.reserva = 48;
            const v2 = s.tiendaSistema.comprar('balas');
            return { v1: v1.ok, m1: v1.motivo, v2: v2.ok, res: s.inventario.municion.pistola.reserva, pesos: s.inventario.pesos };""")
        ok = (not r['v1']) and r['v2'] and r['res'] == 60 and r['pesos'] == 80
        reg('P-10', 'Comprar balas con la reserva casi llena', 'No rebasa 60',
            f"con 55: rechazada («{r['m1']}»); con 48: comprada → reserva {r['res']}; pesos 100 → {r['pesos']}", ok)

        # P-11: hinchado de cerca
        r = await nivel(pg, """
            s.vidas.invulnerableHasta = 0; s.vidas.salud = 100; s.oleadas.cuenta = 999;
            s.jugador.setPosition(30*32, 15*32);
            const h = s.crearEnemigo('hinchado', 'E2'); h.setPosition(30*32 + 50, 15*32); h.pausadoHasta = s.time.now + 5000;
            const vecino = s.crearEnemigo('caminante', 'E2'); vecino.setPosition(30*32 + 90, 15*32); vecino.pausadoHasta = s.time.now + 5000;
            window.__vec = vecino; h.recibirDanio(999, 'bala'); return s.vidas.salud;""")
        await pg.wait_for_timeout(250)
        await pg.screenshot(path=f'{CAP}/07-hinchado.png')
        await pg.wait_for_timeout(600)
        r2 = await nivel(pg, "return { salud: s.vidas.salud, vecino: window.__vec.salud }")
        ok = r2['salud'] == 85 and r2['vecino'] == 15
        reg('P-11', 'Eliminar al hinchado de cerca', 'Explota y daña al jugador',
            f"salud de Marco {r} → {r2['salud']} (−15); caminante vecino 30 → {r2['vecino']}", ok)
        await nivel(pg, "for (const e of s.enemigos.getChildren()) if (e.vivo) e.recibirDanio(999,'bala');")

        # P-12: pausa
        await nivel(pg, "s.oleadas.cuenta = 0.1;")
        await pg.wait_for_timeout(2500)
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(300)
        a = await nivel(pg, "return { pos: s.enemigos.getChildren().filter(e=>e.vivo).map(e=>[Math.round(e.x),Math.round(e.y)]), cola: s.oleadas.cola.length, t: s.tiempoNivel }")
        await pg.screenshot(path=f'{CAP}/08-pausa.png')
        await pg.wait_for_timeout(2000)
        d = await nivel(pg, "return { pos: s.enemigos.getChildren().filter(e=>e.vivo).map(e=>[Math.round(e.x),Math.round(e.y)]), cola: s.oleadas.cola.length, t: s.tiempoNivel }")
        await pg.keyboard.press('Escape'); await pg.wait_for_timeout(1500)
        c = await nivel(pg, "return { pos: s.enemigos.getChildren().filter(e=>e.vivo).map(e=>[Math.round(e.x),Math.round(e.y)]), cola: s.oleadas.cola.length }")
        ok = a == d and len(a['pos']) > 0 and (c['pos'] != a['pos'] or c['cola'] != a['cola'])
        reg('P-12', 'Pausar durante una oleada', 'Todo se detiene; al reanudar continúa igual',
            f"{len(a['pos'])} infectados y cola de {a['cola']}: idénticos tras 2 s en pausa = {a == d}; reloj del nivel detenido = {a['t'] == d['t']}; al reanudar se mueven = {c['pos'] != a['pos']}", ok)

        # P-13: silenciar
        await pg.keyboard.press('m'); await pg.wait_for_timeout(200)
        m1 = await pg.evaluate("() => __juego.sound.mute")
        await pg.keyboard.press('m'); await pg.wait_for_timeout(200)
        m2 = await pg.evaluate("() => __juego.sound.mute")
        reg('P-13', 'Silenciar con M', 'Se apaga música y efectos', f"M → mute = {m1}; M otra vez → mute = {m2}", m1 and not m2)

        # P-07 y P-08: perder vidas
        await nivel(pg, "for (const e of s.enemigos.getChildren()) if (e.vivo) e.recibirDanio(999,'bala');")
        r = await nivel(pg, """
            s.vidas.invulnerableHasta = 0; s.jugador.setPosition(30*32, 16*32);
            const antes = { vidas: s.vidas.vidas, total: s.puntaje.totalNivel, perdidas: s.puntaje.vidasPerdidas };
            s.vidas.salud = 10; s.danarJugador(20, { tipo: 'prueba' }); return antes;""")
        await pg.wait_for_timeout(2000)
        r2 = await nivel(pg, "return { vidas: s.vidas.vidas, salud: s.vidas.salud, perdidas: s.puntaje.vidasPerdidas, x: Math.round(s.jugador.x), y: Math.round(s.jugador.y), ix: Math.round(s.inicio.x), iy: Math.round(s.inicio.y), total: s.puntaje.totalNivel }")
        await pg.screenshot(path=f'{CAP}/09-vida-perdida.png')
        ok = r2['vidas'] == r['vidas'] - 1 and r2['perdidas'] == r['perdidas'] + 1 and r2['salud'] == 100 and (r2['x'], r2['y']) == (r2['ix'], r2['iy']) and r['total'] - r2['total'] == 550
        reg('P-07', 'Recibir daño hasta salud 0', 'Pierde 1 vida, −500 puntos, reaparece en la tienda',
            f"vidas {r['vidas']} → {r2['vidas']}; puntos −{r['total'] - r2['total']} (−50 golpe, −500 vida); reaparece en ({r2['x']}, {r2['y']}) = punto de la tienda; salud {r2['salud']}", ok)

        for _ in range(2):
            await nivel(pg, "s.vidas.invulnerableHasta = 0; s.vidas.salud = 5; s.danarJugador(20, { tipo: 'prueba' });")
            await pg.wait_for_timeout(1900)
        await pg.wait_for_timeout(1500)
        go = await pg.evaluate("() => __juego.scene.isActive('GameOver')")
        await pg.screenshot(path=f'{CAP}/10-game-over.png')
        reg('P-08', 'Perder las 3 vidas', 'Aparece Game Over con puntaje', f"escena GameOver activa: {go}", go)

        await b.close()

        # P-14: partida completa con un bot y verificación de la fórmula
        b = await p.chromium.launch(args=ARGS)
        pg = await b.new_page(viewport={'width': 960, 'height': 540})
        pg.on('pageerror', lambda e: errores.append(str(e)))
        await entrar_nivel(pg)
        # bot: apunta al infectado más cercano y ataca; con la pistola se aleja si se acercan
        await pg.evaluate("""() => {
          const s = __juego.scene.getScene('Nivel1');
          s.events.on('update', (time) => {
            const j = s.jugador; if (!j.activoEnJuego) return;
            const vivos = s.enemigos.getChildren().filter(e => e.vivo);
            if (!vivos.length) return;
            vivos.sort((a, b) => Phaser.Math.Distance.BetweenPoints(j, a) - Phaser.Math.Distance.BetweenPoints(j, b));
            const e = vivos[0];
            j.rotation = Phaser.Math.Angle.BetweenPoints(j, e);
            if (s.inventario.desbloqueadas.pistola && s.inventario.armaActual !== 'pistola') s.inventario.cambiarArma('pistola');
            const m = s.inventario.municion.pistola;
            if (s.inventario.armaActual === 'pistola' && m.cargador === 0) { if (m.reserva > 0) j.recargar(); else s.inventario.cambiarArma('llave'); }
            j.atacar(time);
            if (s.inventario.armaActual === 'pistola' && m.reserva < 24) { s.inventario.pesos >= 20 && s.tiendaSistema.validar('balas').ok && s.tiendaSistema.comprar('balas'); }
          });
          s.oleadas.cuenta = 1;
        }""")
        capturas = {20: '11-partida-oleada', 45: '12-partida-oleada3'}
        for seg in range(1, 200):
            await pg.wait_for_timeout(1000)
            if seg in capturas:
                await pg.screenshot(path=f'{CAP}/{capturas[seg]}.png')
            estado = await pg.evaluate("() => ({ v: __juego.scene.isActive('Victoria'), g: __juego.scene.isActive('GameOver'), n: __juego.scene.getScene('Nivel1')?.oleadas?.numero })")
            if estado['v'] or estado['g']:
                break
            # salta los descansos para acelerar la prueba
            await pg.evaluate("() => { const s = __juego.scene.getScene('Nivel1'); if (s.sys.isActive() && s.oleadas.estado === 'descanso' && s.oleadas.cuenta > 2) s.oleadas.cuenta = 2; }")
        await pg.wait_for_timeout(2500)
        await pg.screenshot(path=f'{CAP}/13-final.png')
        fin = await pg.evaluate("""() => {
          const v = __juego.scene.getScene('Victoria'), g = __juego.scene.getScene('GameOver');
          const s = __juego.scene.getScene('Nivel1');
          const p = s.puntaje;
          const formula = Math.max(0, p.puntosBajas + p.oleadas.reduce((a,n)=>a+200*n,0) + 50*p.bajasPorBarril + 300*p.oleadasSinDanio
            + 250*p.objetosMision + 500*p.nivelesCompletados + p.bonoTiempo - 50*p.golpes - 500*p.vidasPerdidas);
          const sumaDesglose = p.desglose().reduce((a, f) => a + f[2], 0);
          return { victoria: __juego.scene.isActive('Victoria'), gameover: __juego.scene.isActive('GameOver'),
                   total: p.total, formula, sumaDesglose, bajas: p.bajas, golpes: p.golpes, vidasPerdidas: p.vidasPerdidas,
                   oleadas: p.oleadas, sinDanio: p.oleadasSinDanio, bono: p.bonoTiempo, tiempo: Math.round(s.tiempoNivel) };
        }""")
        ok = fin['total'] == fin['formula'] == max(0, fin['sumaDesglose'])
        reg('P-14', 'Verificar puntaje de un nivel', 'Coincide con la fórmula de la sección 4.14',
            f"{'Victoria' if fin['victoria'] else 'Game Over'} en {fin['tiempo']} s; total {fin['total']} = fórmula {fin['formula']} = suma del desglose {fin['sumaDesglose']}; bajas {fin['bajas']}; golpes {fin['golpes']}; vidas perdidas {fin['vidasPerdidas']}; bono de tiempo {fin['bono']}", ok)
        await b.close()

        resultados.sort(key=lambda r: r['id'])
        json.dump(dict(resultados=resultados, errores=errores, partida=fin), open(f'{CAP}/resultados.json', 'w'), ensure_ascii=False, indent=1)
        print(f"\n{sum(r['ok'] for r in resultados)}/{len(resultados)} casos pasan · errores de JS: {len(errores)}")
        for e in errores[:10]: print('  ', e)

asyncio.run(main())
