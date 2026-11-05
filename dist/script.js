(() => {
  function openSection() {
    const id = location.hash.slice(1);
    if (!['notes', 'research', 'projects'].includes(id)) return;
    const section = document.getElementById(id);
    if (section) section.open = true;
  }
  window.addEventListener('hashchange', openSection);
  document.querySelectorAll('nav a').forEach(link => link.addEventListener('click', () => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section instanceof HTMLDetailsElement) section.open = true;
  }));
  openSection();

  const jewel = document.querySelector('.jewel');
  if (!jewel) return;
  const load = () => import('./jewel.js').then(module => module.mountJewel(jewel)).catch(error => {
    console.warn('La pieza 3D no está disponible.', error);
    jewel.classList.add('is-fallback');
  });
  if ('IntersectionObserver' in window) {
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); load(); }
    }, {rootMargin: '300px'});
    observer.observe(jewel);
  } else load();
})();
