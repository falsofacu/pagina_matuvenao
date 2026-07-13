// Slider de portada: detecta las imágenes solo, sin necesidad de editar JSON.
// Se nombran los archivos en img/banner/ como "1A", "1B", "2A", "2B"...
//   - El número es la posición en el slider (1, 2, 3...).
//   - La letra A es la versión para PC (horizontal).
//   - La letra B es la versión para celular (vertical).
// Si a un número le falta alguna de las dos letras, se usa la otra en su lugar.
// Se prueban varias extensiones de archivo automáticamente.
// El slider usa scroll horizontal nativo con scroll-snap: en celular el
// swipe lo maneja el navegador directamente (sin bugs de sincronización),
// y el alto se ajusta según la proporción real de cada imagen.
(function () {
  const slider = document.getElementById('heroSlider');
  const dotsWrap = document.getElementById('heroDots');
  const hero = document.getElementById('inicio');
  const CARPETA = 'img/banner/';
  const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];
  const MAX_SLIDES = 30;

  let slides = [];
  let current = 0;
  let timer = null;
  let ignorarScroll = false;

  function existeImagen(ruta) {
    return new Promise((resolve) => {
      const img = new Image();
      img.onload = () => resolve({ ruta, w: img.naturalWidth, h: img.naturalHeight });
      img.onerror = () => resolve(null);
      img.src = ruta;
    });
  }

  async function buscarArchivo(numero, letra) {
    // Se prueban las extensiones en paralelo, no una por una.
    const candidatos = EXTENSIONES.map((ext) => `${CARPETA}${numero}${letra}.${ext}`);
    const resultados = await Promise.all(candidatos.map(existeImagen));
    return resultados.find(Boolean) || null;
  }

  async function detectarSlides() {
    const encontrados = [];
    for (let n = 1; n <= MAX_SLIDES; n++) {
      const [pc, movil] = await Promise.all([
        buscarArchivo(n, 'A'),
        buscarArchivo(n, 'B'),
      ]);
      if (!pc && !movil) break; // no hay más números seguidos, se corta la búsqueda
      encontrados.push({
        landscape: pc || movil,
        portrait: movil || pc,
        alt: `Matu Venao - Banner ${n}`,
      });
    }
    return encontrados;
  }

  function elegir(slide) {
    const isPortrait = window.innerHeight > window.innerWidth;
    if (isPortrait && slide.portrait) return slide.portrait;
    if (!isPortrait && slide.landscape) return slide.landscape;
    return slide.landscape || slide.portrait;
  }

  function ajustarAltura() {
    if (!slides.length) return;
    const elegido = elegir(slides[current]);
    if (!elegido || !elegido.w || !elegido.h) return;
    // width 100% / height auto: el alto sigue siempre la proporción real
    // de la imagen, se ve completa sin recortar sin importar la resolución.
    const anchoDisponible = slider.clientWidth || window.innerWidth;
    const alturaIdeal = anchoDisponible / (elegido.w / elegido.h);
    hero.style.height = `${alturaIdeal}px`;
  }

  function construir() {
    slider.innerHTML = '';
    dotsWrap.innerHTML = '';

    // Con una sola imagen no hay entre qué navegar, así que no tiene
    // sentido mostrar los puntitos.
    dotsWrap.style.display = slides.length > 1 ? '' : 'none';

    slides.forEach((slide, i) => {
      const div = document.createElement('div');
      div.className = 'hero-slide';
      div.style.backgroundImage = `url('${elegir(slide).ruta}')`;
      div.setAttribute('role', 'img');
      div.setAttribute('aria-label', slide.alt || '');
      slider.appendChild(div);

      if (slides.length > 1) {
        const dot = document.createElement('div');
        dot.className = 'dot' + (i === current ? ' active' : '');
        dot.addEventListener('click', () => goTo(i));
        dotsWrap.appendChild(dot);
      }
    });

    posicionar(true);
    ajustarAltura();
  }

  function posicionar(sinAnimacion) {
    ignorarScroll = true;
    // Se usa scrollTo sobre el propio contenedor (no scrollIntoView), que
    // puede terminar scrolleando TODA la página para "traer a la vista"
    // el elemento si el usuario ya bajó de la portada.
    slider.scrollTo({
      left: slider.children[current].offsetLeft,
      behavior: sinAnimacion ? 'auto' : 'smooth',
    });
    [...dotsWrap.children].forEach((dot, i) => dot.classList.toggle('active', i === current));
    setTimeout(() => { ignorarScroll = false; }, sinAnimacion ? 50 : 500);
  }

  function goTo(index) {
    current = (index + slides.length) % slides.length;
    posicionar(false);
    ajustarAltura();
    resetTimer();
  }

  function next() { goTo(current + 1); }

  function resetTimer() {
    clearInterval(timer);
    if (slides.length > 1) timer = setInterval(next, 6000);
  }

  function indiceVisible() {
    const centro = slider.scrollLeft + slider.clientWidth / 2;
    let mejor = 0;
    let mejorDistancia = Infinity;
    [...slider.children].forEach((slide, i) => {
      const distancia = Math.abs(slide.offsetLeft + slide.clientWidth / 2 - centro);
      if (distancia < mejorDistancia) {
        mejorDistancia = distancia;
        mejor = i;
      }
    });
    return mejor;
  }

  let scrollTimeout;
  slider.addEventListener('scroll', () => {
    if (ignorarScroll) return;
    clearTimeout(scrollTimeout);
    scrollTimeout = setTimeout(() => {
      current = indiceVisible();
      [...dotsWrap.children].forEach((dot, i) => dot.classList.toggle('active', i === current));
      ajustarAltura();
      resetTimer();
    }, 120);
  });

  let resizeTimeout;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(construir, 200);
  });

  detectarSlides().then((encontrados) => {
    slides = encontrados;
    if (!slides.length) {
      slider.innerHTML = '<div class="hero-slide active" style="background:#1a1a1c"></div>';
      return;
    }
    construir();
    resetTimer();
  });
})();
