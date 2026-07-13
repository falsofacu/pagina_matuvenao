// Cinta de texto horizontal debajo de la portada. Se edita en data/marquee.json.
(function () {
  const track = document.getElementById('marqueeTrack');

  fetch('data/marquee.json')
    .then((r) => r.json())
    .then((data) => {
      const items = data.items || [];
      if (!items.length) return;
      const sep = data.separador || '•';
      const texto = items.join(` ${sep} `) + ` ${sep} `;
      // duplicamos el contenido para que el loop sea continuo
      track.innerHTML = `<span>${texto}</span><span>${texto}</span>`;

      // La animación se activa recién ahora que el texto real ya está
      // insertado, para que su "reloj" no arranque contra un ancho vacío
      // (eso hacía que en celular apareciera estático y después desapareciera).
      requestAnimationFrame(() => track.classList.add('listo'));
    })
    .catch(() => {});
})();
