# Laboratorio de lógica y programación ADSO

Simulador web para el programa **Tecnólogo en Análisis y Desarrollo de Software (ADSO)**. Acompaña al aprendiz desde el diagrama de flujo hasta sus primeros programas en C++.

## Módulos

| Módulo | Qué permite hacer |
|---|---|
| **1. Diagramas de flujo** | Construir algoritmos con bloques (entrada, proceso, salida, decisión, mientras, para), ejecutarlos paso a paso con tabla de variables, validar 8 retos y convertir el diagrama a pseudocódigo o C++. |
| **2. Ejercicios en chat** | Tutor guiado con 5 temas (secuencia, variables, condicionales, ciclos, prueba de escritorio), 21 ejercicios, pistas, explicaciones y puntaje. |
| **3. Laboratorio C++** | Editor con resaltado, compilación simulada con errores en español, ejecución con `cin`, 8 retos con validación automática y práctica libre. |

## Publicar en GitHub Pages

1. Cree un repositorio nuevo en GitHub (por ejemplo `simulador-logica-adso`), público.
2. Suba **todo el contenido** de esta carpeta a la raíz del repositorio (botón *Add file › Upload files*, arrastrando `index.html`, `README.md`, `.nojekyll` y las carpetas `css` y `js`).
3. Vaya a **Settings › Pages**.
4. En *Build and deployment* elija **Source: Deploy from a branch**, rama **main** y carpeta **/ (root)**. Guarde.
5. En uno o dos minutos el sitio queda disponible en:
   `https://<su-usuario>.github.io/simulador-logica-adso/`

> Si el archivo `.nojekyll` no aparece al subirlo desde el navegador (los archivos que empiezan con punto a veces se ocultan), créelo con *Add file › Create new file*, nombre `.nojekyll`, sin contenido.

## Enlazar o embeber en Zajuna / Moodle

- **Enlace:** agregue un recurso tipo *URL* con la dirección de GitHub Pages.
- **Embebido:** en una página o etiqueta, use el editor HTML:

```html
<iframe src="https://<su-usuario>.github.io/simulador-logica-adso/#diagramas"
        width="100%" height="820" style="border:0" allowfullscreen></iframe>
```

Puede abrir directamente un módulo con `#diagramas`, `#tutor` o `#cpp` al final de la dirección.

## Estructura

```
index.html          Estructura de la página
css/estilos.css     Estilos (modo claro y oscuro)
js/nucleo.js        Intérpretes: diagramas de flujo y subconjunto de C++
js/contenidos.js    Retos y ejercicios (archivo para editar contenidos)
js/interfaz.js      Comportamiento de la interfaz
```

## Editar o agregar ejercicios

Todo el contenido pedagógico está en `js/contenidos.js`:

- `FLOW_RETOS`: retos de diagramas. Cada uno tiene descripción, datos de prueba (`tests`), valores que deben aparecer en la salida (`ex`) y la solución.
- `TEMAS`: temas del tutor. Tipos de ejercicio: `op` (opción múltiple), `num` (número), `txt` (texto) y `ord` (ordenar letras).
- `CPP_RETOS`: retos de C++ con plantilla (`tpl`), solución (`sol`) y casos de prueba (`tests`).

## Alcance del C++ simulado

Tipos `int`, `double`, `float`, `char`, `bool`, `string`; `cout`, `cin`, `getline`, `cin.ignore`; `if/else`, `switch`, `while`, `do-while`, `for`, `break`, `continue`; operadores aritméticos, relacionales, lógicos, de asignación compuesta e incremento; funciones de `<cmath>` (`sqrt`, `pow`, `abs`, `round`, `floor`, `ceil`, `fmod`). No incluye arreglos ni funciones definidas por el usuario.

## Notas

- Funciona 100 % en el navegador; no requiere servidor, base de datos ni cuentas.
- El progreso del aprendiz (diagramas, puntaje del chat, código) se guarda en el navegador que use.
- Para probarlo localmente basta con abrir `index.html`.
