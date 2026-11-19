# Turno de Noche — Gasolinera 24 h

Shooter 2D de supervivencia con vista desde arriba, hecho con **Phaser 4** para el navegador.
Marco, empleado del turno nocturno de una gasolinera en el desierto de Sonora, debe aguantar hasta el amanecer.

**Jugar:** https://joseortega8.github.io/turno-de-noche/
**Tablero de tarjetas:** https://github.com/users/JoseOrtega8/projects/3
**Documento de diseño (GDD):** [docs/GDD.pdf](docs/GDD.pdf)
**Manual de usuario:** [docs/manual-usuario.md](docs/manual-usuario.md) · **Reporte de pruebas beta:** [docs/pruebas-beta.md](docs/pruebas-beta.md)

## Estado: versión beta

Nivel 1 «La gasolinera» completo y jugable: menú, introducción, movimiento y apuntado, llave inglesa y pistola, los tres tipos de infectado, tres oleadas, barriles explosivos, tienda de Doña Lupe, 3 vidas, HUD, puntaje con desglose, pausa, Game Over y Victoria. Los 14 casos del plan de pruebas pasan (ver el reporte).

Pendiente para la versión completa: Nivel 2 (carretera, objetos de misión, escopeta y chaleco) y Nivel 3 (El Trailero).

| Lo que pide la rúbrica | Dónde está en el código |
|---|---|
| Eventos | `src/systems/Eventos.js` (nombres) y `src/systems/Oleadas.js` (inicioOleada, finOleada) |
| Comportamientos | `src/entities/Enemigo.js` y sus subclases `Caminante`, `Corredor`, `Hinchado`; `src/systems/Navegacion.js` |
| Transacciones | `src/systems/Tienda.js` (valida y después aplica) y `src/scenes/Tienda.js` |
| Acciones | `src/entities/Jugador.js` (moverse, apuntar, atacar, recargar, botiquín, cambiar arma) |
| Colisiones | `crearColisiones()` en `src/scenes/Nivel1.js` |
| Puntaje | `src/systems/Puntaje.js` (fórmula de la sección 4.14 del GDD) |
| Oportunidades (vidas) | `src/systems/Vidas.js` y `perderVida()` en `Nivel1.js` |

## Equipo

| Integrante | Área |
|---|---|
| Federico Antonio Gutierrez Amaya | Núcleo del juego, repositorio y publicación |
| Luis Angel Andrade Silva | Arte, animación y comportamiento de enemigos |
| Jose Carlos Calles Ortega | Sistemas (oleadas, puntaje, vidas, tienda) y documentación |
| Jose Ramon Ibarra Fontes | Niveles, música, efectos de sonido y pruebas |

Universidad Tecnológica de Hermosillo · Creación de Videojuegos · Maestro: Iván Chenoweth · Grupo: 10-2

## Controles

| Tecla | Acción |
|---|---|
| W A S D | Moverse |
| Mouse / clic izquierdo | Apuntar / atacar |
| R | Recargar |
| 1 · 2 · 3 | Cambiar arma |
| Q | Usar botiquín |
| E | Interactuar (tienda, objetos, radio) |
| Esc o P | Pausa |
| M | Silenciar |

## Cómo correrlo en tu computadora

1. Instala [VS Code](https://code.visualstudio.com/) con la extensión **Live Server**, y Git.
2. Clona el repositorio:
   ```bash
   git clone https://github.com/JoseOrtega8/turno-de-noche.git
   cd turno-de-noche
   ```
3. Abre la carpeta en VS Code y da clic en **Go Live**. No abras `index.html` con doble clic: el juego necesita un servidor local.

Phaser está en `lib/phaser.min.js` con una versión fija (4.2.1). No lo actualices sin acordarlo con el equipo.

## Estructura

```
index.html
lib/phaser.min.js              Phaser 4.2.1 (versión fija)
src/main.js                    configuración del juego
src/config.js                  todos los valores del GDD (vida, daño, precios, oleadas, puntos)
src/animaciones.js             animaciones por cuadros
src/scenes/    Boot, Menu, Intro, Nivel1, HUD, Tienda, Pausa, Resultados (GameOver y Victoria)
src/entities/  Jugador, Enemigo, Caminante, Corredor, Hinchado, Bala, Barril, Recogible
src/systems/   Oleadas, Puntaje, Vidas, Inventario, Tienda, Navegacion, Audio, Eventos
assets/        img/ (sprites y tileset) audio/ (OGG y MP3) maps/nivel1.json (Tiled)
docs/          GDD.pdf, manual-usuario.md, pruebas-beta.md, capturas/
pruebas/       pruebas_beta.py (casos P-01 a P-14 automatizados)
```

Para ver las cajas de colisión abre el juego con `?debug` al final de la URL.

## Cómo contribuir

1. Toma una tarjeta del tablero y muévela a **En progreso**.
2. `git checkout dev && git pull`, luego crea tu rama: `feat/...`, `art/...`, `audio/...`, `docs/...` o `fix/...`.
3. Haz commits pequeños: `feat: disparo de pistola`, `fix: colisión con barriles`.
4. Abre un PR hacia `dev` con `Closes #número` y una captura o GIF.
5. Otro integrante revisa y aprueba antes del merge. `dev` se une a `main` al cerrar cada semana.

## Créditos

Motor: Phaser 4 (licencia MIT). Mapas: Tiled. Arte: Piskel, GIMP y Krita. Audio: BeepBox, jsfxr y Audacity.
Arte, música y efectos originales del equipo. La portada del menú es la Figura 1 del GDD.
