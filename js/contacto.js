// Contacto y redes: se editan en data/config.json.
(function () {
  const emailBtn = document.getElementById('contactoEmail');
  const telefonoEl = document.getElementById('contactoTelefono');
  const redesWrap = document.getElementById('redesList');

  const NOMBRES = {
    facebook: 'Facebook',
    instagram: 'Instagram',
    youtube: 'YouTube',
    tiktok: 'TikTok',
  };

  fetch('data/config.json')
    .then((r) => r.json())
    .then((cfg) => {
      const email = cfg.contacto?.email;
      if (email) {
        emailBtn.href = `mailto:${email}`;
        emailBtn.textContent = email;
      }

      const telefono = cfg.contacto?.telefono;
      if (telefono) {
        const soloNumeros = telefono.replace(/[^\d+]/g, '');
        telefonoEl.innerHTML = `<a href="https://wa.me/${soloNumeros.replace('+', '')}" target="_blank">${telefono}</a>`;
      }

      const redes = cfg.redes || {};
      redesWrap.innerHTML = Object.entries(redes)
        .filter(([, url]) => url && url !== '#')
        .map(([key, url]) => `<a href="${url}" target="_blank">${NOMBRES[key] || key}</a>`)
        .join('');
    })
    .catch(() => {});
})();
