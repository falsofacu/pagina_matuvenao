// Biografia: se edita en data/bio.json, no hace falta tocar el HTML.
(function () {
  const wrap = document.getElementById('bioContent');

  fetch('data/bio.json')
    .then((r) => r.json())
    .then((bio) => {
      const parrafos = (bio.texto || []).map((p) => `<p>${p}</p>`).join('');
      wrap.innerHTML = `
        ${bio.foto ? `<img src="${bio.foto}" alt="${bio.nombre || 'Foto'}" onerror="this.remove()">` : ''}
        <div class="bio-text">${parrafos}</div>
      `;
    })
    .catch(() => {
      wrap.innerHTML = '<p class="loading">No se pudo cargar la biografía.</p>';
    });
})();
