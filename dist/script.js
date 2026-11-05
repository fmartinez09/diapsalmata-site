(() => {
  const stage = document.querySelector('#object-stage');
  const sculpture = document.querySelector('#sculpture');
  const reset = document.querySelector('#reset-view');
  if (!stage || !sculpture || !reset) return;

  const initial = { x: -12, y: -25 };
  let angleX = initial.x;
  let angleY = initial.y;
  let pointer = null;

  function render() {
    sculpture.style.transform = `rotateX(${angleX}deg) rotateY(${angleY}deg) rotateZ(-4deg)`;
  }

  stage.addEventListener('pointerdown', event => {
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    pointer = { id: event.pointerId, x: event.clientX, y: event.clientY };
    stage.setPointerCapture(event.pointerId);
    stage.classList.add('dragging');
  });
  stage.addEventListener('pointermove', event => {
    if (!pointer || pointer.id !== event.pointerId) return;
    angleY += (event.clientX - pointer.x) * 0.45;
    angleX = Math.max(-70, Math.min(70, angleX - (event.clientY - pointer.y) * 0.45));
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    render();
  });
  function endDrag(event) {
    if (!pointer || pointer.id !== event.pointerId) return;
    pointer = null;
    stage.classList.remove('dragging');
  }
  stage.addEventListener('pointerup', endDrag);
  stage.addEventListener('pointercancel', endDrag);
  stage.addEventListener('lostpointercapture', endDrag);
  stage.addEventListener('keydown', event => {
    const steps = { ArrowLeft: [0, -8], ArrowRight: [0, 8], ArrowUp: [-8, 0], ArrowDown: [8, 0] };
    if (!(event.key in steps)) return;
    event.preventDefault();
    angleX = Math.max(-70, Math.min(70, angleX + steps[event.key][0]));
    angleY += steps[event.key][1];
    render();
  });
  reset.addEventListener('click', () => {
    angleX = initial.x;
    angleY = initial.y;
    render();
  });
})();
