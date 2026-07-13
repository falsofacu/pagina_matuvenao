// Landing page de un show puntual (para pauta de Facebook/Meta): se arma
// sola a partir de data/fechas.json (?id=... identifica cuál) y de un txt
// compartido en data/descripciones/ con la descripción del show.
(function () {
  const wrap = document.getElementById('eventoContenido');
  const id = new URLSearchParams(location.search).get('id');

  const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  const MESES = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];

  function formatFecha(iso) {
    const [y, m, d] = iso.split('-').map(Number);
    // new Date(y, m-1, d) usa componentes locales, no UTC: si se parseara
    // el string ISO directo, en husos horarios negativos (UY/AR) el día
    // se corre uno para atrás.
    const fecha = new Date(y, m - 1, d);
    return `${DIAS[fecha.getDay()]} ${d} de ${MESES[m - 1]}`;
  }

  function slug(texto) {
    return texto
      .toLowerCase()
      .normalize('NFD').replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-+|-+$/g, '');
  }

  function setMeta(elId, attr, valor) {
    const el = document.getElementById(elId);
    if (el) el.setAttribute(attr, valor);
  }

  async function existeImagen(ruta) {
    try {
      const res = await fetch(ruta, { method: 'HEAD', cache: 'no-store' });
      return res.ok;
    } catch (err) {
      return false;
    }
  }

  // Si el evento no tiene portada propia, se usa el primer banner de la
  // portada del sitio (1A/1B en img/banner/) en vez de una imagen fija.
  async function buscarPortadaPorDefecto() {
    const EXTENSIONES = ['jpg', 'jpeg', 'png', 'webp'];
    const candidatos = [];
    ['1A', '1B'].forEach((nombre) => {
      EXTENSIONES.forEach((ext) => candidatos.push(`img/banner/${nombre}.${ext}`));
    });
    const resultados = await Promise.all(
      candidatos.map(async (ruta) => ((await existeImagen(ruta)) ? ruta : null))
    );
    return resultados.find(Boolean) || 'img/biografia/main.webp';
  }

  function render(evento, descripcion, portadaPorDefecto) {
    const portada = evento.portada || portadaPorDefecto;
    const direccion = [evento.lugar, evento.direccion2, evento.ciudad].filter(Boolean).join(', ');
    const mapaQuery = encodeURIComponent(`${evento.lugar} ${evento.direccion2 || ''} ${evento.ciudad} ${evento.pais}`);

    document.title = `${evento.titulo} - Matu Venao`;
    setMeta('eventoDescMeta', 'content', `${evento.titulo} - ${formatFecha(evento.fecha)} - ${evento.lugar}, ${evento.ciudad}`);
    setMeta('ogTitle', 'content', `${evento.titulo} - Matu Venao`);
    setMeta('ogDescription', 'content', `${formatFecha(evento.fecha)} · ${evento.hora} hs - ${evento.lugar}, ${evento.ciudad}`);
    setMeta('ogImage', 'content', portada);

    wrap.innerHTML = `
      <div class="evento-layout">
        <div class="evento-col-izquierda">
          <div class="evento-col-principal glass">
            <div class="evento-poster" style="background-image:url('${portada}')">
              <p class="evento-poster-caption">${formatFecha(evento.fecha)}${evento.hora ? ' · ' + evento.hora + ' hs' : ''} · ${evento.lugar}</p>
            </div>

            <h1 class="evento-titulo">${evento.titulo}</h1>
            <p class="evento-datos-fecha text-gradiente">${formatFecha(evento.fecha)}${evento.hora ? ' · ' + evento.hora + ' hs' : ''}</p>
            <p class="evento-datos-lugar">${direccion}</p>

            ${descripcion ? `<div class="evento-descripcion"><p>${descripcion}</p></div>` : ''}
          </div>

          <div class="evento-mapa-wrap glass">
            <div class="evento-mapa">
              <iframe src="https://www.google.com/maps?q=${mapaQuery}&output=embed" loading="lazy" allowfullscreen title="Mapa de ${evento.lugar}"></iframe>
            </div>
          </div>
        </div>

        <aside class="evento-panel-compra glass">
          <div class="evento-panel-info">
            <p class="evento-datos-fecha text-gradiente">${formatFecha(evento.fecha)}${evento.hora ? ' · ' + evento.hora + ' hs' : ''}</p>
            <p class="evento-datos-lugar">${direccion}</p>
          </div>
          <a href="${evento.link}" target="_blank" rel="noopener" class="evento-comprar-btn">Comprar entrada</a>
        </aside>
      </div>`;
  }

  fetch('data/fechas.json')
    .then((r) => r.json())
    .then(async (fechas) => {
      const evento = fechas.find((f) => f.id === id);
      if (!evento) throw new Error('evento no encontrado');

      let descripcion = '';
      if (evento.show) {
        descripcion = await fetch(`data/descripciones/${slug(evento.show)}.txt`)
          .then((r) => (r.ok ? r.text() : ''))
          .catch(() => '');
      }

      const portadaPorDefecto = evento.portada ? null : await buscarPortadaPorDefecto();
      render(evento, descripcion.trim(), portadaPorDefecto);
    })
    .catch(() => {
      wrap.innerHTML = '<p class="loading" style="padding:60px 20px;">No se encontró este evento.</p>';
    });
})();
