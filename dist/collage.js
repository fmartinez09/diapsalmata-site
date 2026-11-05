(() => {
  const collage = document.querySelector('.hero-collage');
  if (!collage) return;
  // Wait for the actual photographs, so every reveal shows a complete print.
  Promise.all([...collage.querySelectorAll('img')].map(img =>
    img.decode().catch(() => {})
  )).then(() => {
    requestAnimationFrame(() => collage.classList.add('collage-ready'));
  });
})();
