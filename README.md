# Diapsalmata

Proyecto local. No publicar ni sincronizar con Sites u otro hosting sin una solicitud explícita del autor.

## Abrir

Desde esta carpeta:

```sh
node preview.cjs
```

Visitar http://127.0.0.1:4188/. No requiere instalar dependencias.

También puede abrirse `dist/index.html` directamente. Las fuentes de Google necesitan conexión; hay fuentes de respaldo.

## Archivos

- `dist/index.html`: portada y categorías Notes / Research / Projects.
- `dist/collage.js`: revela cuatro recuadros en secuencia hacia la derecha de la imagen central, una vez cargadas las fotos. La composición usa recortes provisionales de `landscape.jpg` y `profile.jpg`; los tamaños se adaptan a móvil y la preferencia de movimiento reducido muestra el collage sin animarlo.
- `dist/about.html`: página About con texto e imagen provisionales; reemplaza el `src` y el texto `alt` de la imagen cuando elijas otra fotografía.
- `dist/style.css`: composición, adaptación móvil y vegetación SVG. La ilustración permanece anclada arriba, independiente de la altura de los desplegables; en móvil precede a las categorías.
- `dist/script.js`: la vegetación permanece oculta hasta que el título «Índice» entra en el 88% superior de la ventana. Entonces crece una sola vez durante 3,4 segundos. Con movimiento reducido se revela en ese mismo punto, sin animación.
- `scripts/generate-botanical.cjs`: fuente de la ilustración SVG: raíz abajo a la derecha, ramas hacia arriba a la izquierda, cuatro rosas rosadas, tres margaritas y un capullo. Ejecutar `node scripts/generate-botanical.cjs` para regenerarla en el HTML.
- `dist/landscape.jpg`: imagen aportada por el autor para esta propuesta local.
- `dist/liquid.js`: masa líquida de partículas con relajación de densidad, viscosidad y cohesión. El cursor empuja las partículas cercanas; la masa se estira y queda donde se desplaza, sin seguir al cursor. Un campo de densidad alimenta la superficie WebGL con refracción, reflejos y dispersión cromática. Probar mediante el servidor local; si WebGL no está disponible, se conserva la fotografía. Respeta la preferencia de movimiento reducido y pausa fuera de pantalla.

Los títulos del índice son provisionales. Hay un artículo de ejemplo enlazado desde Research; es un borrador con texto de relleno, no un resultado publicado.

## Crear y editar artículos

El ejemplo está en `dist/research/grados-de-turing-y-subtopos.html`. Sirve como plantilla para Notes, Research o Projects: duplica el archivo dentro de la carpeta que corresponda, edita el título, la categoría y el contenido, y añade un enlace desde el índice de `dist/index.html`. Los enlaces `../` del ejemplo funcionan si el nuevo archivo también queda en una carpeta de primer nivel dentro de `dist`.

Cada sección usa un `<section id="...">`: mantén su `id` sincronizado con el enlace `href="#..."` del índice lateral. Añade fecha o autor a la lista `<dl>` solo cuando correspondan. La fotografía de portada es provisional; reemplaza su `src` y su texto `alt` por los de la imagen definitiva. Para incluir otras imágenes, coloca los archivos en `dist` y usa `<figure><img src="../ruta/imagen.jpg" alt="Descripción"><figcaption>Pie de imagen</figcaption></figure>`.

Para diagramas interactivos, guarda un HTML autocontenido en `dist/diagrams/` y embébelo como en el ejemplo con `<iframe src="../diagrams/ejemplo.html" title="Descripción del diagrama" sandbox="allow-scripts"></iframe>`. El ejemplo es provisional e independiente; admite HTML, CSS y JavaScript. El sandbox permite sus scripts, pero aísla su origen: diagramas que requieran acceso a cookies, almacenamiento o a la página principal necesitarán otro diseño de integración. Usa únicamente código de diagramas de confianza. `dist/article.css` reúne los estilos compartidos. En móvil, el índice y los metadatos se apilan sobre el artículo.

Se retiró el manifiesto de hosting local. La eliminación del sitio remoto sigue pendiente: las herramientas disponibles durante esta revisión no ofrecían eliminar/despublicar.
