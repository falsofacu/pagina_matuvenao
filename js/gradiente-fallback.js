// Si no existe img/gradiente.webp, los textos con la clase .text-gradiente
// caen en blanco sólido en vez de quedar invisibles (color transparente).
(function () {
  const img = new Image();
  img.onerror = () => {
    document.documentElement.classList.add('sin-gradiente');
  };
  img.src = 'img/gradiente.webp';
})();
