# Reporte de pruebas beta — Turno de Noche (Nivel 1)

**Versión probada:** beta 0.1 · Nivel 1 «La gasolinera»
**Fecha:** 18 de noviembre de 2026
**Navegador:** Google Chrome 153 (escritorio, 960 × 540)
**Responsable de coordinar pruebas:** Jose Ramon Ibarra Fontes (según el reparto del GDD)

Este reporte sigue el plan de pruebas de la sección 6.5 del GDD. Tiene tres partes:

1. **Pruebas funcionales P-01 a P-14:** se automatizaron con Playwright (una herramienta que abre el navegador y presiona teclas y el mouse como si fuera un jugador) para poder repetirlas después de cada cambio.
2. **Defectos encontrados y corregidos** durante esas pruebas.
3. **Pruebas con jugadores:** de 3 a 5 compañeros que no conocen el juego, con encuesta. Esta parte se llena cuando se hagan las sesiones.

---

## 1. Resultados de los casos de prueba

| ID | Caso | Resultado esperado | Resultado obtenido | Estado |
|---|---|---|---|---|
| P-01 | Abrir el juego por URL | Carga el menú sin errores en consola | Menú activo: True; errores en consola: 0 | ✅ Pasa |
| P-02 | Moverse contra paredes y autos | No los atraviesa | y contra pared = 298 (pared termina en 288); x contra auto = 699 (auto empieza en 708); rapidez en diagonal = 150 px/s | ✅ Pasa |
| P-03 | Disparar hasta vaciar el cargador | Suena clic y no dispara; R recarga | 14 clics con 12 balas → cargador 0 (nunca negativo); tras R: 12/12 | ✅ Pasa |
| P-04 | Golpear a un caminante con la llave | Recibe 15 de daño por golpe | salud 30 → 15 | ✅ Pasa |
| P-05 | Completar la oleada 1 | Suma 200 + bajas y entrega la pistola | puntos 700 (esperado 700: 6×100 + 200 + sin daño 0×300); pistola: True; pesos: $40; estado: descanso | ✅ Pasa |
| P-06 | Disparar a un barril con infectados cerca | Explota, los daña y da +50 por baja | 3 infectados a menos de 80 px: bajas por barril 3; puntos ganados 550 (= 2×150 + 100 + 3×50); el caminante (30 de salud) recibió 40 y murió | ✅ Pasa |
| P-07 | Recibir daño hasta salud 0 | Pierde 1 vida, −500 puntos, reaparece en la tienda | vidas 3 → 2; puntos −550 (−50 golpe, −500 vida); reaparece en (448, 336) = punto de la tienda; salud 100 | ✅ Pasa |
| P-08 | Perder las 3 vidas | Aparece Game Over con puntaje | escena GameOver activa: True | ✅ Pasa |
| P-09 | Comprar sin pesos suficientes | Botón gris, sonido de error, nada cambia | compra rechazada: «Pesos insuficientes»; pesos 10 → 10; reserva sin cambio | ✅ Pasa |
| P-10 | Comprar balas con la reserva casi llena | No rebasa 60 | con 55: rechazada («Reserva llena (máx. 60)»); con 48: comprada → reserva 60; pesos 100 → 80 | ✅ Pasa |
| P-11 | Eliminar al hinchado de cerca | Explota y daña al jugador | salud de Marco 100 → 85 (−15); caminante vecino 30 → 15 | ✅ Pasa |
| P-12 | Pausar durante una oleada | Todo se detiene; al reanudar continúa igual | 2 infectados y cola de 6: idénticos tras 2 s en pausa = True; reloj del nivel detenido = True; al reanudar se mueven = True | ✅ Pasa |
| P-13 | Silenciar con M | Se apaga música y efectos | M → mute = True; M otra vez → mute = False | ✅ Pasa |
| P-14 | Verificar puntaje de un nivel | Coincide con la fórmula de la sección 4.14 | Victoria en 55 s; total 5588 = fórmula 5588 = suma del desglose 5588; bajas {'caminante': 17, 'corredor': 6, 'hinchado': 1, 'trailero': 0}; golpes 1; vidas perdidas 0; bono de tiempo 488 | ✅ Pasa |

**Resumen: 14 de 14 casos pasan, sin errores en la consola del navegador.**

### Partida completa de verificación (P-14)

Un jugador automático jugó el Nivel 1 completo: apunta al infectado más cercano, dispara y recarga. Para acelerar la prueba se acortaron los descansos entre oleadas.

