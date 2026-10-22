// 图鉴可选的2.5D舞台：仅把已验收的透明立绘作为纹理，不把平面图谎称为完整3D模型。
import * as THREE from '../node_modules/three/build/three.module.js';
import {sprite, SPECIES} from './data.js';
import {stagePalette} from './dex-stage-theme.js';
let disposeActive=()=>{};
export function closeDexStage(){disposeActive();disposeActive=()=>{};}
export function openDexStage(id,host){
 closeDexStage();
 const art=sprite(id),species=SPECIES[id],palette=stagePalette(id);
 if(!art||!species){host.textContent='该形态尚无通过验收的独立原画，暂不开放3D展台。';return;}
 const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
 const scene=new THREE.Scene();
 const camera=new THREE.PerspectiveCamera(36,1,.1,100);camera.position.set(0,0,7);
 let renderer;
 try{renderer=new THREE.WebGLRenderer({antialias:true,alpha:true,powerPreference:'low-power'});}
 catch{host.textContent='当前浏览器无法启用WebGL，仍可查看普通2D图鉴。';return;}
 renderer.setPixelRatio(Math.min(window.devicePixelRatio||1,2));renderer.outputColorSpace=THREE.SRGBColorSpace;
 host.append(renderer.domElement);
 const root=new THREE.Group();scene.add(root);
 const ring=new THREE.Mesh(new THREE.TorusGeometry(1.95,.045,10,100),new THREE.MeshBasicMaterial({color:palette.primary,transparent:true,opacity:.75}));ring.rotation.x=.32;root.add(ring);
 const back=new THREE.Mesh(new THREE.CircleGeometry(1.75,64),new THREE.MeshBasicMaterial({color:0x23314a,transparent:true,opacity:.56,side:THREE.DoubleSide}));back.position.z=-.3;root.add(back);
 const spots=new Float32Array(120*3);
 for(let i=0;i<120;i++){const a=i*2.3999632,r=2.05+((i*17)%31)/80;spots[i*3]=Math.cos(a)*r;spots[i*3+1]=Math.sin(a)*r;spots[i*3+2]=-.3+((i*7)%17)/20;}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.BufferAttribute(spots,3));
 const particles=new THREE.Points(geometry,new THREE.PointsMaterial({color:palette.secondary,size:.038,transparent:true,opacity:.7}));scene.add(particles);
 const loader=new THREE.TextureLoader();let texture,portrait;let stopped=false;
 loader.load(art,t=>{
  if(stopped){t.dispose();return;}
  texture=t;t.colorSpace=THREE.SRGBColorSpace;
  const ratio=t.image.width/t.image.height;
  portrait=new THREE.Mesh(new THREE.PlaneGeometry(3.1*ratio,3.1),new THREE.MeshBasicMaterial({map:t,transparent:true,side:THREE.DoubleSide,depthWrite:false}));
  portrait.position.z=.12;root.add(portrait);
 },undefined,()=>{if(!stopped)host.dataset.error='立绘加载失败，请检查资源文件。';});
 let dragging=false,lastX=0,angle=0,scale=1,frame=0;
 const pointerDown=e=>{dragging=true;lastX=e.clientX;renderer.domElement.setPointerCapture?.(e.pointerId);};
 const pointerMove=e=>{if(dragging){angle+=(e.clientX-lastX)*.008;lastX=e.clientX;}};
 const pointerUp=()=>{dragging=false;};
 const wheel=e=>{e.preventDefault();scale=Math.max(.7,Math.min(1.5,scale-e.deltaY*.001));};
 const canvas=renderer.domElement;canvas.addEventListener('pointerdown',pointerDown);canvas.addEventListener('pointermove',pointerMove);canvas.addEventListener('pointerup',pointerUp);canvas.addEventListener('pointercancel',pointerUp);canvas.addEventListener('wheel',wheel,{passive:false});
 const resize=()=>{const w=Math.max(1,host.clientWidth),h=Math.max(1,host.clientHeight);camera.aspect=w/h;camera.updateProjectionMatrix();renderer.setSize(w,h,false);};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 const clock=new THREE.Clock();
 const tick=()=>{if(stopped)return;frame=requestAnimationFrame(tick);const time=clock.getElapsedTime();root.rotation.y=angle+(reduced?0:Math.sin(time*.55)*.09);root.position.y=reduced?0:Math.sin(time*1.2)*.07;root.scale.setScalar(scale);if(!reduced)particles.rotation.z=time*.025;renderer.render(scene,camera);};
 tick();
 disposeActive=()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('pointerdown',pointerDown);canvas.removeEventListener('pointermove',pointerMove);canvas.removeEventListener('pointerup',pointerUp);canvas.removeEventListener('pointercancel',pointerUp);canvas.removeEventListener('wheel',wheel);portrait?.geometry.dispose();portrait?.material.dispose();texture?.dispose();ring.geometry.dispose();ring.material.dispose();back.geometry.dispose();back.material.dispose();geometry.dispose();particles.material.dispose();renderer.dispose();renderer.forceContextLoss();canvas.remove();};
}
