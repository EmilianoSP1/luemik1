import{r as s,j as y}from"./app-B7szPEA7.js";import{u as P,at as T,al as B,z as N,aP as k,am as A,a as E,_ as H,C as D,W as G,aQ as U,aR as W,S as X,aO as Z,Z as q,B as b}from"./extends-BEUgk0tW.js";function V(e,t,c){const n=P(v=>v.size),a=P(v=>v.viewport),o=typeof e=="number"?e:n.width*a.dpr,l=n.height*a.dpr,f=(typeof e=="number"?c:e)||{},{samples:r=0,depth:m,...g}=f,u=s.useMemo(()=>{const v=new T(o,l,{minFilter:N,magFilter:N,type:B,...g});return m&&(v.depthTexture=new k(o,l,A)),v.samples=r,v},[]);return s.useLayoutEffect(()=>{u.setSize(o,l),r&&(u.samples=r)},[r,u,o,l]),s.useEffect(()=>()=>u.dispose(),[]),u}const Y=e=>typeof e=="function",Q=s.forwardRef(({envMap:e,resolution:t=256,frames:c=1/0,makeDefault:n,children:a,...o},l)=>{const f=P(({set:i})=>i),r=P(({camera:i})=>i),m=P(({size:i})=>i),g=s.useRef(null);s.useImperativeHandle(l,()=>g.current,[]);const u=s.useRef(null),v=V(t);s.useLayoutEffect(()=>{o.manual||(g.current.aspect=m.width/m.height)},[m,o]),s.useLayoutEffect(()=>{g.current.updateProjectionMatrix()});let d=0,x=null;const p=Y(a);return E(i=>{p&&(c===1/0||d<c)&&(u.current.visible=!1,i.gl.setRenderTarget(v),x=i.scene.background,e&&(i.scene.background=e),i.gl.render(i.scene,g.current),i.scene.background=x,i.gl.setRenderTarget(null),u.current.visible=!0,d++)}),s.useLayoutEffect(()=>{if(n){const i=r;return f(()=>({camera:g.current})),()=>f(()=>({camera:i}))}},[g,n,f]),s.createElement(s.Fragment,null,s.createElement("perspectiveCamera",H({ref:g},o),!p&&a),s.createElement("group",{ref:u},p&&a(v.texture)))}),J=Math.PI/180;function K(e){return e*J}function ee(e,t){var v;const c=U.physical,{vertexShader:n,fragmentShader:a,uniforms:o}=c,l=c.defines??{},f=W.clone(o),r=new e(t.material||{});r.color&&(f.diffuse.value=r.color),"roughness"in r&&(f.roughness.value=r.roughness),"metalness"in r&&(f.metalness.value=r.metalness),"envMap"in r&&(f.envMap.value=r.envMap),"envMapIntensity"in r&&(f.envMapIntensity.value=r.envMapIntensity),Object.entries(t.uniforms??{}).forEach(([d,x])=>{f[d]=x!==null&&typeof x=="object"&&"value"in x?x:{value:x}});let m=`${t.header}
${t.vertexHeader??""}
${n}`,g=`${t.header}
${t.fragmentHeader??""}
${a}`;for(const[d,x]of Object.entries(t.vertex??{}))m=m.replace(d,`${d}
${x}`);for(const[d,x]of Object.entries(t.fragment??{}))g=g.replace(d,`${d}
${x}`);return new X({defines:{...l},uniforms:f,vertexShader:m,fragmentShader:g,lights:!0,fog:!!((v=t.material)!=null&&v.fog)})}const te=({children:e})=>y.jsx(Z,{dpr:[1,2],frameloop:"always",className:"beams-container",children:e}),ne=e=>{const t=e.replace("#",""),c=parseInt(t.substring(0,2),16),n=parseInt(t.substring(2,4),16),a=parseInt(t.substring(4,6),16);return[c/255,n/255,a/255]},re=`
float random (in vec2 st) {
    return fract(sin(dot(st.xy,
                         vec2(12.9898,78.233)))*
        43758.5453123);
}
float noise (in vec2 st) {
    vec2 i = floor(st);
    vec2 f = fract(st);
    float a = random(i);
    float b = random(i + vec2(1.0, 0.0));
    float c = random(i + vec2(0.0, 1.0));
    float d = random(i + vec2(1.0, 1.0));
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(a, b, u.x) +
           (c - a)* u.y * (1.0 - u.x) +
           (d - b) * u.x * u.y;
}
vec4 permute(vec4 x){return mod(((x*34.0)+1.0)*x, 289.0);}
vec4 taylorInvSqrt(vec4 r){return 1.79284291400159 - 0.85373472095314 * r;}
vec3 fade(vec3 t) {return t*t*t*(t*(t*6.0-15.0)+10.0);}
float cnoise(vec3 P){
  vec3 Pi0 = floor(P);
  vec3 Pi1 = Pi0 + vec3(1.0);
  Pi0 = mod(Pi0, 289.0);
  Pi1 = mod(Pi1, 289.0);
  vec3 Pf0 = fract(P);
  vec3 Pf1 = Pf0 - vec3(1.0);
  vec4 ix = vec4(Pi0.x, Pi1.x, Pi0.x, Pi1.x);
  vec4 iy = vec4(Pi0.yy, Pi1.yy);
  vec4 iz0 = Pi0.zzzz;
  vec4 iz1 = Pi1.zzzz;
  vec4 ixy = permute(permute(ix) + iy);
  vec4 ixy0 = permute(ixy + iz0);
  vec4 ixy1 = permute(ixy + iz1);
  vec4 gx0 = ixy0 / 7.0;
  vec4 gy0 = fract(floor(gx0) / 7.0) - 0.5;
  gx0 = fract(gx0);
  vec4 gz0 = vec4(0.5) - abs(gx0) - abs(gy0);
  vec4 sz0 = step(gz0, vec4(0.0));
  gx0 -= sz0 * (step(0.0, gx0) - 0.5);
  gy0 -= sz0 * (step(0.0, gy0) - 0.5);
  vec4 gx1 = ixy1 / 7.0;
  vec4 gy1 = fract(floor(gx1) / 7.0) - 0.5;
  gx1 = fract(gx1);
  vec4 gz1 = vec4(0.5) - abs(gx1) - abs(gy1);
  vec4 sz1 = step(gz1, vec4(0.0));
  gx1 -= sz1 * (step(0.0, gx1) - 0.5);
  gy1 -= sz1 * (step(0.0, gy1) - 0.5);
  vec3 g000 = vec3(gx0.x,gy0.x,gz0.x);
  vec3 g100 = vec3(gx0.y,gy0.y,gz0.y);
  vec3 g010 = vec3(gx0.z,gy0.z,gz0.z);
  vec3 g110 = vec3(gx0.w,gy0.w,gz0.w);
  vec3 g001 = vec3(gx1.x,gy1.x,gz1.x);
  vec3 g101 = vec3(gx1.y,gy1.y,gz1.y);
  vec3 g011 = vec3(gx1.z,gy1.z,gz1.z);
  vec3 g111 = vec3(gx1.w,gy1.w,gz1.w);
  vec4 norm0 = taylorInvSqrt(vec4(dot(g000,g000),dot(g010,g010),dot(g100,g100),dot(g110,g110)));
  g000 *= norm0.x; g010 *= norm0.y; g100 *= norm0.z; g110 *= norm0.w;
  vec4 norm1 = taylorInvSqrt(vec4(dot(g001,g001),dot(g011,g011),dot(g101,g101),dot(g111,g111)));
  g001 *= norm1.x; g011 *= norm1.y; g101 *= norm1.z; g111 *= norm1.w;
  float n000 = dot(g000, Pf0);
  float n100 = dot(g100, vec3(Pf1.x,Pf0.yz));
  float n010 = dot(g010, vec3(Pf0.x,Pf1.y,Pf0.z));
  float n110 = dot(g110, vec3(Pf1.xy,Pf0.z));
  float n001 = dot(g001, vec3(Pf0.xy,Pf1.z));
  float n101 = dot(g101, vec3(Pf1.x,Pf0.y,Pf1.z));
  float n011 = dot(g011, vec3(Pf0.x,Pf1.yz));
  float n111 = dot(g111, Pf1);
  vec3 fade_xyz = fade(Pf0);
  vec4 n_z = mix(vec4(n000,n100,n010,n110),vec4(n001,n101,n011,n111),fade_xyz.z);
  vec2 n_yz = mix(n_z.xy,n_z.zw,fade_xyz.y);
  float n_xyz = mix(n_yz.x,n_yz.y,fade_xyz.x);
  return 2.2 * n_xyz;
}
`,ie=({beamWidth:e=2,beamHeight:t=15,beamNumber:c=12,lightColor:n="#ffffff",speed:a=2,noiseIntensity:o=1.75,scale:l=.2,rotation:f=0})=>{const r=s.useRef(null),m=s.useMemo(()=>ee(G,{header:`
  varying vec3 vEye;
  varying float vNoise;
  varying vec2 vUv;
  varying vec3 vPosition;
  uniform float time;
  uniform float uSpeed;
  uniform float uNoiseIntensity;
  uniform float uScale;
  ${re}`,vertexHeader:`
  float getPos(vec3 pos) {
    vec3 noisePos =
      vec3(pos.x * 0., pos.y - uv.y, pos.z + time * uSpeed * 3.) * uScale;
    return cnoise(noisePos);
  }
  vec3 getCurrentPos(vec3 pos) {
    vec3 newpos = pos;
    newpos.z += getPos(pos);
    return newpos;
  }
  vec3 getNormal(vec3 pos) {
    vec3 curpos = getCurrentPos(pos);
    vec3 nextposX = getCurrentPos(pos + vec3(0.01, 0.0, 0.0));
    vec3 nextposZ = getCurrentPos(pos + vec3(0.0, -0.01, 0.0));
    vec3 tangentX = normalize(nextposX - curpos);
    vec3 tangentZ = normalize(nextposZ - curpos);
    return normalize(cross(tangentZ, tangentX));
  }`,fragmentHeader:"",vertex:{"#include <begin_vertex>":"transformed.z += getPos(transformed.xyz);","#include <beginnormal_vertex>":"objectNormal = getNormal(position.xyz);"},fragment:{"#include <dithering_fragment>":`
    float randomNoise = noise(gl_FragCoord.xy);
    gl_FragColor.rgb -= randomNoise / 15. * uNoiseIntensity;`},material:{fog:!0},uniforms:{diffuse:new D(...ne("#000000")),time:{shared:!0,mixed:!0,linked:!0,value:0},roughness:.3,metalness:.3,uSpeed:{shared:!0,mixed:!0,linked:!0,value:a},envMapIntensity:10,uNoiseIntensity:o,uScale:l}}),[a,o,l]);return y.jsxs(te,{children:[y.jsxs("group",{rotation:[0,0,K(f)],children:[y.jsx(S,{ref:r,material:m,count:c,width:e,height:t}),y.jsx(se,{color:n,position:[0,3,10]})]}),y.jsx("ambientLight",{intensity:1}),y.jsx("color",{attach:"background",args:["#000000"]}),y.jsx(Q,{makeDefault:!0,position:[0,0,20],fov:30})]})};function oe(e,t,c,n,a){const o=new q,l=e*(a+1)*2,f=e*a*2,r=new Float32Array(l*3),m=new Uint32Array(f*3),g=new Float32Array(l*2);let u=0,v=0,d=0;const p=-(e*t+(e-1)*n)/2;for(let i=0;i<e;i++){const h=p+i*(t+n),w=Math.random()*300,_=Math.random()*300;for(let z=0;z<=a;z++){const M=c*(z/a-.5),C=[h,M,0],O=[h+t,M,0];r.set([...C,...O],u*3);const j=z/a;if(g.set([w,j+_,w+1,j+_],d),z<a){const $=u,R=u+1,I=u+2,L=u+3;m.set([$,R,I,I,R,L],v),v+=6}u+=2,d+=4}}return o.setAttribute("position",new b(r,3)),o.setAttribute("uv",new b(g,2)),o.setIndex(new b(m,1)),o.computeVertexNormals(),o}const F=s.forwardRef(({material:e,width:t,count:c,height:n},a)=>{const o=s.useRef(null);s.useImperativeHandle(a,()=>o.current);const l=s.useMemo(()=>oe(c,t,n,0,100),[c,t,n]);return E((f,r)=>{o.current.material.uniforms.time.value+=.1*r}),y.jsx("mesh",{ref:o,geometry:l,material:e})});F.displayName="MergedPlanes";const S=s.forwardRef((e,t)=>y.jsx(F,{ref:t,material:e.material,width:e.width,count:e.count,height:e.height}));S.displayName="PlaneNoise";const se=({position:e,color:t})=>{const c=s.useRef(null);return s.useEffect(()=>{if(!c.current)return;const n=c.current.shadow.camera;n&&(n.top=24,n.bottom=-24,n.left=-24,n.right=24,n.far=64,c.current.shadow.bias=-.004)},[]),y.jsx("directionalLight",{ref:c,color:t,intensity:1,position:e})};export{ie as B};
