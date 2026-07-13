// Página de cuentos: muestra TODOS los cuentos, uno debajo del otro, cada
// uno en su propio panel glass. El primero es el que se clickeó (?n=N),
// el resto sigue en orden de numeración.
// Todo sale de la carpeta cuentos/: N.txt (primera línea = título, resto
// = cuerpo) y N.* (portada).
(function () {
  const CARPETA = 'cuentos/';
  const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];
  const MAX_CUENTOS = 60;
  const wrap = document.getElementById('cuentosLista');

  const n = Number(new URLSearchParams(location.search).get('n')) || null;

  async function existeImagen(ruta) {
    try {
      const res = await fetch(ruta, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  async function buscarImagen(numero) {
    // Se prueban las extensiones en paralelo, no una por una.
    const candidatos = EXTENSIONES.map((ext) => `${CARPETA}${numero}.${ext}`);
    const resultados = await Promise.all(
      candidatos.map(async (ruta) => ((await existeImagen(ruta)) ? ruta : null))
    );
    return resultados.find(Boolean) || null;
  }

  function separarTituloYCuerpo(texto) {
    const lineas = texto.split(/\r?\n/);
    const primerIndiceConTexto = lineas.findIndex((l) => l.trim());
    const titulo = (lineas[primerIndiceConTexto] || 'Sin título').trim();
    const cuerpo = lineas.slice(primerIndiceConTexto + 1).join('\n').trim();
    return { titulo, cuerpo };
  }

  async function cargarCuento(numero) {
    const [res, imagen] = await Promise.all([
      fetch(`${CARPETA}${numero}.txt`),
      buscarImagen(numero),
    ]);
    if (!res.ok) return null;
    const texto = await res.text();
    const { titulo, cuerpo } = separarTituloYCuerpo(texto);
    return { numero, titulo, cuerpo, imagen };
  }

  async function detectarNumeros() {
    const numeros = [];
    for (let i = 1; i <= MAX_CUENTOS; i++) {
      const res = await fetch(`${CARPETA}${i}.txt`).catch(() => null);
      if (!res || !res.ok) break;
      numeros.push(i);
    }
    return numeros;
  }

  function render(cuento) {
    const parrafos = cuento.cuerpo
      .split(/\n{2,}/)
      .map((p) => `<p>${p.replace(/\n/g, '<br>')}</p>`)
      .join('');

    return `
      <article class="cuento-item glass">
        <h1 class="cuento-titulo">${cuento.titulo}</h1>
        ${cuento.imagen ? `<img class="cuento-portada" src="${cuento.imagen}" alt="${cuento.titulo}">` : ''}
        <div class="cuento-texto">${parrafos}</div>
        <div class="cuento-item-volver">
          <a href="index.html#inicio" class="btn-outline text-gradiente">Volver a la página principal</a>
        </div>
      </article>`;
  }

  detectarNumeros()
    .then(async (numeros) => {
      if (!numeros.length) throw new Error('sin cuentos');

      // El clickeado primero, después el resto en orden numérico.
      const orden = n && numeros.includes(n)
        ? [n, ...numeros.filter((num) => num !== n)]
        : numeros;

      document.title = 'Cuentos - Matu Venao';

      const cuentos = await Promise.all(orden.map(cargarCuento));
      const final = `
        <div class="cuentos-fin">
          <p class="cuentos-fin-texto">¡NO QUEDAN MÁS CUENTOS!</p>
          <a href="index.html#inicio" class="btn-outline text-gradiente">Volver a la página principal</a>
        </div>`;
      wrap.innerHTML = cuentos.filter(Boolean).map(render).join('') + final;
    })
    .catch(() => {
      wrap.innerHTML = '<p class="loading">No se pudieron cargar los cuentos.</p>';
    });
})();
