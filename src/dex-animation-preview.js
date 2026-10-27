// 与原二点五维展台共用弹窗，动画预览使用Canvas 2D，支持无WebGL设备。
import {sprite} from './data.js';
import {creatureMotion} from './creature-animation.js';
import {creatureAttackPose} from './creature-combat-vfx.js';
import {drawLayeredCreature,layerAssetStatus,animationPolicy,LAYER_ACTIONS,LAYER_RIGS} from './creature-layer-animation.js';
import {ACTION_SEQUENCES} from './creature-action-sequences.js';
import {creaturePreviewSize} from './creature-preview-layout.js';
import {retainCreatureAnimations,releaseCreatureAnimations} from './creature-animation-resources.js';
import {disposeCreatureImage} from './creature-image-cache.js';
let stopActive=()=>{},selectActive=()=>{};
export function closeDexAnimation(){stopActive();stopActive=()=>{};selectActive=()=>{};}
export function selectDexAnimationAction(action){if(LAYER_ACTIONS.includes(action))selectActive(action);}
export function openDexAnimation(id,host,{action='idle',reduced=false,label='',onStatus=()=>{}}={}){
 closeDexAnimation();host.replaceChildren();delete host.dataset.error;
 const canvas=document.createElement('canvas');canvas.setAttribute('role','img');canvas.setAttribute('aria-label',label);host.append(canvas);
 const ctx=canvas.getContext('2d');if(!ctx)return;
 const media=matchMedia('(prefers-reduced-motion: reduce)'),mobile=matchMedia('(max-width: 600px)');
 let stopped=false,frame=0,last=-Infinity,start=performance.now(),selected=action,mirror=false;
 let img;const src=sprite(id);if(src){img=new Image();img.src=src;img.onerror=()=>{if(!stopped){host.dataset.art='unavailable';onStatus('unavailable');}};}
 const select=value=>{selected=value;start=performance.now();last=-Infinity;};selectActive=select;
 const flip=()=>{mirror=!mirror;last=-Infinity;};canvas.addEventListener('click',flip);
 const resize=()=>{const policy=animationPolicy({mobile:mobile.matches,dpr:devicePixelRatio});canvas.width=Math.max(1,Math.round(host.clientWidth*policy.dpr));canvas.height=Math.max(1,Math.round(host.clientHeight*policy.dpr));last=-Infinity;};
 const observer=new ResizeObserver(resize);observer.observe(host);resize();
 let lastResourceStatus='',lastLabel='';
 const tick=now=>{
  if(stopped)return;
  if(!host.isConnected){closeDexAnimation();return;}
  frame=requestAnimationFrame(tick);if(document.hidden)return;
  const quiet=reduced||media.matches,policy=animationPolicy({mobile:mobile.matches,reduced:quiet});
  retainCreatureAnimations('preview',[id],{reduced:quiet});
  const status=layerAssetStatus(id),ready=!!img?.complete&&img.naturalWidth>0;
  if(now-last<1000/(policy.fps||4)&&status===lastResourceStatus)return;
  last=now;const time=quiet?0:(now-start)/1000,w=canvas.width,h=canvas.height,size=creaturePreviewSize(ACTION_SEQUENCES[id],w,h);
  host.dataset.previewSize=String(size);
  ctx.clearRect(0,0,w,h);
  const gradient=ctx.createRadialGradient(w/2,h*.55,0,w/2,h*.55,size*.6);gradient.addColorStop(0,'#8bd5b02b');gradient.addColorStop(1,'#10253600');ctx.fillStyle=gradient;ctx.fillRect(0,0,w,h);
  const groundY=h*.5+size*(472/512-.5);
  ctx.fillStyle='#030b1744';ctx.beginPath();ctx.ellipse(w/2,groundY,size*.25,size*.05,0,0,Math.PI*2);ctx.fill();
  let representation='original';
  const layered=drawLayeredCreature(ctx,id,{x:w/2,y:h*.5,size,time,action:{name:selected},reduced:quiet,mobile:mobile.matches,mirror,onRepresentation:value=>{representation=value;}});
  if(!layered&&ready){
   const motion=creatureMotion(id,time,{moving:selected==='move',attacking:selected==='attack',hurt:selected==='hurt',reduced:quiet});
   const pose=creatureAttackPose(id,selected==='cast'?(time%1)*.15:selected==='attack'?(time%.8)/.8:0,quiet||!['cast','attack'].includes(selected));
   ctx.save();ctx.translate(w/2+motion.x+pose.x,h/2+motion.y+pose.y);ctx.rotate(motion.rotation+pose.rotation);ctx.scale((mirror?-1:1)*motion.sx*pose.sx,motion.sy*pose.sy);ctx.drawImage(img,-size*.4,-size*.4,size*.8,size*.8);ctx.restore();
  }
  const current=layered?'layered':status==='loading'?'loading':status==='rework'&&ready?'rework':ready?'fallback':'unavailable';
  host.dataset.art=current;host.dataset.representation=representation;host.dataset.species=String(id);host.dataset.action=selected;host.dataset.reduced=String(quiet);host.dataset.fps=String(policy.fps);
  lastResourceStatus=status;const label=representation==='attack-frames'?'keyframes':representation.endsWith('-frames')?representation:
   current==='fallback'&&ACTION_SEQUENCES[id]&&!LAYER_RIGS[id]?(quiet?'sequenceReduced':selected==='idle'?'portraitIdle':'sequenceFallback'):current;
  if(label!==lastLabel){lastLabel=label;onStatus(label);}
 };
 frame=requestAnimationFrame(tick);
 stopActive=()=>{stopped=true;cancelAnimationFrame(frame);observer.disconnect();canvas.removeEventListener('click',flip);releaseCreatureAnimations('preview');if(img){disposeCreatureImage(img);img=null;}canvas.width=canvas.height=0;canvas.remove();};
}
