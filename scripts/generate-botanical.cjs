// Code-native botanical illustration. Run from any directory to regenerate the inline SVG.
const fs = require('node:fs');
const path = require('node:path');
const f = n => Number(n.toFixed(2));
const parts = [];
const point = (p,t) => {
  const u=1-t;
  return [u*u*u*p[0][0]+3*u*u*t*p[1][0]+3*u*t*t*p[2][0]+t*t*t*p[3][0],u*u*u*p[0][1]+3*u*u*t*p[1][1]+3*u*t*t*p[2][1]+t*t*t*p[3][1]];
};
function leaf(x,y,angle,size,start,tone=0) {
  parts.push(`<g transform="translate(${f(x)} ${f(y)}) rotate(${f(angle)})"><g class="leaf" data-start="${f(start)}" data-end="${f(start+.14)}"><path fill="url(#green-${tone})" d="M0 0 C${f(size*.12)} ${f(-size*.42)} ${f(size*.66)} ${f(-size*.45)} ${size} 0 C${f(size*.64)} ${f(size*.31)} ${f(size*.27)} ${f(size*.42)} 0 0Z"/><path class="vein" d="M1 0 Q${f(size*.45)} ${f(-size*.03)} ${f(size*.94)} 0"/><path class="small-vein" d="M${f(size*.3)} 0 l${f(size*.06)} ${f(-size*.17)} M${f(size*.5)} 0 l${f(size*.1)} ${f(-size*.22)} M${f(size*.47)} 0 l${f(size*.12)} ${f(size*.18)}"/></g></g>`);
}
function branch(p,width,start,end,count,seed) {
  parts.push(`<path class="stem" stroke-width="${width}" data-start="${start}" data-end="${end}" pathLength="1" d="M${p[0].join(' ')} C${p.slice(1).map(v=>v.join(' ')).join(' ')}"/>`);
  for(let i=0;i<count;i++) {
    const t=.2+(i/(count-1))*.72, pos=point(p,t), next=point(p,Math.min(t+.005,1));
    const angle=Math.atan2(next[1]-pos[1],next[0]-pos[0])*180/Math.PI;
    const size=f((24+7*Math.sin(i*1.9+seed))*(1-.3*t));
    const at=start+(end-start)*t;
    leaf(...pos,angle+46+9*Math.sin(i),size,at,(i+seed)%3);
    if(i%3!==1)leaf(...pos,angle-52,size*.88,at+.02,(i+seed+1)%3);
  }
}
// Every stem runs from the shared lower-right root towards an upper-left tip.
branch([[451,443],[407,381],[260,230],[94,80]],2.6,0,.62,13,0);
branch([[451,443],[445,310],[360,209],[351,94]],2,.03,.64,9,1);
branch([[440,430],[323,395],[180,392],[102,290]],1.9,.06,.62,9,2);
branch([[335,304],[249,264],[262,201],[224,153]],1.5,.26,.67,5,1);
branch([[248,227],[182,216],[169,159],[155,132]],1.3,.34,.74,4,0);
branch([[380,381],[334,342],[289,337],[266,309]],1.4,.2,.64,4,2);
branch([[192,370],[181,341],[163,329],[148,318]],1.1,.47,.76,3,1);
branch([[411,324],[379,285],[358,258],[329,246]],1.3,.28,.7,4,0);

