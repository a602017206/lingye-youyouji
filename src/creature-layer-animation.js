// 透明部件关键帧播放器：不参与伤害计算、存档或进化数值。
export {LAYER_RIGS} from './creature-layer-rigs.js';
import {LAYER_RIGS} from './creature-layer-rigs.js';
import {ATTACK_SEQUENCES,attackFrameAt,attackFrameImage} from './creature-attack-frames.js';
import {ACTION_SEQUENCES,sequenceFrameAt,sequencePoseAt,actionSequenceImage} from './creature-action-sequences.js';
import {createCreatureImageCache,creatureImageCache,atlasBytes} from './creature-image-cache.js';
export const LAYER_ACTIONS=Object.freeze(['idle','move','attack','hurt','cast']);
export function animationPolicy({mobile=false,reduced=false,dpr=1}={}){
 return {fps:reduced?0:mobile?20:60,dpr:Math.min(mobile?1:2,dpr),maxActors:3};
}
export function resolveLayerAction({preview,action,moving=false,hurt=false,hurtPhase}={}){
 if(LAYER_ACTIONS.includes(preview))return {name:preview};
 if(hurt)return {name:'hurt',...(Number.isFinite(hurtPhase)?{phase:Math.max(0,Math.min(1,hurtPhase))}:{})};
 if(action?.state==='windup')return {name:'cast',phase:action.progress};
 if(action?.state==='strike')return {name:'attack',phase:action.progress*.6};
 if(action?.state==='recover')return {name:'attack',phase:.6+action.progress*.4};
 return {name:moving?'move':'idle'};
}
// 五帧依次表示0%、25%、50%、75%、100%；角度为弧度。
// 通道为身体角度、尾巴、耳/翼、两个预留肢体、垂直位移、前后位移；附件绕局部锚点插值。
const clips={
 fox:{
  idle:[[0,-.09,0,0,0,0,0],[.008,.12,0,0,0,-.007,0],[0,.22,0,0,0,0,0],[-.008,.02,0,0,0,.003,0],[0,-.09,0,0,0,0,0]],
  move:[[-.12,-.20,0,0,0,0,-.03],[-.16,.12,0,0,0,-.06,.02],[.04,.4,0,0,0,-.10,.06],[-.05,.1,0,0,0,-.045,.02],[-.12,-.20,0,0,0,0,-.03]],
  attack:[[0,0,0,0,0,0,0],[-.18,-.25,0,0,0,.02,-.04],[.22,.5,0,0,0,-.025,.15],[.06,.22,0,0,0,0,.04],[0,0,0,0,0,0,0]],
  hurt:[[0,0,0,0,0,0,0],[-.45,-.32,0,0,0,.04,-.16],[.12,.2,0,0,0,.015,-.055],[-.08,.08,0,0,0,0,-.018],[0,0,0,0,0,0,0]],
  cast:[[0,0,0,0,0,0,0],[-.18,.5,0,0,0,-.09,-.015],[-.20,.9,0,0,0,-.17,0],[-.06,.6,0,0,0,-.12,0],[0,0,0,0,0,0,0]],
 },
 griffin:{
  idle:[[0,-.08,-.12,0,0,0,0],[.01,.08,.1,0,0,-.008,0],[0,.16,.22,0,0,-.012,0],[-.01,0,.06,0,0,-.006,0],[0,-.08,-.12,0,0,0,0]],
  move:[[-.12,-.12,-.6,0,0,0,-.025],[-.16,.1,.3,0,0,-.06,.025],[.04,.24,.65,0,0,-.10,.06],[-.05,.02,-.25,0,0,-.045,.02],[-.12,-.12,-.6,0,0,0,-.025]],
  attack:[[0,0,0,0,0,0,0],[-.18,-.2,-.38,0,0,.02,-.04],[.22,.32,.55,0,0,-.025,.15],[.06,.12,.14,0,0,0,.04],[0,0,0,0,0,0,0]],
  hurt:[[0,0,0,0,0,0,0],[-.45,-.2,-.6,0,0,.04,-.16],[.12,.12,-.22,0,0,.015,-.055],[-.08,-.04,-.1,0,0,0,-.018],[0,0,0,0,0,0,0]],
  cast:[[0,0,0,0,0,0,0],[-.18,-.2,.5,0,0,-.09,-.015],[-.20,.12,1.2,0,0,-.17,0],[-.06,.26,.8,0,0,-.12,0],[0,0,0,0,0,0,0]],
 },
};
// 独立形态编舞：初生轻快、成长双拍、觉醒蓄势；关键时间与肢体权重分别配置。
const choreography={
 301:{tempo:[1.6,.68,.65,.44,1.05],weights:[1,1.12,1.2,.95,1],timing:[0,.2,.46,.72,1]},
 302:{tempo:[2,.82,.78,.5,1.25],weights:[1.12,1.25,.85,1.3,1.15],timing:[0,.3,.48,.7,1]},
 303:{tempo:[2.5,1,.96,.6,1.6],weights:[1.26,1.5,1,1.5,1.28],timing:[0,.36,.54,.78,1]},
 316:{tempo:[1.5,.7,.62,.45,1.08],weights:[.9,1.12,1.2,.95,1],timing:[0,.2,.45,.7,1]},
 317:{tempo:[2.1,.86,.8,.54,1.4],weights:[1.08,1.15,1.32,1.2,1.2],timing:[0,.28,.5,.74,1]},
 318:{tempo:[2.8,1.1,1,.64,1.8],weights:[1.2,1.4,1.5,1.45,1.35],timing:[0,.36,.56,.8,1]},
};
function interpolate(frames,times,phase){
 const i=Math.max(0,Math.min(3,times.findIndex((t,i)=>i>0&&t>=phase)-1));
 const t=Math.max(0,Math.min(1,(phase-times[i])/(times[i+1]-times[i]))),ease=t*t*(3-2*t);
 return frames[i].map((v,c)=>v+(frames[i+1][c]-v)*ease);
}
export function layerPoseAt(id,time,{name='idle',phase,reduced=false,mobile=false}={}){
 const rig=LAYER_RIGS[id];if(!rig)return null;
 const profile=choreography[id],action=reduced?'idle':LAYER_ACTIONS.includes(name)?name:'idle';
 const duration=profile.tempo[LAYER_ACTIONS.indexOf(action)];
 const sampled=mobile?Math.floor(time*20)/20:time;
 const rawPhase=phase===undefined?((sampled%duration)+duration)%duration/duration:Math.max(0,Math.min(1,phase));
 const p=reduced?0:mobile&&phase!==undefined&&rawPhase<1?Math.floor(rawPhase*duration*20)/(duration*20):rawPhase;
 const values=reduced?[0,0,0,0,0,0,0]:interpolate(clips[rig.family][action],profile.timing,p);
 const [body,tail,appendage,front,back]=values.map((v,i)=>v*(profile.weights[i]??1));
 const facing=[301,303].includes(Number(id))?-1:1;
 return {duration:reduced?0:duration,phase:reduced?0:p,root:{rotation:body*(rig.rootMotion??1)*facing,x:values[6]*(1+rig.stage*.08)*facing,y:values[5],sx:1,sy:1},layers:rig.layers.map(layer=>{
  const c=layer.channel;
  const rotation=c==='body'?0:c==='tail'?tail:c==='wingFront'?appendage:c==='wingBack'?-appendage*.8:c==='earFront'?appendage:c==='earBack'?-appendage*.7:c==='legFront'?front:back;
  return {...layer,rotation:rotation*(layer.motionWeight??1),x:0,y:0,sx:1,sy:1};
 })};
}
export function createLayerAssetCache(createImage=()=>new Image()){
 return layerCache(createCreatureImageCache({createImage}));
}
function layerCache(images){
 return {
  get(id){
   const rig=LAYER_RIGS[id];if(!rig||rig.quality!=='approved')return null;
   return images.get(rig.src,atlasBytes(rig.layers.map(layer=>layer.source)));
  },
  status(id){const rig=LAYER_RIGS[id];return !rig?'fallback':rig.quality!=='approved'?'rework':({ready:'layered',failed:'fallback',loading:'loading'})[images.status(rig.src)];},
  clear:()=>images.clear(),
 };
}
const assets=layerCache(creatureImageCache);
export const layerAssetStatus=id=>assets.status(id);
export function drawLayeredCreature(ctx,id,{x=0,y=0,size=100,time=0,action={name:'idle'},mirror=false,reduced=false,mobile=false,getImage=key=>assets.get(key),getAttackImage=attackFrameImage,getActionImage=actionSequenceImage,onRepresentation=()=>{}}={}){
 const rig=LAYER_RIGS[id],sequence=ACTION_SEQUENCES[id]?.[action.name];
 if((!rig&&!sequence)||(rig&&rig.quality!=='approved'))return false;
 const pose=rig?layerPoseAt(id,time,{...action,reduced,mobile}):sequencePoseAt(sequence,time,{...action,reduced,mobile});
 const actionImage=sequence&&!reduced?getActionImage(id,action.name):null;
 if(actionImage){
  ctx.save();ctx.translate(x-size/2,y-size/2);
  if(mirror){ctx.translate(size,0);ctx.scale(-1,1);}
  if(sequence.mirror){ctx.translate(size,0);ctx.scale(-1,1);}
  // 完整姿态自行表现承重和关节变化；不叠加旧的整图位移、旋转或浮动。
  const scale=sequence.scale;
  ctx.drawImage(actionImage,...sequence.frames[sequenceFrameAt(sequence,pose.phase)],(1-scale)*size/2,(1-scale)*sequence.baseline*size,scale*size,scale*size);
  ctx.restore();onRepresentation(action.name+'-frames');return true;
 }
 if(!rig)return false;
 const img=getImage(id);if(!img)return false;
 ctx.save();ctx.translate(x-size/2,y-size/2);
 if(mirror){ctx.translate(size,0);ctx.scale(-1,1);}
 // 先变换角色父节点，附件锚点随躯干一起运动，再执行附件自己的小幅摆动。
 const [rootX,rootY]=rig.rootAnchor??[.5,.65];
 ctx.translate((rootX+pose.root.x)*size,(rootY+pose.root.y)*size);ctx.rotate(pose.root.rotation);ctx.scale(pose.root.sx,pose.root.sy);ctx.translate(-rootX*size,-rootY*size);
 const frames=action.name==='attack'&&!reduced?getAttackImage(id):null;
 if(frames){
  const sequence=ATTACK_SEQUENCES[id];
  if(sequence.mirror){ctx.translate(size,0);ctx.scale(-1,1);}
  // 四帧共用1.2倍显示倍率，保持素材472/512处的脚底基线，避免切换时角色骤然缩小。
  ctx.drawImage(frames,...sequence.frames[attackFrameAt(pose.phase)],-.1*size,-.184375*size,1.2*size,1.2*size);
  ctx.restore();onRepresentation('attack-frames');return true;
 }
 for(const layer of [...pose.layers].sort((a,b)=>a.order-b.order)){
  ctx.save();ctx.translate((layer.position[0]+layer.x)*size,(layer.position[1]+layer.y)*size);ctx.rotate(layer.rotation);
  ctx.scale(layer.sx*(layer.mirror?-1:1),layer.sy);
  const w=layer.size[0]*size,h=layer.size[1]*size;
  ctx.drawImage(img,...layer.source,-layer.anchor[0]*w,-layer.anchor[1]*h,w,h);ctx.restore();
 }
 ctx.restore();onRepresentation('layers');return true;
}
