(() => {
  document.querySelectorAll('[data-current-year]').forEach(element => {
    element.textContent = new Date().getFullYear();
  });
  function openSection() {
    const id = location.hash.slice(1);
    if (!['notes', 'research', 'projects'].includes(id)) return;
    const section = document.getElementById(id);
    if (section) section.open = true;
  }
  window.addEventListener('hashchange', openSection);
  document.querySelectorAll('nav a[href^="#"]').forEach(link => link.addEventListener('click', () => {
    const section = document.querySelector(link.getAttribute('href'));
    if (section instanceof HTMLDetailsElement) section.open = true;
  }));
  openSection();
  const plant = document.querySelector('.botanical');
  const heading = document.querySelector('.archive-heading h2');
  if (!plant || !heading) return;
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)');
  const parts = [...plant.querySelectorAll('[data-start]')].map(element => ({
    element, start: Number(element.dataset.start), end: Number(element.dataset.end),
    stem: element.classList.contains('stem')
  }));
  let frame = 0;
  let started = null;
  let complete = false;
  let revealed = false;
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
  // CSS hides the whole illustration before JS runs, preventing an initial flash.
  plant.setAttribute('data-growing', '');
  draw(0);
  function reveal() {
    if (revealed) return;
    revealed = true;
    plant.setAttribute('data-revealed', '');
    observer?.disconnect();
    window.removeEventListener('scroll', checkHeading);
    window.removeEventListener('resize', checkHeading);
    if (reduced.matches) finish();
    else frame = requestAnimationFrame(grow);
  }
  function checkHeading() {
    const rect = heading.getBoundingClientRect();
    if (rect.bottom > 0 && rect.top < innerHeight * .88) reveal();
  }
  if ('IntersectionObserver' in window) {
    // Observe the title, not the artwork: no preloading margin or early entrance.
    observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) reveal();
    }, { threshold: 1, rootMargin: '0px 0px -12% 0px' });
    observer.observe(heading);
  } else {
    window.addEventListener('scroll', checkHeading, {passive:true});
    window.addEventListener('resize', checkHeading);
    checkHeading();
  }
  reduced.addEventListener('change', () => {
    if (reduced.matches && revealed && !complete) finish();
  });
})();
