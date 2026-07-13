// Menú móvil, año del footer, animaciones de aparición al scrollear y
// resaltado de la sección activa en el navbar.
(function () {
  const toggle = document.getElementById('navToggle');
  const links = document.getElementById('navLinks');

  toggle.addEventListener('click', () => links.classList.toggle('open'));
  links.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => links.classList.remove('open'))
  );

  document.getElementById('anioActual').textContent = new Date().getFullYear();

  // --- Aparición suave de las secciones al entrar en pantalla ---
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const secciones = document.querySelectorAll('.section');

  if (!reduceMotion && 'IntersectionObserver' in window) {
    secciones.forEach((s) => s.classList.add('reveal'));
    const revelador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (entrada.isIntersecting) {
            entrada.target.classList.add('visible');
            revelador.unobserve(entrada.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    secciones.forEach((s) => revelador.observe(s));
  }

  // --- Resaltado del link del navbar según la sección visible ---
  const navLinks = [...links.querySelectorAll('a[href^="#"]')];
  const porId = {};
  navLinks.forEach((a) => { porId[a.getAttribute('href').slice(1)] = a; });

  if ('IntersectionObserver' in window && navLinks.length) {
    const activador = new IntersectionObserver(
      (entradas) => {
        entradas.forEach((entrada) => {
          if (!entrada.isIntersecting) return;
          navLinks.forEach((a) => a.classList.remove('activo'));
          const link = porId[entrada.target.id];
          if (link) link.classList.add('activo');
        });
      },
      { rootMargin: '-40% 0px -55% 0px' }
    );
    Object.keys(porId).forEach((id) => {
      const seccion = document.getElementById(id);
      if (seccion) activador.observe(seccion);
    });
  }
})();
