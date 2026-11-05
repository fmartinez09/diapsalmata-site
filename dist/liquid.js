(() => {
  const figure = document.querySelector('.liquid-image');
  const image = figure?.querySelector('img');
  const canvas = figure?.querySelector('canvas');
  if (!canvas || !image) return;
  const gl = canvas.getContext('webgl', {alpha: true, premultipliedAlpha: false, antialias: true});
  if (!gl) return;

  // The surface normal refracts the photograph and reflects its surroundings.
  // Dispersion belongs to that optical rim, rather than to a painted outline.
  const vertex = `
    attribute vec2 position;
    varying vec2 uv;
    void main() { uv = position * .5 + .5; gl_Position = vec4(position, 0., 1.); }
  `;
  const fragment = `
    precision highp float;
    varying vec2 uv;
    uniform sampler2D photograph, liquidField;
    uniform vec2 resolution, imageSize, texel;
    uniform float clock;

    vec3 scene(vec2 p) {
      float cover = max(resolution.x / imageSize.x, resolution.y / imageSize.y);
      vec2 size = imageSize * cover;
      vec2 offset = (resolution - size) * vec2(.45, .5);
      return texture2D(photograph, clamp((p - offset) / size, .001, .999)).rgb;
    }
    float heightAt(vec2 p) {
      vec2 encoded = texture2D(liquidField, clamp(p, .001, .999)).rg;
      return (encoded.r * (65280./65535.) + encoded.g * (255./65535.))*2.-1.;
    }
    void main() {
      vec2 st = vec2(uv.x, 1.-uv.y);
      vec2 p = st * resolution;
      vec2 pixel = texel * resolution;
      vec2 slope = vec2(
        (heightAt(st+vec2(texel.x,0.))-heightAt(st-vec2(texel.x,0.)))/(2.*pixel.x),
        (heightAt(st+vec2(0.,texel.y))-heightAt(st-vec2(0.,texel.y)))/(2.*pixel.y));
      // A faint current keeps the whole photograph gently alive between touches.
      slope += .00065*vec2(cos(p.x*.032 + p.y*.019-clock*.35),
                            sin(p.y*.037 - p.x*.014+clock*.27));
      vec3 normal = normalize(vec3(-slope*36., 1.));
      vec2 bend = normal.xy * 31.;
      float dispersion = min(1.8,length(normal.xy)*2.5);
      vec2 refracted = p-bend;
      vec3 colour = vec3(scene(refracted-normal.xy*dispersion).r,
                         scene(refracted).g,
                         scene(refracted+normal.xy*dispersion).b);
      // Reflections grow on wave crests; a calm surface keeps the image clear.
      float fresnel = .32*pow(1.-normal.z,2.);
      vec3 reflected = scene(p+normal.xy*70.);
      colour = mix(colour,reflected*.85,fresnel);
      vec3 light = normalize(vec3(-.5,-.4,.65));
      float highlight = pow(max(dot(normal,light),0.),55.)*.65;
      colour += vec3(.94,.98,1.)*highlight;
      colour *= 1. + clamp((slope.x-slope.y)*1.8,-.045,.045);
      gl_FragColor = vec4(colour,1.);
    }
  `;
  function compile(type, source) {
    const shader = gl.createShader(type);
    gl.shaderSource(shader, source);
    gl.compileShader(shader);
    if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(shader));
    return shader;
  }
  let program;
  try {
    program = gl.createProgram();
    gl.attachShader(program, compile(gl.VERTEX_SHADER, vertex));
    gl.attachShader(program, compile(gl.FRAGMENT_SHADER, fragment));
    gl.linkProgram(program);
    if (!gl.getProgramParameter(program, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(program));
  } catch (error) { console.warn('Liquid surface unavailable', error); return; }
  gl.useProgram(program);
  const buffer = gl.createBuffer();
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1,-1, 1,-1, -1,1, -1,1, 1,-1, 1,1]), gl.STATIC_DRAW);
  const position = gl.getAttribLocation(program, 'position');
  gl.enableVertexAttribArray(position);
  gl.vertexAttribPointer(position, 2, gl.FLOAT, false, 0, 0);
  const uniform = Object.fromEntries(['resolution','imageSize','texel','clock']
    .map(name => [name, gl.getUniformLocation(program, name)]));
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);

  gl.uniform1i(gl.getUniformLocation(program, 'photograph'), 0);
  const fieldTexture = gl.createTexture();
  gl.activeTexture(gl.TEXTURE1);
  gl.bindTexture(gl.TEXTURE_2D, fieldTexture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.uniform1i(gl.getUniformLocation(program, 'liquidField'), 1);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const grid = 128, cells = grid*grid;
  const heights = new Float32Array(cells), velocity = new Float32Array(cells);
  const nextVelocity = new Float32Array(cells), pixels = new Uint8Array(cells*4);
  const impulse = new Float32Array(cells);
  const strokes = [];
  let width = 0, height = 0, frame = 0, previous = 0, accumulator = 0;
  let visible = true, ready = false, lastPointer = null;
  function requestDraw() {
    if (ready && visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const rect = figure.getBoundingClientRect();
    width = rect.width; height = rect.height;
    const ratio = Math.min(devicePixelRatio || 1,2);
    canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
    gl.viewport(0,0,canvas.width,canvas.height);
    lastPointer = null; strokes.length = 0;
    requestDraw();
  }
  function disturb() {
    if (!strokes.length) return;
    impulse.fill(0);
    const radius = Math.min(width,height)*.085;
    for (const stroke of strokes) {
      const sx = stroke.x-stroke.px, sy = stroke.y-stroke.py, length2 = sx*sx+sy*sy;
      const strength = stroke.tap ? .16 : Math.min(.075,Math.sqrt(length2)*.006);
      const minX = Math.max(0,Math.floor((Math.min(stroke.x,stroke.px)-radius)/width*grid));
      const maxX = Math.min(grid-1,Math.ceil((Math.max(stroke.x,stroke.px)+radius)/width*grid));
      const minY = Math.max(0,Math.floor((Math.min(stroke.y,stroke.py)-radius)/height*grid));
      const maxY = Math.min(grid-1,Math.ceil((Math.max(stroke.y,stroke.py)+radius)/height*grid));
      for (let y = minY; y <= maxY; y++) for (let x = minX; x <= maxX; x++) {
        const px = x/grid*width, py = y/grid*height;
        const along = Math.max(0,Math.min(1,((px-stroke.px)*sx+(py-stroke.py)*sy)/(length2||1)));
        const r = Math.hypot(px-stroke.px-sx*along,py-stroke.py-sy*along)/radius;
        // A depression displaces water into a surrounding crest. This radial
        // kernel integrates to zero, so stirring cannot drain the height field.
        if (r < 1) impulse[y*grid+x] -= strength*(1-r*r)**3*(1-5*r*r);
      }
    }
    // Correct the discrete kernel and strokes truncated by the image boundary.
    const meanImpulse = impulse.reduce((sum,value) => sum+value,0)/cells;
    for (let i = 0; i < cells; i++) velocity[i] += impulse[i]-meanImpulse;
    strokes.length = 0;
  }
  // Damped height-field waves: neighbours exchange height and momentum across
  // the full image. A fixed step keeps propagation stable at different frame rates.
  function simulate() {
    for (let y = 0; y < grid; y++) for (let x = 0; x < grid; x++) {
      const i = y*grid+x;
      const left = x ? i-1 : i, right = x < grid-1 ? i+1 : i;
      const up = y ? i-grid : i, down = y < grid-1 ? i+grid : i;
      const lap = heights[left]+heights[right]+heights[up]+heights[down]-4*heights[i];
      const viscosity = velocity[left]+velocity[right]+velocity[up]+velocity[down]-4*velocity[i];
      const edge = Math.min(x,y,grid-1-x,grid-1-y);
      const damping = edge < 8 ? .97+.024*edge/8 : .994;
      nextVelocity[i] = (velocity[i]+lap*.055+viscosity*.025)*damping;
    }
    velocity.set(nextVelocity);
    // Closed basin: remove numerical drift introduced by edge damping. Scale
    // exceptional peaks together instead of clipping individual cells flat.
    let heightSum = 0, velocitySum = 0;
    for (let i = 0; i < cells; i++) {
      heights[i] = (heights[i]+velocity[i])*.9995;
      heightSum += heights[i]; velocitySum += velocity[i];
    }
    const meanHeight = heightSum/cells, meanVelocity = velocitySum/cells;
    let peak = 0;
    for (let i = 0; i < cells; i++) {
      heights[i] -= meanHeight; velocity[i] -= meanVelocity;
      peak = Math.max(peak,Math.abs(heights[i]));
    }
    if (peak > .9) {
      const scale = .9/peak;
      for (let i = 0; i < cells; i++) { heights[i] *= scale; velocity[i] *= scale; }
    }
  }
  function draw(now) {
    frame = 0;
    accumulator += Math.min(previous ? (now-previous)/1000 : 0, .05);
    previous = now;
    if (reduced.matches) {
      heights.fill(0); velocity.fill(0); strokes.length = 0; accumulator = 0;
    } else {
      disturb();
      while (accumulator >= 1/120) { simulate(); accumulator -= 1/120; }
    }
    for (let i = 0; i < cells; i++) {
      const encoded = Math.round((heights[i]*.5+.5)*65535);
      pixels[i*4] = encoded >> 8; pixels[i*4+1] = encoded & 255;
      pixels[i*4+2] = 0; pixels[i*4+3] = 255;
    }
    gl.activeTexture(gl.TEXTURE1);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,grid,grid,0,gl.RGBA,gl.UNSIGNED_BYTE,pixels);
    gl.uniform2f(uniform.resolution,width,height);
    gl.uniform2f(uniform.imageSize,image.naturalWidth,image.naturalHeight);
    gl.uniform2f(uniform.texel,1/grid,1/grid);
    gl.uniform1f(uniform.clock,reduced.matches ? 0 : now/1000);
    gl.drawArrays(gl.TRIANGLES,0,6);
    if (!reduced.matches) requestDraw();
  }
  function point(event) {
    const rect = figure.getBoundingClientRect();
    return {x:event.clientX-rect.left,y:event.clientY-rect.top};
  }
  function move(event) {
    const current = point(event);
    if (lastPointer && !reduced.matches) {
      strokes.push({...current,px:lastPointer.x,py:lastPointer.y});
      if (strokes.length > 16) strokes.shift();
    }
    lastPointer = current;
    requestDraw();
  }
  figure.addEventListener('pointermove',move);
  figure.addEventListener('pointerenter',event => { lastPointer = point(event); });
  figure.addEventListener('pointerleave',() => { lastPointer = null; });
  figure.addEventListener('pointerdown',event => {
    const p = point(event); lastPointer = p;
    if (!reduced.matches) strokes.push({...p,px:p.x,py:p.y,tap:true});
    requestDraw();
  });
  window.addEventListener('resize',resize);
  reduced.addEventListener('change',requestDraw);
  document.addEventListener('visibilitychange',() => { previous = 0; requestDraw(); });
  canvas.addEventListener('webglcontextlost', event => {
    event.preventDefault(); ready = false; cancelAnimationFrame(frame); frame = 0;
  });
  canvas.addEventListener('webglcontextrestored', () => { canvas.hidden = true; });
  if ('IntersectionObserver' in window) new IntersectionObserver(entries => {
    visible = entries[0].isIntersecting;
    if (visible) { previous = 0; requestDraw(); }
    else { cancelAnimationFrame(frame); frame = 0; }
  }).observe(figure);
  function start() {
    if (!image.naturalWidth) return;
    gl.activeTexture(gl.TEXTURE0);
    try { gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image); }
    catch { return; } // Preserve the original photograph if textures are unavailable.
    ready = true; resize();
  }
  if (image.complete) start(); else image.addEventListener('load', start, {once:true});
})();
