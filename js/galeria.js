// Galería: detecta imágenes numeradas en img/biografia/ (1, 2, 3...) solo,
// sin necesidad de editar JSON. Se arma una tira que se desliza sola de
// derecha a izquierda en loop infinito. Al hacer clic se abre en grande,
// con scroll horizontal nativo (scroll-snap): el swipe en celular lo maneja
// el propio navegador (sin bugs de sincronización), y las flechas en PC
// simplemente piden scrollear a la imagen siguiente/anterior.
(function () {
  const CARPETA = 'img/biografia/';
  const EXTENSIONES = ['webp', 'jpg', 'jpeg', 'png'];
  const MAX_IMAGENES = 60;

  const track = document.getElementById('galeriaTrack');
  const lightbox = document.getElementById('lightbox');
  const lightboxTrack = document.getElementById('lightboxTrack');
  const btnClose = document.getElementById('lightboxClose');
  const btnPrev = document.getElementById('lightboxPrev');
  const btnNext = document.getElementById('lightboxNext');

  let imagenes = [];

  async function existeImagen(ruta, reintentos = 2) {
    try {
      // HEAD da una respuesta HTTP real: 404 = no existe (definitivo),
      // en vez de Image() que confunde fallas de red pasajeras con "no existe".
      const res = await fetch(ruta, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    } catch (err) {
      // Esto sí es un error de red genuino (no un 404), vale la pena reintentar.
      if (reintentos > 0) {
        await new Promise((r) => setTimeout(r, 400));
        return existeImagen(ruta, reintentos - 1);
      }
      return false;
    }
  }

  async function buscarArchivo(numero) {
    // Se prueban las 4 extensiones en paralelo (no una por una), así no se
    // suman los tiempos de cada pedido.
    const candidatos = EXTENSIONES.map((ext) => `${CARPETA}${numero}.${ext}`);
    const resultados = await Promise.all(
      candidatos.map(async (ruta) => ((await existeImagen(ruta)) ? ruta : null))
    );
    return resultados.find(Boolean) || null;
  }

  async function detectarImagenes() {
    const encontradas = [];
    for (let n = 1; n <= MAX_IMAGENES; n++) {
      const ruta = await buscarArchivo(n);
      if (!ruta) break;
      encontradas.push(ruta);
    }
    return encontradas;
  }

  function construirTira() {
    // Se duplica la tira para que el loop del scroll automático sea continuo.
    const html = imagenes
      .map(
        (src, i) => `<div class="galeria-item" data-indice="${i}"><img src="${src}" alt="Foto ${i + 1}"></div>`
      )
      .join('');
    track.innerHTML = html + html;

    track.querySelectorAll('.galeria-item').forEach((item) => {
      item.addEventListener('click', () => {
        abrirLightbox(Number(item.dataset.indice));
      });
    });

    // Recién ahora que el ancho real ya está armado se activa la animación,
    // así el reloj del scroll automático no arranca contra un ancho vacío.
    requestAnimationFrame(() => track.classList.add('listo'));
  }

  function construirLightbox() {
    lightboxTrack.innerHTML = imagenes
      .map((src, i) => `<div class="lightbox-slide" data-indice="${i}"><img src="${src}" alt="Foto ${i + 1}"></div>`)
      .join('');
  }

  function abrirLightbox(indice) {
    lightbox.classList.add('open');
    document.body.style.overflow = 'hidden';
    // scrollTo sobre el propio track (no scrollIntoView), que puede terminar
    // scrolleando toda la página además del carrusel.
    lightboxTrack.scrollTo({ left: lightboxTrack.children[indice].offsetLeft, behavior: 'auto' });
  }

  function cerrarLightbox() {
    lightbox.classList.remove('open');
    document.body.style.overflow = '';
  }

  function indiceVisible() {
    const centro = lightboxTrack.scrollLeft + lightboxTrack.clientWidth / 2;
    let mejor = 0;
    let mejorDistancia = Infinity;
    [...lightboxTrack.children].forEach((slide, i) => {
      const distancia = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - centro);
      if (distancia < mejorDistancia) {
        mejorDistancia = distancia;
        mejor = i;
      }
    });
    return mejor;
  }

  function irA(indice) {
    const total = lightboxTrack.children.length;
    const destino = (indice + total) % total;
    lightboxTrack.scrollTo({ left: lightboxTrack.children[destino].offsetLeft, behavior: 'smooth' });
  }

  function siguiente() { irA(indiceVisible() + 1); }
  function anterior() { irA(indiceVisible() - 1); }

  btnClose.addEventListener('click', cerrarLightbox);
  btnNext.addEventListener('click', siguiente);
  btnPrev.addEventListener('click', anterior);

  lightbox.addEventListener('click', (e) => {
    if (e.target === lightbox) cerrarLightbox();
  });

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') cerrarLightbox();
    if (e.key === 'ArrowRight') siguiente();
    if (e.key === 'ArrowLeft') anterior();
  });

  detectarImagenes().then((encontradas) => {
    imagenes = encontradas;
    if (!imagenes.length) {
      document.getElementById('galeria').style.display = 'none';
      return;
    }
    construirTira();
    construirLightbox();
  });
})();
