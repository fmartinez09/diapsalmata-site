# Diapsalmata

Proyecto local. No publicar ni sincronizar con Sites u otro hosting sin una solicitud explícita del autor.

## Abrir

Desde esta carpeta:

```sh
node preview.cjs
```

Visitar http://127.0.0.1:4188/. No requiere instalar dependencias.

La pieza 3D necesita este servidor local: abrir `dist/index.html` como archivo no permite cargar los módulos. Three.js está incluido en `dist/vendor`, por lo que no requiere instalar dependencias para visualizarlo. Las fuentes de Google necesitan conexión; hay fuentes de respaldo.

## Archivos

- `dist/index.html`: portada y categorías Notes / Research / Projects.
- `dist/style.css`: composición y adaptación móvil. La pieza tiene una columna anclada arriba, independiente de la altura de las categorías; en móvil aparece antes del índice.
- `dist/script.js`: navegación y carga diferida del módulo 3D.
- `dist/jewel.js`: aproximación geométrica del broche aportado por el autor: curvas esmaltadas, ribetes de oro, flores nacaradas y hojas con piedras facetadas. Se puede girar arrastrando o con las flechas; Inicio o ↺ restablecen la orientación. No es un escaneado ni una reconstrucción exacta de las fotos.
- `dist/vendor/`: Three.js 0.180.0 y su licencia MIT. Copias locales de `three.module.min.js` y `three.core.min.js` del paquete npm fijado en `package-lock.json`.
- `dist/jewel-reference.png`: fotografía original, sin editar, como respaldo si WebGL no está disponible.
- `dist/landscape.jpg`: imagen aportada por el autor para esta propuesta local.

El render se actualiza al interactuar, cambiar de tamaño o durante la entrada breve. Se detiene fuera de pantalla. Respeta `prefers-reduced-motion`; el gesto vertical en móvil permite desplazar la página. Comprobación de sintaxis: `npm run check`.

Los títulos del índice son provisionales. No hay artículos, fechas o resultados publicados. Cuando existan entradas, el inicio podrá mostrar las más recientes con su tipo y fecha, y enlazar al artículo completo.

El artículo tendrá navegación superior, índice de contenidos a la izquierda, texto y figura central, y metadatos a la derecha; en móvil se apilarán.

Se retiró el manifiesto de hosting local. La eliminación del sitio remoto sigue pendiente: las herramientas disponibles durante esta revisión no ofrecían eliminar/despublicar.