| Dato | Valor |
|---|---|
| Resultado | Victoria |
| Tiempo del nivel | 55 s |
| Bajas | 17 caminantes, 6 corredores, 1 hinchado |
| Oleadas superadas | 1, 2, 3 (2 sin recibir daño) |
| Golpes recibidos / vidas perdidas | 1 / 0 |
| Bono de tiempo | 488 |
| **Puntaje total** | **5,588** |
| Puntaje calculado con la fórmula de la sección 4.14 | 5,588 |
| Suma del desglose de la pantalla final | 5,588 |

Los tres valores coinciden, así que el puntaje en pantalla respeta la fórmula del GDD.

Las capturas de cada caso están en [`docs/capturas/`](capturas/).

---

## 2. Defectos encontrados

Cada defecto se registra también como *issue* en GitHub con la etiqueta «prueba».

| # | Título | Pasos para reproducir | Esperado | Obtenido | Gravedad | Estado |
|---|---|---|---|---|---|---|
| D-01 | El juego se congela al explotar un barril | Disparar a cualquier barril rojo | Explota y el juego sigue | Error en consola `Cannot read properties of undefined (reading 'explosion')` y el juego deja de responder | Alta | Corregido: el barril guarda la referencia a la escena antes de destruirse (`Barril.js`) |
| D-02 | La tienda no abre y el nivel se queda en pausa | Terminar la oleada 1, ir con Doña Lupe y presionar E | Se abre la tienda | El nivel se pausa y no aparece nada: la escena se llamaba `'Tienda'` en un lado y `'TiendaEscena'` en otro | Alta | Corregido (`Nivel1.js`) |
| D-03 | Cerrar la tienda o la pausa con la misma tecla la vuelve a abrir | Abrir la tienda con E y cerrarla con Esc | Se cierra y sigue el juego | Se abre el menú de pausa en el mismo instante | Media | Corregido: después de reanudar se ignoran E, Esc y P durante 250 ms |
| D-04 | El destello de daño tapa toda la pantalla | Dejarse golpear por varios infectados | Aviso visual breve | Toda la pantalla se pinta de rojo y no se ve a los enemigos | Baja | Corregido: destello suave al 22 % en el HUD |
| D-05 | El aviso «[E] Abrir tienda» se queda visible detrás de la tienda | Abrir la tienda | El aviso desaparece | Se ve debajo del panel | Baja | Corregido |
| D-06 | Los botones del menú tapan a Marco en la portada | Abrir el juego | Portada visible | Los botones quedan encima del personaje | Baja | Corregido: los botones bajaron a una franja inferior |

---

## 3. Pruebas con jugadores (pendiente de llenar)

**Quién prueba:** los cuatro integrantes y de 3 a 5 compañeros que no conocen el juego.
**Dónde:** la versión publicada en GitHub Pages, en Chrome y en Firefox.

### Registro por jugador

| Jugador | Navegador | ¿Entendió qué hacer sin ayuda? | Dificultad (1-5) | ¿En qué oleada perdió? | ¿Usó la tienda? | Lo más divertido | Lo más frustrante |
|---|---|---|---|---|---|---|---|
| 1. | | | | | | | |
| 2. | | | | | | | |
| 3. | | | | | | | |
| 4. | | | | | | | |
| 5. | | | | | | | |

### Encuesta (copiar a Google Forms)

1. ¿Entendiste qué tenías que hacer sin que nadie te explicara? (Sí / Más o menos / No)
2. ¿Qué tan difícil te pareció? (1 = muy fácil · 5 = muy difícil)
3. ¿En qué oleada perdiste o hasta dónde llegaste?
4. ¿Usaste la tienda de Doña Lupe? ¿Qué compraste?
5. ¿Qué fue lo más divertido?
6. ¿Qué fue lo más frustrante o confuso?
7. ¿Encontraste algún error? Descríbelo.

### Conclusiones y ajustes de balance

*(Llenar después de las sesiones: por ejemplo, si la mayoría pierde en la oleada 2, bajar la velocidad del corredor o subir la munición inicial en `src/config.js`.)*

---

## Cómo volver a correr las pruebas automáticas

```bash
# en una terminal, desde la carpeta del repositorio
python -m http.server 8765
# en otra terminal
pip install playwright && playwright install chromium
python pruebas/pruebas_beta.py http://localhost:8765/ docs/capturas
```
