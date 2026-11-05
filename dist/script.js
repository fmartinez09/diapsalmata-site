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
  const plant = document.querySelector('.botanical');
  if (!plant) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const parts = [...plant.querySelectorAll('[data-start]')].map(element => ({
    element, start: Number(element.dataset.start), end: Number(element.dataset.end),
    stem: element.classList.contains('stem')
  }));
  let frame = 0;
  let started = null;
  let complete = false;
  let observer;
  function draw(progress) {
    parts.forEach(({element, start, end, stem}) => {
      const p = Math.max(0, Math.min(1, (progress - start) / (end - start)));
      const eased = p * p * (3 - 2 * p);
      if (stem) element.style.strokeDashoffset = String(1 - eased);
      else element.style.transform = `scale(${eased})`;
    });
  }
  function finish() {
    cancelAnimationFrame(frame);
    complete = true;
    draw(1);
    observer?.disconnect();
    plant.removeAttribute('data-growing');
  }
  function grow(now) {
    if (reduced.matches) return finish();
    if (started === null) started = now;
    const progress = Math.min(1, (now - started) / 3400);
    draw(progress);
    if (progress < 1) frame = requestAnimationFrame(grow);
    else finish();
  }
  // Full foliage is the fallback without JS, observers or animation support.
  if (reduced.matches || !('IntersectionObserver' in window)) return;
  plant.setAttribute('data-growing', '');
  draw(0);
  observer = new IntersectionObserver(entries => {
    if (entries.some(entry => entry.isIntersecting) && started === null && !frame) {
      frame = requestAnimationFrame(grow);
      observer.disconnect();
    }
  }, { threshold: 0.2 });
  observer.observe(plant);
  reduced.addEventListener('change', () => {
    if (reduced.matches && !complete) finish();
  });
})();