function flowerWrap(x,y,size,angle,start,contents) {
  return `<g transform="translate(${x} ${y}) rotate(${angle}) scale(${size})"><g class="bloom" data-start="${start}" data-end="${f(start+.22)}">${contents}</g></g>`;
}
function rose(x,y,size,angle,start) {
  let s='';
  for(let i=0;i<5;i++)s+=`<path transform="rotate(${i*72})" fill="#3d674b" d="M-5 5 Q-19 -11 -8 -34 Q-1 -23 6 -5Z"/>`;
  s+='<circle r="22" fill="#bd718a"/>';
  // Overlapping, irregular cup-shaped petals, with folded edges and a tight centre.
  for(const [count,scale,offset] of [[7,1,0],[6,.76,26],[5,.5,4],[4,.29,38]]) {
    for(let i=0;i<count;i++) {
      const a=i*360/count+offset;
      const sy=scale*(1+.055*Math.sin(i*3));
      s+=`<g transform="rotate(${f(a)}) scale(${scale} ${f(sy)})"><path fill="url(#rose-petal)" stroke="#c98496" stroke-width=".45" d="M-15 3 C-28 -1 -31 -13 -24 -20 C-21 -29 -9 -32 -3 -28 C7 -35 21 -26 23 -18 C30 -6 16 3 4 6 Q-6 1 -15 3Z"/><path d="M-23 -19 Q-10 -30 0 -25 Q13 -28 20 -19" fill="none" stroke="#ffece8" stroke-width="1.1" opacity=".7"/></g>`;
    }
  }
  s+='<path d="M-3 4 C-8 -3 -1 -9 5 -4 C10 2 3 7 -1 2 C-4 -2 2 -4 3 -1" fill="#d494a5" stroke="#a95f79" stroke-width="1"/>';
  parts.push(flowerWrap(x,y,size,angle,start,s));
}
function daisy(x,y,size,angle,start) {
  let s='';
  for(let i=0;i<13;i++) {
    s+=`<path transform="rotate(${f(i*360/13)})" d="M-2 2 C-6 -5 -7 -20 -2 -24 C4 -27 6 -17 4 -10 L2 2Z" fill="url(#daisy-petal)" stroke="#d8d7be" stroke-width=".55"/>`;
  }
  s+='<circle r="6.4" fill="url(#pollen)"/>';
  for(let i=0;i<19;i++){const a=i*2.4,r=1+Math.sqrt(i)*1.1;s+=`<circle cx="${f(Math.cos(a)*r)}" cy="${f(Math.sin(a)*r)}" r=".65" fill="${i%2?'#a58136':'#f6d77d'}"/>`;}
  parts.push(flowerWrap(x,y,size,angle,start,s));
}
rose(94,80,1.05,-20,.66);
rose(224,153,.87,32,.7);
rose(329,246,1.02,-10,.69);
rose(148,318,.75,18,.76);
daisy(155,132,.87,14,.75);
daisy(351,94,.82,-12,.69);
daisy(266,309,.94,24,.67);
// One small rosebud on the low lateral branch.
parts.push(flowerWrap(102,290,.8,-28,.73,'<path d="M-5 7 C-15 -4 -9 -19 0 -20 C12 -16 12 -2 5 7Z" fill="url(#rose-petal)"/><path d="M0 -16 Q-6 -5 3 4" fill="none" stroke="#bc738c"/><path d="M-6 12 Q-13 0 -10 -5 L1 7 L9 -8 Q13 4 5 12Z" fill="#476a46"/>'));

const svg=`<aside class="botanical" aria-hidden="true"><svg viewBox="0 0 480 475" xmlns="http://www.w3.org/2000/svg" focusable="false"><defs>
<linearGradient id="green-0" x2=".3" y2="1"><stop stop-color="#244e3a"/><stop offset="1" stop-color="#63825b"/></linearGradient>
<linearGradient id="green-1" x2=".2" y2="1"><stop stop-color="#3c694a"/><stop offset="1" stop-color="#83936b"/></linearGradient>
<linearGradient id="green-2" x2=".6" y2="1"><stop stop-color="#234c3d"/><stop offset="1" stop-color="#496f4d"/></linearGradient>
<linearGradient id="rose-petal" x1=".2" y1="0" x2=".6" y2="1"><stop stop-color="#fce5df"/><stop offset=".48" stop-color="#efb5c0"/><stop offset="1" stop-color="#c07892"/></linearGradient>
<linearGradient id="daisy-petal" x2=".3" y2="1"><stop stop-color="#fffef8"/><stop offset=".65" stop-color="#f2f0df"/><stop offset="1" stop-color="#d7d6ad"/></linearGradient>
<radialGradient id="pollen" cx=".35" cy=".3"><stop stop-color="#e4c46d"/><stop offset="1" stop-color="#b48e36"/></radialGradient>
</defs>${parts.join('\n')}</svg></aside>`;
const file=path.join(__dirname,'../dist/index.html');
let html=fs.readFileSync(file,'utf8');
html=html.replace(/<aside class="botanical"[\s\S]*?<\/aside>/,svg);
fs.writeFileSync(file,html);
