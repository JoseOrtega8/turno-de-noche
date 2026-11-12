# Turno de Noche — Gasolinera 24 h

Shooter 2D de supervivencia con vista desde arriba, hecho con **Phaser 4** para el navegador.
Marco, empleado del turno nocturno de una gasolinera en el desierto de Sonora, debe aguantar hasta el amanecer.

**Jugar:** https://joseortega8.github.io/turno-de-noche/
**Tablero de tarjetas:** [URL de GitHub Projects]
**Documento de diseño (GDD):** [docs/GDD.docx](docs/GDD.docx)

## Equipo

| Integrante | Área |
|---|---|
| Federico Antonio Gutierrez Amaya | Núcleo del juego, repositorio y publicación |
| Luis Angel Andrade Silva | Arte, animación y comportamiento de enemigos |
| Jose Carlos Calles Ortega | Sistemas (oleadas, puntaje, vidas, tienda) y documentación |
| Jose Ramon Ibarra Fontes | Niveles, música, efectos de sonido y pruebas |

Universidad Tecnológica de Hermosillo · Creación de Videojuegos · Maestro: [nombre] · Grupo: [grupo]

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

Phaser está en `lib/phaser.min.js` con una versión fija (4.2.x). No lo actualices sin acordarlo con el equipo.

## Estructura

```
index.html
lib/phaser.min.js
src/main.js
src/scenes/    Boot, Menu, Nivel1, Nivel2, Nivel3, Tienda, HUD, GameOver, Victoria
src/entities/  Jugador, Enemigo, Trailero, Bala
src/systems/   Oleadas, Puntaje, Vidas, Inventario, Tienda
assets/        img/ audio/ maps/
docs/          GDD.docx
```

## Cómo contribuir

1. Toma una tarjeta del tablero y muévela a **En progreso**.
2. `git checkout dev && git pull`, luego crea tu rama: `feat/...`, `art/...`, `audio/...`, `docs/...` o `fix/...`.
3. Haz commits pequeños: `feat: disparo de pistola`, `fix: colisión con barriles`.
4. Abre un PR hacia `dev` con `Closes #número` y una captura o GIF.
5. Otro integrante revisa y aprueba antes del merge. `dev` se une a `main` al cerrar cada semana.

## Créditos

Motor: Phaser 4 (licencia MIT). Mapas: Tiled. Arte: Piskel, GIMP y Krita. Audio: BeepBox, jsfxr y Audacity.
Arte, música y efectos originales del equipo, salvo lo que se indique en la sección de créditos del GDD.
