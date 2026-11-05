import * as THREE from './vendor/three.module.min.js';

// A hand-modelled study of the supplied brooch, in real geometry.
// All dimensions are local to this model; no network assets or HDRI are needed.
export function mountJewel(host) {
  const stage = host.querySelector('.jewel-stage');
  const reset = host.querySelector('.jewel-reset');
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const renderer = new THREE.WebGLRenderer({alpha:true, antialias:true, powerPreference:'low-power'});
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.12;
  const canvas = renderer.domElement;
  canvas.tabIndex = 0;
  canvas.setAttribute('role', 'img');
  canvas.setAttribute('aria-label', 'Broche floral 3D. Usa las flechas para girarlo y la tecla Inicio para restablecer.');
  canvas.setAttribute('aria-describedby', 'jewel-help');
  stage.append(canvas);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 1, .1, 80);
  camera.position.set(0, 0, 16);
  const model = new THREE.Group();
  scene.add(model);

  // Large reflected light panels make the enamel and gold legible on cream.
  const studio = new THREE.Scene();
  studio.background = new THREE.Color('#43474b');
  const panelGeometry = new THREE.PlaneGeometry(1, 1);
  const panels = [];
  function panel(x, y, z, w, h, color, intensity) {
    const material = new THREE.MeshBasicMaterial({color:new THREE.Color(color).multiplyScalar(intensity), side:THREE.DoubleSide});
    const mesh = new THREE.Mesh(panelGeometry, material);
    mesh.position.set(x,y,z); mesh.scale.set(w,h,1); mesh.lookAt(0,0,0);
    studio.add(mesh); panels.push(material);
  }
  panel(-4,5,4, 3,7, '#fff7df', 5);
  panel(5,1,3, 1.5,6, '#e1eeff', 4);
  panel(0,6,-3, 7,2, '#ffffff', 6);
  panel(-2,-4,3, 5,1, '#d5b979', 1.4);
  const pmrem = new THREE.PMREMGenerator(renderer);
  const env = pmrem.fromScene(studio, .025);
  scene.environment = env.texture;
  pmrem.dispose(); panelGeometry.dispose(); panels.forEach(material => material.dispose());
  scene.add(new THREE.HemisphereLight(0xf4f5ff, 0x4a3d24, 1.6));
  const key = new THREE.DirectionalLight(0xfff5df, 3.4); key.position.set(-3,5,7); scene.add(key);
  const rim = new THREE.DirectionalLight(0xcadfff, 2); rim.position.set(4,-1,4); scene.add(rim);

  const gold = new THREE.MeshStandardMaterial({color:0xc9a64d, metalness:1, roughness:.22});
  const enamel = new THREE.MeshPhysicalMaterial({color:0x103d30, metalness:.38, roughness:.2, clearcoat:1, clearcoatRoughness:.08});
  const pearl = new THREE.MeshPhysicalMaterial({color:0xe0e3d9, metalness:.12, roughness:.22, clearcoat:1, clearcoatRoughness:.13, iridescence:.28, iridescenceIOR:1.3, iridescenceThicknessRange:[180,330], side:THREE.DoubleSide});
  const diamond = new THREE.MeshPhysicalMaterial({color:0xf2f1e7, metalness:.62, roughness:.07, clearcoat:1, iridescence:.12, flatShading:true});
  const darkGold = new THREE.MeshStandardMaterial({color:0x948044, metalness:1, roughness:.3});
  const V = (p) => new THREE.Vector3(p[0], p[1], p[2] || 0);
  function tube(points, radius, material, parent=model) {
    const curve = new THREE.CatmullRomCurve3(points.map(V));
    const mesh = new THREE.Mesh(new THREE.TubeGeometry(curve, Math.max(24,points.length*12), radius, 8, false), material);
    parent.add(mesh); return curve;
  }
  function stem(points, width=.065) {
    const curve = tube(points, width, enamel);
    for (const sign of [-1,1]) {
      const rail = [];
      for(let i=0;i<=48;i++) {
        const t=i/48, p=curve.getPoint(t), d=curve.getTangent(t);
        const n=new THREE.Vector3(-d.y,d.x,0).normalize().multiplyScalar(width*.79*sign);
        rail.push([p.x+n.x,p.y+n.y,p.z+width*.55]);
      }
      tube(rail, .011, gold);
    }
    return curve;
  }

  // Interlaced, asymmetric enamel ribbons with two fine gold edges.
  stem([[-3.15,.26,-.12],[-2.92,.02,0],[-2.62,.16,.03],[-2.69,.43,.02],[-3.12,.5,0],[-3.22,.25,0],[-2.77,.63,-.06],[-2.05,.4,0],[-1.83,-.15,.12],[-2.15,-1,.03],[-1.72,-1.29,0],[-.95,-1.23,.05]],.078);
  stem([[-.95,-1.23,.05],[-.65,-1.02,.08],[-.93,-.87,.1],[-1.14,-1.12,.12],[-.72,-1.4,0],[.05,-1.48,-.08],[.8,-1.33,.03],[1.41,-.62,-.02],[1.76,.03,-.04],[2.51,.12,.02],[3.04,-.15,0],[2.97,-.45,.02],[2.49,-.64,.04]],.065);
  stem([[-2.97,.42,-.12],[-1.92,.83,-.16],[-.94,1.13,-.19],[.12,1.08,-.15],[.88,.48,-.02],[1.28,-.5,.02],[.98,-1.27,.1],[1.33,-1.38,.04],[2.13,-.86,-.04],[2.49,-.3,.12],[2.27,-.08,.1],[2.07,-.27,.09],[2.18,-.69,.07]],.054);
  stem([[-2.27,-.36,.18],[-1.41,-.3,.18],[-.51,-.29,.23],[.37,-.51,.26],[.91,-.94,.22],[1.04,-1.34,.15]],.038);
  stem([[.78,-1.4,-.05],[.74,-.91,-.08],[.32,-.35,-.12],[-.14,.46,-.04]],.035);
  stem([[-.63,-1.35,-.07],[-.48,-.92,0],[-.34,-.05,-.02],[.74,.93,-.13]],.036);
  stem([[2.5,-.64,-.03],[3.08,-.38,0],[3.32,-.23,0],[3.37,-.91,0],[3.22,-1.04,0],[3.1,-.73,0],[3.17,-.37,0]],.052);

  // A closed, cupped petal: two curved surfaces stitched at the rim.
  function petalGeometry(length, width, curl=.22, cup=.15) {
    const positions=[], indices=[], rows=25, cols=16;
    for(let side=0;side<2;side++) for(let i=0;i<=rows;i++) for(let j=0;j<=cols;j++) {
      const t=i/rows, s=j/cols*2-1;
      const w=Math.pow(Math.sin(Math.PI*t),.68)*width*(.58+.42*t);
      const ruffle=.022*Math.sin(t*17+s*5)*Math.sin(Math.PI*t);
      positions.push(s*w, t*length, .045+curl*t*t+cup*s*s*Math.sin(Math.PI*t)+ruffle+(side===0?1:-1)*.024*Math.sin(Math.PI*t));
    }
    const count=(rows+1)*(cols+1);
    for(let side=0;side<2;side++) for(let i=0;i<rows;i++) for(let j=0;j<cols;j++) {
      const a=side*count+i*(cols+1)+j,b=a+cols+1;
      if(!side) indices.push(a,a+1,b,b,a+1,b+1); else indices.push(a,b,a+1,b,b+1,a+1);
    }
    for(let i=0;i<rows;i++) for(const j of [0,cols]) {
      const a=i*(cols+1)+j,b=a+cols+1;
      indices.push(a,b,a+count,b,b+count,a+count);
    }
    const geo=new THREE.BufferGeometry();
    geo.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geo.setIndex(indices); geo.computeVertexNormals(); return geo;
  }
  const flowers=[];
  function flower(x,y,z,size,angle) {
    const group=new THREE.Group(); group.position.set(x,y,z); group.rotation.z=angle; model.add(group);
    const bloom=new THREE.Group(); group.add(bloom); flowers.push(bloom);
    for(let i=0;i<5;i++) {
      const petal=new THREE.Mesh(petalGeometry(size*(.94+.07*Math.sin(i*3)),size*.37,.22),pearl);
      petal.rotation.z=i*Math.PI*2/5; petal.rotation.x=.08*Math.sin(i*2); bloom.add(petal);
      const a=i*Math.PI*2/5+.4;
      tube([[0,0,0],[Math.sin(a)*size*.28,Math.cos(a)*size*.28,-.03],[Math.sin(a)*size*.64,Math.cos(a)*size*.64,.04]],.018,gold,group);
    }
    const center=new THREE.Mesh(new THREE.SphereGeometry(.1,16,12),gold); center.scale.z=.6; center.position.z=.14; bloom.add(center);
    for(let i=0;i<7;i++) {
      const a=i*Math.PI*2/7;
      const stamen=new THREE.Mesh(new THREE.SphereGeometry(.034,8,6),diamond);
      stamen.position.set(Math.cos(a)*.105,Math.sin(a)*.105,.17); bloom.add(stamen);
    }
  }
  flower(-.48,.45,.28,.89,-.13);
  flower(.64,1.02,.08,.91,.12);

  function bud(x,y,z,length,angle) {
    const group=new THREE.Group(); group.position.set(x,y,z); group.rotation.z=angle; model.add(group);
    // Lathed teardrop enamel in a three-rib gold cage.
    const profile=[];
    for(let i=0;i<=24;i++) {const t=i/24; profile.push(new THREE.Vector2(Math.pow(Math.sin(Math.PI*t),1.15)*length*.2,length*t));}
    const mesh=new THREE.Mesh(new THREE.LatheGeometry(profile,20),pearl); group.add(mesh);
    for(let i=0;i<3;i++) {
      const a=i*Math.PI*2/3+.3, points=[];
      for(let k=0;k<=20;k++) {
        const t=k/20,r=Math.pow(Math.sin(Math.PI*t),1.15)*length*.2+.009;
        points.push([Math.cos(a)*r,length*t,Math.sin(a)*r]);
      }
      tube(points,.012,gold,group);
    }
    const calyx=new THREE.Mesh(new THREE.SphereGeometry(length*.09,12,8),enamel); calyx.scale.y=1.6; group.add(calyx);
  }
  function spray(base, tips) {
    for(const [x,y,len,angle] of tips) {
      const dx=x-base[0],dy=y-base[1];
      stem([base,[base[0]+dx*.24,base[1]+dy*.48,.1],[x,y,.06]],.026);
      bud(x,y,.06,len,angle);
    }
  }
  spray([-3.1,.4,0],[[-2.86,1.12,.55,-.85],[-2.65,.89,.61,-.7],[-3.01,.77,.5,-.55]]);
  spray([-2.76,-.1,.1],[[-2.99,-.67,.55,3.25],[-2.73,-.77,.62,3.1],[-2.49,-.67,.52,3.05]]);
  spray([1.23,-.44,0],[[1.22,.83,.66,.25],[1.67,.73,.64,-.4],[1.5,.45,.51,-.24]]);
  spray([2.27,-.02,.02],[[2.61,.56,.52,-.88],[2.87,.33,.5,-1.1],[2.47,.26,.45,-.85]]);
  spray([2.38,-.6,.06],[[2.18,-1.02,.48,3.45],[2.44,-1,.5,3.32]]);

  // Pavé leaves: faceted stones, warm metal backs and individual bezels.
  const gemPositions=[], mounts=[];
  function pave(x,y,z,length,width,angle) {
    const group=new THREE.Group(); group.position.set(x,y,z); group.rotation.z=angle; model.add(group);
    group.add(new THREE.Mesh(petalGeometry(length,width,.06,.025),darkGold));
    const edge=[];
    for(let i=0;i<=64;i++) {
      const t=i/64;
      edge.push([Math.pow(Math.sin(Math.PI*t),.68)*width*(.58+.42*t),length*t,.06+.06*t*t+.025*Math.sin(Math.PI*t)]);
    }
    tube(edge,.017,gold,group); tube(edge.map(p=>[-p[0],p[1],p[2]]),.017,gold,group);
    group.updateMatrixWorld(true);
    for(let row=1;row<11;row++) {
      const t=row/12, w=Math.pow(Math.sin(Math.PI*t),.68)*width*(.58+.42*t);
      const radius=Math.min(.083,w*.43), spacing=radius*2.1;
      for(let col=-Math.floor((w-radius)/spacing);col<=Math.floor((w-radius)/spacing);col++) {
        const px=col*spacing, py=t*length+(col%2)*.025;
        const p=new THREE.Vector3(px,py,.12+.06*t*t+.025*(px/w)**2*Math.sin(Math.PI*t));
        const matrix=new THREE.Matrix4().compose(p,new THREE.Quaternion().setFromEuler(new THREE.Euler(.1*Math.sin(row),.15*Math.cos(col),row*1.7+col)),new THREE.Vector3(radius,radius,radius));
        gemPositions.push(group.matrixWorld.clone().multiply(matrix));
        const mount=new THREE.Matrix4().compose(new THREE.Vector3(px,py,p.z-.01),new THREE.Quaternion(),new THREE.Vector3(radius,radius,radius));
        mounts.push(group.matrixWorld.clone().multiply(mount));
      }
    }
    tube([[0,0,.09],[0,length*.5,.13],[0,length,.12]],.012,gold,group);
  }
  pave(-.7,-.44,.26,1.55,.29,1.78);
  pave(-.46,-.63,.31,1.2,.24,3.63);
  pave(.37,-.77,.31,1.02,.22,3.95);
  pave(.51,-.35,.1,.7,.2,-.17);
  pave(.02,-.12,.14,.64,.18,.6);
  const gemVertices=[],gemIndices=[],n=8;
  for(const [radius,z] of [[.44,.56],[1,.06],[.94,-.09],[.05,-.6]]) for(let i=0;i<n;i++) {
    const a=i/n*Math.PI*2; gemVertices.push(Math.cos(a)*radius,Math.sin(a)*radius,z);
  }
  for(let ring=0;ring<3;ring++) for(let i=0;i<n;i++) {
    const a=ring*n+i,b=ring*n+(i+1)%n;gemIndices.push(a,b,a+n,b,b+n,a+n);
  }
  for(let i=1;i<n-1;i++)gemIndices.push(0,i,i+1);
  let gemGeo=new THREE.BufferGeometry();gemGeo.setAttribute('position',new THREE.Float32BufferAttribute(gemVertices,3));gemGeo.setIndex(gemIndices);
  const indexedGem=gemGeo;gemGeo=gemGeo.toNonIndexed();indexedGem.dispose();gemGeo.computeVertexNormals();
  const gems=new THREE.InstancedMesh(gemGeo,diamond,gemPositions.length);
  gemPositions.forEach((matrix,i)=>gems.setMatrixAt(i,matrix));model.add(gems);
  const bezels=new THREE.InstancedMesh(new THREE.TorusGeometry(1,.085,5,12),gold,mounts.length);
  mounts.forEach((matrix,i)=>bezels.setMatrixAt(i,matrix));model.add(bezels);

  // Render only on interaction, resize, or the short entrance. No idle loop.
  const home={x:-.11,y:-.12}; let target={...home}, frame=0, disposed=false, visible=true;
  let entranceStart=null, entranceDone=reduced.matches;
  model.rotation.set(home.x,home.y,-.035);
  function draw(now) {
    frame=0; if(disposed||!visible||document.hidden)return;
    let unsettled=false;
    if(!entranceDone) {
      if(entranceStart===null)entranceStart=now;
      const t=Math.min(1,(now-entranceStart)/1800);
      flowers.forEach((flower,i)=>{const p=THREE.MathUtils.clamp((t-i*.12)/.85,0,1);flower.scale.setScalar(.7+.3*(1-(1-p)**3));});
      entranceDone=t===1;unsettled=!entranceDone;
    }
    for(const axis of ['x','y']) {
      const delta=target[axis]-model.rotation[axis];
      model.rotation[axis]+=reduced.matches?delta:delta*.16;
      unsettled ||= Math.abs(delta)>.0005;
    }
    renderer.render(scene,camera);
    if(unsettled)requestDraw();
  }
  function requestDraw(){if(!frame&&!disposed&&visible&&!document.hidden)frame=requestAnimationFrame(draw);}
  function resize(){const {width,height}=stage.getBoundingClientRect();if(!width||!height)return;renderer.setSize(width,height,false);camera.aspect=width/height;camera.position.z=Math.max(10.2,4.1/(Math.tan(THREE.MathUtils.degToRad(16))*camera.aspect));camera.updateProjectionMatrix();requestDraw();}
  const sizeObserver=new ResizeObserver(resize);sizeObserver.observe(stage);
  const visibilityObserver=new IntersectionObserver(entries=>{visible=entries[0].isIntersecting;if(visible)requestDraw();else {cancelAnimationFrame(frame);frame=0;}},{threshold:0});
  visibilityObserver.observe(stage);
  let pointer=null;
  canvas.addEventListener('pointerdown',event=>{if(event.button!==0)return;pointer={id:event.pointerId,x:event.clientX,y:event.clientY};canvas.setPointerCapture(event.pointerId);canvas.classList.add('is-dragging');});
  canvas.addEventListener('pointermove',event=>{if(!pointer||event.pointerId!==pointer.id)return;target.y+=(event.clientX-pointer.x)*.009;target.x=THREE.MathUtils.clamp(target.x+(event.clientY-pointer.y)*.007,-.8,.8);pointer.x=event.clientX;pointer.y=event.clientY;requestDraw();});
  function release(){pointer=null;canvas.classList.remove('is-dragging');}
  canvas.addEventListener('pointerup',release);canvas.addEventListener('pointercancel',release);canvas.addEventListener('lostpointercapture',release);
  function restore(){target={...home};requestDraw();}
  canvas.addEventListener('keydown',event=>{
    if(!['ArrowLeft','ArrowRight','ArrowUp','ArrowDown','Home'].includes(event.key))return;
    event.preventDefault();
    if(event.key==='Home')restore();
    else {target.y+=event.key==='ArrowLeft'?-.14:event.key==='ArrowRight'?.14:0;target.x=THREE.MathUtils.clamp(target.x+(event.key==='ArrowUp'?-.12:event.key==='ArrowDown'?.12:0),-.8,.8);requestDraw();}
  });
  reset.addEventListener('click',restore);
  function motionChange(){if(reduced.matches){entranceDone=true;flowers.forEach(f=>f.scale.setScalar(1));}requestDraw();}
  reduced.addEventListener('change',motionChange);
  document.addEventListener('visibilitychange',requestDraw);
  canvas.addEventListener('webglcontextlost',event=>{event.preventDefault();host.classList.remove('is-ready');host.classList.add('is-fallback');host.querySelector('.jewel-fallback').removeAttribute('aria-hidden');cancelAnimationFrame(frame);});
  canvas.addEventListener('webglcontextrestored',()=>{host.classList.remove('is-fallback');host.classList.add('is-ready');host.querySelector('.jewel-fallback').setAttribute('aria-hidden','true');frame=0;requestDraw();});
  resize(); renderer.render(scene,camera); host.classList.add('is-ready'); reset.hidden=false;
  host.querySelector('.jewel-fallback').setAttribute('aria-hidden','true');
  window.addEventListener('pagehide',event=>{
    if(event.persisted)return;
    disposed=true;cancelAnimationFrame(frame);sizeObserver.disconnect();visibilityObserver.disconnect();
    const geometries=new Set(),materials=new Set();
    scene.traverse(object=>{if(object.geometry)geometries.add(object.geometry);if(object.material)materials.add(object.material);});
    geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());env.dispose();renderer.dispose();
    reduced.removeEventListener('change',motionChange);document.removeEventListener('visibilitychange',requestDraw);
  },{once:true});
}
