// Cuentos: se arman solos a partir de archivos numerados, sin JSON.
// Todo vive junto en la carpeta cuentos/: 1.jpg + 1.txt, 2.jpg + 2.txt, ...
// El título de cada cuento es siempre la primera línea del .txt.
// Al hacer clic se abre cuento.html?n=N con el cuento completo.
(function () {
  const wrap = document.getElementById('cuentosList');
  const CARPETA = 'cuentos/';
  const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];
  const MAX_CUENTOS = 60;

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

  function primeraLinea(texto) {
    return (texto.split(/\r?\n/).find((l) => l.trim()) || 'Sin título').trim();
  }

  async function detectarCuentos() {
    const encontrados = [];
    for (let n = 1; n <= MAX_CUENTOS; n++) {
      const [imagen, res] = await Promise.all([
        buscarImagen(n),
        fetch(`${CARPETA}${n}.txt`).catch(() => null),
      ]);
      const texto = res && res.ok ? await res.text() : null;
      if (!imagen && !texto) break;
      encontrados.push({
        numero: n,
        imagen,
        titulo: texto ? primeraLinea(texto) : `Cuento ${n}`,
      });
    }
    return encontrados;
  }

  detectarCuentos()
    .then((cuentos) => {
      if (!cuentos.length) {
        wrap.innerHTML = '<p class="loading">Próximamente nuevos cuentos.</p>';
        return;
      }
      wrap.innerHTML = cuentos
        .map(
          (c) => `
        <a class="cuento-card" href="cuento?n=${c.numero}">
          ${c.imagen ? `<img src="${c.imagen}" alt="${c.titulo}">` : ''}
          <div class="cuento-title">${c.titulo}</div>
        </a>`
        )
        .join('');
    })
    .catch(() => {
      wrap.innerHTML = '<p class="loading">No se pudieron cargar los cuentos.</p>';
    });
})();
