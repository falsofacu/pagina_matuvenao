// Fechas: se editan en data/fechas.json, esta pagina se actualiza sola
// y se agrupan automáticamente por mes.
(function () {
  const wrap = document.getElementById('fechasList');

  const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
  const MESES_LARGO = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre',
  ];
  const BANDERAS = {
    UY: `<svg class="bandera" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#fff"/>
      <rect y="2.2" width="30" height="2.2" fill="#0038a8"/>
      <rect y="6.6" width="30" height="2.2" fill="#0038a8"/>
      <rect y="11" width="30" height="2.2" fill="#0038a8"/>
      <rect y="15.4" width="30" height="2.2" fill="#0038a8"/>
      <rect width="11" height="11" fill="#fff"/>
      <circle cx="5.5" cy="5.5" r="3" fill="#fcd116"/>
    </svg>`,
    AR: `<svg class="bandera" viewBox="0 0 30 20" xmlns="http://www.w3.org/2000/svg">
      <rect width="30" height="20" fill="#fff"/>
      <rect width="30" height="6.66" fill="#75aadb"/>
      <rect y="13.33" width="30" height="6.67" fill="#75aadb"/>
      <circle cx="15" cy="10" r="2.6" fill="#fcbf49"/>
    </svg>`,
  };

  // Convierte un emoji de bandera (ej: 🇺🇾) a su código de país (ej: "UY"),
  // así en el JSON se puede escribir el emoji o el código, da igual.
  function emojiACodigoPais(str) {
    if (!str) return str;
    const puntos = Array.from(str);
    if (puntos.length === 2) {
      const letras = puntos.map((p) => {
        const codigo = p.codePointAt(0) - 0x1f1e6;
        if (codigo < 0 || codigo > 25) return null;
        return String.fromCharCode(65 + codigo);
      });
      if (letras[0] && letras[1]) return letras.join('');
    }
    return str.toUpperCase();
  }

  function formatFecha(iso) {
    const [, m, d] = iso.split('-').map(Number);
    return `${d} ${MESES[m - 1]}`;
  }

  function claveMes(iso) {
    const [y, m] = iso.split('-');
    return `${y}-${m}`;
  }

  function tituloMes(iso) {
    const [y, m] = iso.split('-').map(Number);
    return `${MESES_LARGO[m - 1]} ${y}`;
  }

  Promise.all([
    fetch('data/fechas.json').then((r) => r.json()),
    fetch('data/config.json').then((r) => r.json()).catch(() => ({})),
  ])
    .then(([fechas, config]) => {
      // Mientras config.json tenga sendsToLandingPage:true, el botón Tickets
      // manda a la landing (evento.html) en vez de a la tiquetera real,
      // para poder testearla. Se apaga poniendo ese valor en false.
      const usarLanding = config.sendsToLandingPage === true;
      const hoy = new Date().toISOString().slice(0, 10);
      const proximas = fechas
        .filter((f) => f.fecha >= hoy)
        .sort((a, b) => a.fecha.localeCompare(b.fecha));

      if (!proximas.length) {
        wrap.innerHTML = '<p class="loading">No hay fechas próximas por el momento.</p>';
        return;
      }

      const grupos = [];
      let grupoActual = null;

      proximas.forEach((f) => {
        const clave = claveMes(f.fecha);
        if (!grupoActual || grupoActual.clave !== clave) {
          grupoActual = { clave, titulo: tituloMes(f.fecha), items: [] };
          grupos.push(grupoActual);
        }
        grupoActual.items.push(f);
      });

      wrap.innerHTML = grupos
        .map(
          (grupo) => `
        <div class="fechas-mes glass">
          <h3 class="fechas-mes-titulo text-gradiente">${grupo.titulo}</h3>
          <div class="fechas-mes-lista">
            ${grupo.items
              .map((f) => {
                // Shows "Ranga XL": barra destacada con la estética del degradé.
                const esXL = /\bXL\b/i.test(`${f.show || ''} ${f.titulo || ''}`);
                return `
              <div class="fecha-item${esXL ? ' fecha-item--xl' : ''}">
                <div class="fecha-fecha text-gradiente">${formatFecha(f.fecha)}${f.hora ? ' · ' + f.hora : ''}</div>
                <div class="fecha-divider"></div>
                <div class="fecha-info">
                  <div class="fecha-ciudad">${BANDERAS[emojiACodigoPais(f.pais)] || ''} <span>${f.ciudad}</span></div>
                  <div class="fecha-lugar">${f.lugar || ''}</div>
                </div>
                <div class="fecha-divider"></div>
                <div class="fecha-show">${f.show || ''}</div>
                <div class="fecha-divider"></div>
                ${f.link ? `<a class="btn-outline text-gradiente" href="${usarLanding ? 'evento?id=' + f.id : f.link}" target="_blank">Tickets</a>` : ''}
              </div>`;
              })
              .join('')}
          </div>
        </div>`
        )
        .join('');
    })
    .catch(() => {
      wrap.innerHTML = '<p class="loading">No se pudieron cargar las fechas.</p>';
    });
})();
