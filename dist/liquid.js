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
    uniform vec2 resolution, centre, imageSize;

    vec3 scene(vec2 p) {
      float cover = max(resolution.x / imageSize.x, resolution.y / imageSize.y);
      vec2 size = imageSize * cover;
      vec2 offset = (resolution - size) * vec2(.45, .5);
      return texture2D(photograph, clamp((p - offset) / size, .001, .999)).rgb;
    }
    float densityAt(vec2 p) {
      return texture2D(liquidField, clamp(p/resolution, .001, .999)).r;
    }
    float heightAt(vec2 p) {
      return sqrt(max(.0001, densityAt(p)-.105));
    }
    void main() {
      vec2 p = vec2(uv.x, 1.-uv.y) * resolution;
      float radius = min(resolution.x, resolution.y) * .15;
      float density = densityAt(p);
      if (density < .095) { gl_FragColor = vec4(0.); return; }
      float e = 1.8;
      vec2 slope = vec2(heightAt(p+vec2(e,0.))-heightAt(p-vec2(e,0.)),
                        heightAt(p+vec2(0.,e))-heightAt(p-vec2(0.,e))) * radius / (2.*e);
      vec3 normal = normalize(vec3(-slope*1.6, 1.));
      float thickness = heightAt(p);
      // A rounded meniscus folds and compresses the picture near the perimeter.
      float rim = 1.-smoothstep(.105,.34,density);
      vec2 bend = normal.xy * radius * (.47 + .32*rim);
      vec2 refracted = p - bend;
      float dispersion = pow(rim, 2.) * radius * .04;
      vec3 transmitted = vec3(scene(refracted-normal.xy*dispersion).r,
                              scene(refracted).g,
                              scene(refracted+normal.xy*dispersion).b);
      vec2 reflectedAt = centre + normal.xy * radius * 1.65;
      vec3 reflected = scene(reflectedAt);
      // High-contrast reflections and small white light sources give the rim volume.
      reflected = pow(reflected, vec3(1.3)) * .75;
      float fresnel = .025 + .82*pow(1.-normal.z, 2.2);
      vec3 colour = mix(transmitted, reflected, fresnel);
      vec3 lightA = normalize(vec3(-.67,-.55,.48));
      vec3 lightB = normalize(vec3(.72,.55,.25));
      float glint = pow(max(dot(normal,lightA),0.), 28.)*1.8
                  + pow(max(dot(normal,lightB),0.), 42.)*1.35;
      float edgeLight = exp(-pow((density-.117)/.014,2.))
                      * (.12 + .65*pow(max(dot(normal.xy,normalize(vec2(-.8,-.5))),0.),5.));
      colour += vec3(.96,.98,1.) * (glint + edgeLight);
      colour += vec3(.015,.025,.025)*thickness;
      gl_FragColor = vec4(colour, smoothstep(.095,.12,density));
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
  const uniform = Object.fromEntries(['resolution','centre','imageSize']
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
  const grid = 256, field = new Float32Array(grid*grid), pixels = new Uint8Array(grid*grid);
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const particles = [], strokes = [];
  let width = 0, height = 0, support = 0;
  let frame = 0, previous = 0, visible = true, ready = false, lastPointer = null;
  function requestDraw() {
    if (ready && visible && !document.hidden && !frame) frame = requestAnimationFrame(draw);
  }
  function resize() {
    const rect = figure.getBoundingClientRect();
    const oldWidth = width, oldHeight = height;
    width = rect.width; height = rect.height;
    support = Math.min(width,height)*.065;
    const ratio = Math.min(devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*ratio); canvas.height = Math.round(height*ratio);
    gl.viewport(0, 0, canvas.width, canvas.height);
    if (!particles.length) {
      const spacing = support*.36, radius = Math.min(width,height)*.13;
      for (let row = -7; row <= 7; row++) for (let col = -7; col <= 7; col++) {
        const px = (col+(row%2)*.5)*spacing, py = row*spacing*.866;
        if (px*px+py*py > radius*radius) continue;
        particles.push({x:width*.52+px, y:height*.49+py, vx:0, vy:0});
      }
    } else if (oldWidth && oldHeight) {
      particles.forEach(p => { p.x *= width/oldWidth; p.y *= height/oldHeight; p.vx = p.vy = 0; });
    }
    lastPointer = null; strokes.length = 0;
    requestDraw();
  }
  // Double-density relaxation: local density resists compression, while negative
  // pressure keeps the free surface cohesive. There is no target for the mass.
  function simulate(dt) {
    const h = support, h2 = h*h;
    const before = particles.map(p => [p.x,p.y]);
    for (const p of particles) {
      p.vx *= Math.pow(.93,dt); p.vy *= Math.pow(.93,dt);
      p.x += p.vx*dt; p.y += p.vy*dt;
    }
    for (const stroke of strokes) {
      const sx = stroke.x-stroke.px, sy = stroke.y-stroke.py;
      const length2 = sx*sx+sy*sy;
      for (const p of particles) {
        const along = Math.max(0,Math.min(1,((p.x-stroke.px)*sx+(p.y-stroke.py)*sy)/(length2||1)));
        const distance = Math.hypot(p.x-stroke.px-sx*along,p.y-stroke.py-sy*along);
        const influence = Math.pow(Math.max(0,1-distance/(h*1.8)),2);
        const limit = Math.min(1,h*.65/Math.max(1,Math.hypot(sx,sy)));
        p.x += sx*limit*influence*.8; p.y += sy*limit*influence*.8;
      }
    }
    strokes.length = 0;
    for (let iteration = 0; iteration < 3; iteration++) {
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i], neighbours = [];
        let density = 0, nearDensity = 0;
        for (let j = 0; j < particles.length; j++) {
          if (i === j) continue;
          const n = particles[j], dx = n.x-p.x, dy = n.y-p.y, r2 = dx*dx+dy*dy;
          if (r2 >= h2 || r2 < .00001) continue;
          const r = Math.sqrt(r2), q = 1-r/h;
          density += q*q; nearDensity += q*q*q;
          neighbours.push([n,dx/r,dy/r,q]);
        }
        const pressure = .32*(density-3.2), nearPressure = .55*nearDensity;
        for (const [n,nx,ny,q] of neighbours) {
          const displacement = Math.max(-.18,Math.min(.5,(pressure*q+nearPressure*q*q)*dt*dt))*.5;
          n.x += nx*displacement; n.y += ny*displacement;
          p.x -= nx*displacement; p.y -= ny*displacement;
        }
      }
    }
    particles.forEach((p,i) => {
      const margin = support*.6;
      p.x = Math.max(margin,Math.min(width-margin,p.x));
      p.y = Math.max(margin,Math.min(height-margin,p.y));
      p.vx = (p.x-before[i][0])/dt;
      p.vy = (p.y-before[i][1])/dt;
    });
    // Viscosity exchanges momentum between neighbours instead of bouncing.
    for (let i = 0; i < particles.length; i++) for (let j = i+1; j < particles.length; j++) {
      const a = particles[i], b = particles[j];
      const q = Math.max(0,1-Math.hypot(a.x-b.x,a.y-b.y)/support)*.12;
      const dx = (b.vx-a.vx)*q, dy = (b.vy-a.vy)*q;
      a.vx += dx; a.vy += dy; b.vx -= dx; b.vy -= dy;
    }
  }
  function draw(now) {
    frame = 0;
    const dt = Math.min((now-previous)/16.667 || 1, 1.5);
    previous = now;
    if (!reduced.matches) simulate(dt);
    else { strokes.length = 0; particles.forEach(p => { p.vx = p.vy = 0; }); }
    field.fill(0);
    let cx = 0, cy = 0;
    for (const p of particles) {
      cx += p.x; cy += p.y;
      const gx = p.x/width*grid, gy = p.y/height*grid;
      const rx = support/width*grid, ry = support/height*grid;
      for (let y = Math.max(0,Math.floor(gy-ry)); y <= Math.min(grid-1,Math.ceil(gy+ry)); y++) {
        for (let x = Math.max(0,Math.floor(gx-rx)); x <= Math.min(grid-1,Math.ceil(gx+rx)); x++) {
          const q = 1-((x-gx)/rx)**2-((y-gy)/ry)**2;
          if (q > 0) field[y*grid+x] += q*q*q;
        }
      }
    }
    for (let i = 0; i < field.length; i++) pixels[i] = Math.min(255,Math.round(field[i]*255/10));
    gl.activeTexture(gl.TEXTURE1);
    gl.texImage2D(gl.TEXTURE_2D,0,gl.LUMINANCE,grid,grid,0,gl.LUMINANCE,gl.UNSIGNED_BYTE,pixels);
    gl.uniform2f(uniform.resolution,width,height);
    gl.uniform2f(uniform.centre,cx/particles.length,cy/particles.length);
    gl.uniform2f(uniform.imageSize,image.naturalWidth,image.naturalHeight);
    gl.drawArrays(gl.TRIANGLES,0,6);
    if (!reduced.matches) requestDraw();
  }
  function move(event) {
    const rect = figure.getBoundingClientRect();
    const point = {x:event.clientX-rect.left,y:event.clientY-rect.top};
    if (lastPointer && !reduced.matches) {
      strokes.push({...point,px:lastPointer.x,py:lastPointer.y});
      if (strokes.length > 24) strokes.shift();
    }
    lastPointer = point;
    requestDraw();
  }
  figure.addEventListener('pointermove',move);
  figure.addEventListener('pointerenter',event => { lastPointer = null; move(event); });
  figure.addEventListener('pointerleave',() => { lastPointer = null; });
  figure.addEventListener('pointerdown',event => { lastPointer = null; move(event); });
  window.addEventListener('resize',resize);
  reduced.addEventListener('change',requestDraw);
  document.addEventListener('visibilitychange',requestDraw);
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
